begin;

alter table public.conversions
 add column if not exists ubl_credit_used boolean not null default false;

create table if not exists public.failed_send_ubl_credit_refunds (
 conversion_id uuid primary key references public.conversions(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 reason text not null check (reason in ('recommand_pre_send_validation_failed','recommand_provider_rejected')),
 refunded_at timestamptz not null default now()
);

alter table public.failed_send_ubl_credit_refunds enable row level security;
revoke all on table public.failed_send_ubl_credit_refunds from public, anon, authenticated, hermes_operator;
grant all on table public.failed_send_ubl_credit_refunds to service_role;

create or replace function public.release_failed_send_ubl_credit(
 p_conversion_id uuid,
 p_reason text
)
returns table(applied boolean, credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_user_id uuid;
 v_credit_used boolean;
 v_document_id text;
 v_sent_at timestamptz;
 v_claimed uuid;
 v_credits integer;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to release failed-send UBL credit' using errcode = '42501';
 end if;
 if p_reason not in ('recommand_pre_send_validation_failed','recommand_provider_rejected') then
  raise exception 'invalid failed-send UBL credit refund reason' using errcode = '22023';
 end if;

 select c.user_id, c.ubl_credit_used, c.recommand_document_id, c.sent_via_recommand_at
 into v_user_id, v_credit_used, v_document_id, v_sent_at
 from public.conversions c
 where c.id = p_conversion_id
 for update;
 if not found then raise exception 'conversion_not_found'; end if;

 if v_credit_used is not true or v_document_id is not null or v_sent_at is not null then
  return query select false, up.credits from public.user_profiles up where up.id = v_user_id;
  return;
 end if;

 insert into public.failed_send_ubl_credit_refunds(conversion_id, user_id, reason)
 values (p_conversion_id, v_user_id, p_reason)
 on conflict (conversion_id) do nothing
 returning conversion_id into v_claimed;
 if v_claimed is null then
  return query select false, up.credits from public.user_profiles up where up.id = v_user_id;
  return;
 end if;

 update public.user_profiles up
 set credits = up.credits + 1
 where up.id = v_user_id
 returning up.credits into v_credits;
 if not found then raise exception 'profile_not_found'; end if;
 return query select true, v_credits;
end;
$$;

create or replace function public.create_generated_conversion(
 p_user_id uuid,
 p_filename text,
 p_ubl_xml text,
 p_customer_name text,
 p_customer_email text,
 p_total_amount numeric,
 p_invoice_number text,
 p_currency text,
 p_document_type text
)
returns table(conversion_id uuid, credit_used boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_type text;
 v_credit record;
 v_conversion_id uuid;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to create generated conversion' using errcode = '42501';
 end if;
 v_type := case lower(regexp_replace(coalesce(p_document_type, ''), '[^a-zA-Z]', '', 'g'))
  when 'invoice' then 'Invoice'
  when 'creditnote' then 'CreditNote'
  else null
 end;
 if v_type is null or nullif(btrim(p_invoice_number), '') is null then
  raise exception 'valid document type and number required' using errcode = '22023';
 end if;

 select * into v_credit from public.use_credit(p_user_id, v_type, p_invoice_number);
 if not coalesce(v_credit.allowed, false) then raise exception 'insufficient_credits'; end if;

 insert into public.conversions(
  user_id, filename, status, ubl_xml, customer_name, customer_email,
  total_amount, invoice_number, currency, source_pdf_stored, document_type, ubl_credit_used
 ) values (
  p_user_id, p_filename, 'done', p_ubl_xml, p_customer_name, p_customer_email,
  p_total_amount, p_invoice_number, p_currency, false, v_type, coalesce(v_credit.credit_used, false)
 ) returning id into v_conversion_id;

 return query select v_conversion_id, coalesce(v_credit.credit_used, false);
end;
$$;

create or replace function public.confirm_conversion_draft(
 p_user_id uuid,
 p_draft_id uuid,
 p_filename text,
 p_source_pdf_filename text,
 p_ubl_xml text,
 p_customer_name text,
 p_customer_email text,
 p_total_amount numeric,
 p_invoice_number text,
 p_currency text,
 p_document_type text
)
returns table(conversion_id uuid, already_confirmed boolean, credit_used boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_draft public.conversion_drafts%rowtype;
 v_conversion_id uuid;
 v_credit record;
 v_type text;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to confirm conversion draft' using errcode = '42501';
 end if;

 select * into v_draft
 from public.conversion_drafts
 where id = p_draft_id and user_id = p_user_id
 for update;
 if not found then raise exception 'conversion_draft_not_found'; end if;
 if v_draft.status = 'confirmed' and v_draft.conversion_id is not null then
  return query select v_draft.conversion_id, true, false;
  return;
 end if;
 if v_draft.expires_at <= now() then raise exception 'conversion_draft_expired'; end if;

 v_type := case lower(regexp_replace(coalesce(p_document_type, ''), '[^a-zA-Z]', '', 'g'))
  when 'invoice' then 'Invoice'
  when 'creditnote' then 'CreditNote'
  else null
 end;
 if v_type is null then raise exception 'invalid_document_type'; end if;

 select * into v_credit from public.use_credit(p_user_id, v_type, p_invoice_number);
 if not coalesce(v_credit.allowed, false) then raise exception 'insufficient_credits'; end if;

 insert into public.conversions(
  user_id, filename, status, ubl_xml, customer_name, customer_email,
  total_amount, invoice_number, currency, source_pdf_filename, source_pdf_stored,
  document_type, ubl_credit_used
 ) values (
  p_user_id, p_filename, 'done', p_ubl_xml, p_customer_name, p_customer_email,
  p_total_amount, p_invoice_number, p_currency, p_source_pdf_filename, false,
  v_type, coalesce(v_credit.credit_used, false)
 ) returning id into v_conversion_id;

 update public.conversion_drafts
 set status = 'confirmed', conversion_id = v_conversion_id,
     invoice_data = '{}'::jsonb, assumptions = '[]'::jsonb, updated_at = now()
 where id = p_draft_id;

 return query select v_conversion_id, false, coalesce(v_credit.credit_used, false);
end;
$$;

revoke all on function public.release_failed_send_ubl_credit(uuid, text) from public, anon, authenticated, hermes_operator;
grant execute on function public.release_failed_send_ubl_credit(uuid, text) to service_role;
revoke all on function public.create_generated_conversion(uuid, text, text, text, text, numeric, text, text, text) from public, anon, authenticated, hermes_operator;
grant execute on function public.create_generated_conversion(uuid, text, text, text, text, numeric, text, text, text) to service_role;
revoke all on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, text, numeric, text, text, text) from public, anon, authenticated, hermes_operator;
grant execute on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, text, numeric, text, text, text) to service_role;

commit;
