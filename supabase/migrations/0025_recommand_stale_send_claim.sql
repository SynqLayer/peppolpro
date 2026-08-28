-- Recommand send stale-claim recovery.

alter table public.conversions
 add column if not exists recommand_claimed_at timestamptz;

alter table public.invoices
 add column if not exists recommand_claimed_at timestamptz;

create index if not exists conversions_recommand_sending_claim_idx
 on public.conversions (recommand_claimed_at)
 where recommand_status = 'sending'
   and recommand_document_id is null
   and sent_via_recommand_at is null;

create index if not exists invoices_recommand_sending_claim_idx
 on public.invoices (recommand_claimed_at)
 where recommand_status = 'sending'
   and recommand_document_id is null
   and sent_via_recommand_at is null;

create or replace function public.claim_recommand_send_target(
 p_target_table text,
 p_target_id uuid,
 p_user_id uuid,
 p_stale_after_minutes integer default 10
)
returns table(
 id uuid,
 user_id uuid,
 ubl_xml text,
 total_amount numeric,
 recommand_document_id text,
 recommand_status text,
 recommand_claimed_at timestamptz,
 sent_via_recommand_at timestamptz,
 claimed boolean,
 claim_action text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_existing record;
 v_stale_after interval := make_interval(mins => greatest(p_stale_after_minutes, 1));
 v_claim_action text := 'claimed';
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to claim Recommand send target' using errcode = '42501';
 end if;

 if p_target_table not in ('conversions', 'invoices') then
  raise exception 'invalid Recommand send target table' using errcode = '22023';
 end if;

 if p_target_table = 'conversions' then
  select c.id, c.user_id, c.ubl_xml, c.total_amount, c.recommand_document_id, c.recommand_status, c.recommand_claimed_at, c.sent_via_recommand_at, c.created_at
  into v_existing
  from public.conversions c
  where c.id = p_target_id and c.user_id = p_user_id
  for update;
 else
  select i.id, i.user_id, i.ubl_xml, i.total_incl as total_amount, i.recommand_document_id, i.recommand_status, i.recommand_claimed_at, i.sent_via_recommand_at, i.created_at
  into v_existing
  from public.invoices i
  where i.id = p_target_id and i.user_id = p_user_id
  for update;
 end if;

 if not found then
  return;
 end if;

 if v_existing.recommand_document_id is not null or v_existing.sent_via_recommand_at is not null then
  return query select v_existing.id, v_existing.user_id, v_existing.ubl_xml, v_existing.total_amount, v_existing.recommand_document_id, v_existing.recommand_status, v_existing.recommand_claimed_at, v_existing.sent_via_recommand_at, false, 'already_completed'::text;
  return;
 end if;

 if v_existing.recommand_status = 'duplicate_voided' then
  return query select v_existing.id, v_existing.user_id, v_existing.ubl_xml, v_existing.total_amount, v_existing.recommand_document_id, v_existing.recommand_status, v_existing.recommand_claimed_at, v_existing.sent_via_recommand_at, false, 'duplicate_voided'::text;
  return;
 end if;

 if v_existing.recommand_status = 'sending'
    and coalesce(v_existing.recommand_claimed_at, v_existing.created_at, now()) > now() - v_stale_after then
   return query select v_existing.id, v_existing.user_id, v_existing.ubl_xml, v_existing.total_amount, v_existing.recommand_document_id, v_existing.recommand_status, v_existing.recommand_claimed_at, v_existing.sent_via_recommand_at, false, 'already_sending'::text;
   return;
 end if;

 if v_existing.recommand_status = 'sending'
    and coalesce(v_existing.recommand_claimed_at, v_existing.created_at, '-infinity'::timestamptz) <= now() - v_stale_after then
  v_claim_action := 'reclaimed';
 end if;

 if p_target_table = 'conversions' then
  update public.conversions c
  set recommand_status = 'sending',
      recommand_claimed_at = now()
  where c.id = p_target_id and c.user_id = p_user_id
  returning c.id, c.user_id, c.ubl_xml, c.total_amount, c.recommand_document_id, c.recommand_status, c.recommand_claimed_at, c.sent_via_recommand_at
  into v_existing;
 else
  update public.invoices i
  set recommand_status = 'sending',
      recommand_claimed_at = now()
  where i.id = p_target_id and i.user_id = p_user_id
  returning i.id, i.user_id, i.ubl_xml, i.total_incl as total_amount, i.recommand_document_id, i.recommand_status, i.recommand_claimed_at, i.sent_via_recommand_at
  into v_existing;
 end if;

 return query select v_existing.id, v_existing.user_id, v_existing.ubl_xml, v_existing.total_amount, v_existing.recommand_document_id, v_existing.recommand_status, v_existing.recommand_claimed_at, v_existing.sent_via_recommand_at, true, v_claim_action;
end;
$$;

revoke all on function public.claim_recommand_send_target(text, uuid, uuid, integer) from public, anon, authenticated, hermes_operator;
grant execute on function public.claim_recommand_send_target(text, uuid, uuid, integer) to service_role;
