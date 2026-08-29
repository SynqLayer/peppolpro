create table if not exists public.conversion_drafts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 filename text not null,
 invoice_data jsonb not null,
 assumptions jsonb not null default '[]'::jsonb,
 status text not null default 'draft' check (status in ('draft','confirmed')),
 conversion_id uuid references public.conversions(id) on delete set null,
 expires_at timestamptz not null default (now() + interval '14 days'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists conversion_drafts_user_status_idx
 on public.conversion_drafts(user_id, status, updated_at desc);

create index if not exists conversion_drafts_expiry_idx
 on public.conversion_drafts(expires_at)
 where status = 'draft';

alter table public.conversion_drafts enable row level security;

revoke all on table public.conversion_drafts from anon, authenticated;
grant select on table public.conversion_drafts to authenticated;
grant all on table public.conversion_drafts to service_role;

create policy "read own conversion drafts" on public.conversion_drafts
 for select using (auth.uid() = user_id);

-- No anon/authenticated insert/update/delete policies: draft writes happen only in server routes with service_role.

create or replace function public.confirm_conversion_draft(
 p_user_id uuid,
 p_draft_id uuid,
 p_filename text,
 p_ubl_xml text,
 p_customer_name text,
 p_customer_email text,
 p_total_amount numeric,
 p_invoice_number text,
 p_currency text
)
returns table(conversion_id uuid, already_confirmed boolean, credit_used boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
 v_draft public.conversion_drafts%rowtype;
 v_plan text;
 v_conversion_id uuid;
 v_credit_used boolean := false;
begin
 if auth.role() <> 'service_role' then
  raise exception 'service_role required to confirm conversion draft';
 end if;

 select * into v_draft
 from public.conversion_drafts
 where id = p_draft_id and user_id = p_user_id
 for update;

 if not found then
  raise exception 'conversion_draft_not_found';
 end if;

 if v_draft.status = 'confirmed' and v_draft.conversion_id is not null then
  return query select v_draft.conversion_id, true, false;
  return;
 end if;

 if v_draft.expires_at <= now() then
  raise exception 'conversion_draft_expired';
 end if;

 select coalesce(plan, 'free') into v_plan
 from public.user_profiles
 where id = p_user_id
 for update;

 if v_plan is null then
  raise exception 'profile_not_found';
 end if;

 if v_plan = 'free' then
  update public.user_profiles
  set credits = credits - 1
  where id = p_user_id and credits > 0;
  if not found then
   raise exception 'insufficient_credits';
  end if;
  v_credit_used := true;
 end if;

 insert into public.conversions(
  user_id,
  filename,
  status,
  ubl_xml,
  customer_name,
  customer_email,
  total_amount,
  invoice_number,
  currency
 ) values (
  p_user_id,
  p_filename,
  'done',
  p_ubl_xml,
  p_customer_name,
  p_customer_email,
  p_total_amount,
  p_invoice_number,
  p_currency
 ) returning id into v_conversion_id;

 update public.conversion_drafts
 set status = 'confirmed',
     conversion_id = v_conversion_id,
     invoice_data = '{}'::jsonb,
     assumptions = '[]'::jsonb,
     updated_at = now()
 where id = p_draft_id;

 return query select v_conversion_id, false, v_credit_used;
end;
$$;

revoke all on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, numeric, text, text) from public, anon, authenticated, hermes_operator;
grant execute on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, numeric, text, text) to service_role;

comment on table public.conversion_drafts is 'Short-lived parsed PDF conversion drafts. Contains normalized invoice fields and parser assumptions only, never raw model responses. Drafts expire after 14 days and are finalized server-side.';
comment on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, numeric, text, text) is 'Atomically finalizes one conversion draft, debits one starter credit for free users, inserts exactly one conversion, and returns the existing conversion on duplicate confirm.';
