-- Give each paid send-credit bundle the same number of UBL document generations.
-- Also make generation debits idempotent per user, UBL document type and document number.

begin;

alter table public.conversions
 add column if not exists document_type text;

update public.conversions
set document_type = case
 when ubl_xml like '%<ubl:CreditNote %' or ubl_xml like '%<CreditNote %' then 'CreditNote'
 else 'Invoice'
end
where document_type is null;

alter table public.conversions
 alter column document_type set default 'Invoice',
 alter column document_type set not null;

alter table public.conversions
 drop constraint if exists conversions_document_type_check;
alter table public.conversions
 add constraint conversions_document_type_check check (document_type in ('Invoice', 'CreditNote'));

create table if not exists public.ubl_credit_consumptions (
 user_id uuid not null references auth.users(id) on delete cascade,
 document_type text not null check (document_type in ('Invoice', 'CreditNote')),
 normalized_document_number text not null check (length(normalized_document_number) > 0),
 consumed_at timestamptz not null default now(),
 primary key (user_id, document_type, normalized_document_number)
);

alter table public.ubl_credit_consumptions enable row level security;
revoke all on table public.ubl_credit_consumptions from public, anon, authenticated, hermes_operator;
grant all on table public.ubl_credit_consumptions to service_role;

-- Existing generated documents establish the idempotency key without changing balances.
insert into public.ubl_credit_consumptions(user_id, document_type, normalized_document_number, consumed_at)
select user_id,
       document_type,
       lower(btrim(invoice_number)),
       min(coalesce(created_at, now()))
from public.conversions
where user_id is not null
  and nullif(btrim(invoice_number), '') is not null
group by user_id, document_type, lower(btrim(invoice_number))
on conflict (user_id, document_type, normalized_document_number) do nothing;

-- Keep the idempotency ledger complete while the previous Vercel deployment is
-- still live and inserts conversions directly after calling use_credit(uuid).
create or replace function public.record_ubl_credit_consumption_from_conversion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_type text;
begin
 v_type := case
  when new.ubl_xml like '%<ubl:CreditNote %' or new.ubl_xml like '%<CreditNote %' then 'CreditNote'
  else coalesce(new.document_type, 'Invoice')
 end;
 new.document_type := v_type;
 if nullif(btrim(new.invoice_number), '') is not null then
  insert into public.ubl_credit_consumptions(user_id, document_type, normalized_document_number, consumed_at)
  values (new.user_id, v_type, lower(btrim(new.invoice_number)), coalesce(new.created_at, now()))
  on conflict (user_id, document_type, normalized_document_number) do nothing;
 end if;
 return new;
end;
$$;

revoke all on function public.record_ubl_credit_consumption_from_conversion() from public, anon, authenticated, hermes_operator;
drop trigger if exists record_ubl_credit_consumption_after_conversion on public.conversions;
drop trigger if exists record_ubl_credit_consumption_before_conversion on public.conversions;
create trigger record_ubl_credit_consumption_before_conversion
before insert on public.conversions
for each row execute function public.record_ubl_credit_consumption_from_conversion();

create table if not exists public.bundle_ubl_credit_grants (
 purchase_id uuid primary key references public.send_credit_purchases(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete cascade,
 credits integer not null check (credits > 0),
 reason text not null check (reason in ('bundle_purchase', 'bundle_backfill')),
 granted_at timestamptz not null default now()
);

alter table public.bundle_ubl_credit_grants enable row level security;
revoke all on table public.bundle_ubl_credit_grants from public, anon, authenticated, hermes_operator;
grant all on table public.bundle_ubl_credit_grants to service_role;

-- This trigger is the compatibility boundary for in-flight calls that still run
-- the pre-migration grant_send_credit_bundle body. Trigger DDL serializes with
-- concurrent inserts, and each purchase grants document credits in that same transaction.
create or replace function public.grant_bundle_ubl_credits_from_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
 insert into public.bundle_ubl_credit_grants(purchase_id, user_id, credits, reason)
 values (new.id, new.user_id, new.credits, 'bundle_purchase')
 on conflict (purchase_id) do nothing;

 if found then
  update public.user_profiles
  set credits = credits + new.credits
  where id = new.user_id;
  if not found then raise exception 'profile_not_found'; end if;
 end if;

 return new;
end;
$$;

revoke all on function public.grant_bundle_ubl_credits_from_purchase() from public, anon, authenticated, hermes_operator;

drop trigger if exists grant_bundle_ubl_credits_after_purchase on public.send_credit_purchases;
create trigger grant_bundle_ubl_credits_after_purchase
after insert on public.send_credit_purchases
for each row execute function public.grant_bundle_ubl_credits_from_purchase();

-- Production has no public.credit_ledger. send_credit_purchases is the send-credit ledger;
-- bundle_ubl_credit_grants is the generation-credit ledger and idempotency marker.
-- Hold purchase inserts until the historical backfill and replacement RPC commit.
lock table public.send_credit_purchases in share row exclusive mode;

with claimed as (
 insert into public.bundle_ubl_credit_grants(purchase_id, user_id, credits, reason, granted_at)
 select id, user_id, credits, 'bundle_backfill', now()
 from public.send_credit_purchases
 on conflict (purchase_id) do nothing
 returning user_id, credits
), totals as (
 select user_id, sum(credits)::integer as credits
 from claimed
 group by user_id
)
update public.user_profiles up
set credits = up.credits + totals.credits
from totals
where up.id = totals.user_id;

-- Preserve the old signature while the previous Vercel deployment is live.
-- New code uses the document-aware overload below.
create or replace function public.use_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to use credit' using errcode = '42501';
 end if;
 update public.user_profiles
 set credits = credits - 1
 where id = p_user_id and credits > 0;
 return found;
end;
$$;

create or replace function public.use_credit(
 p_user_id uuid,
 p_document_type text,
 p_document_number text
)
returns table(allowed boolean, credit_used boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_type text;
 v_number text;
 v_plan text;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to use credit' using errcode = '42501';
 end if;

 v_type := case lower(regexp_replace(coalesce(p_document_type, ''), '[^a-zA-Z]', '', 'g'))
  when 'invoice' then 'Invoice'
  when 'creditnote' then 'CreditNote'
  else null
 end;
 v_number := lower(btrim(coalesce(p_document_number, '')));
 if v_type is null or v_number = '' then
  raise exception 'valid document type and number required' using errcode = '22023';
 end if;

 select coalesce(plan, 'free') into v_plan
 from public.user_profiles
 where id = p_user_id
 for update;
 if not found then
  raise exception 'profile_not_found';
 end if;

 if v_plan <> 'free' then
  insert into public.ubl_credit_consumptions(user_id, document_type, normalized_document_number)
  values (p_user_id, v_type, v_number)
  on conflict (user_id, document_type, normalized_document_number) do nothing;
  return query select true, false;
  return;
 end if;

 if exists (
  select 1 from public.ubl_credit_consumptions c
  where c.user_id = p_user_id
    and c.document_type = v_type
    and c.normalized_document_number = v_number
 ) then
  return query select true, false;
  return;
 end if;

 update public.user_profiles
 set credits = credits - 1
 where id = p_user_id and credits > 0;
 if not found then
  return query select false, false;
  return;
 end if;

 insert into public.ubl_credit_consumptions(user_id, document_type, normalized_document_number)
 values (p_user_id, v_type, v_number);
 return query select true, true;
end;
$$;

create or replace function public.can_use_credit(
 p_user_id uuid,
 p_document_type text,
 p_document_number text
)
returns boolean
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
 v_type text;
 v_number text;
 v_plan text;
 v_credits integer;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to check credit' using errcode = '42501';
 end if;
 v_type := case lower(regexp_replace(coalesce(p_document_type, ''), '[^a-zA-Z]', '', 'g'))
  when 'invoice' then 'Invoice'
  when 'creditnote' then 'CreditNote'
  else null
 end;
 v_number := lower(btrim(coalesce(p_document_number, '')));
 if v_type is null then return false; end if;

 select coalesce(plan, 'free'), credits into v_plan, v_credits
 from public.user_profiles where id = p_user_id;
 if not found then return false; end if;
 if v_plan <> 'free' or v_credits > 0 then return true; end if;
 if v_number = '' then return false; end if;
 return exists (
  select 1 from public.ubl_credit_consumptions c
  where c.user_id = p_user_id
    and c.document_type = v_type
    and c.normalized_document_number = v_number
 );
end;
$$;

-- Compatibility for the previous deployment's debit-then-insert flow.
create or replace function public.release_ubl_credit(p_user_id uuid)
returns table(credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to release UBL credit' using errcode = '42501';
 end if;
 return query
 update public.user_profiles up
 set credits = up.credits + 1
 where up.id = p_user_id
 returning up.credits;
end;
$$;

drop function if exists public.release_ubl_credit(uuid, text, text);

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
  total_amount, invoice_number, currency, source_pdf_stored, document_type
 ) values (
  p_user_id, p_filename, 'done', p_ubl_xml, p_customer_name, p_customer_email,
  p_total_amount, p_invoice_number, p_currency, false, v_type
 ) returning id into v_conversion_id;

 return query select v_conversion_id, coalesce(v_credit.credit_used, false);
end;
$$;

create or replace function public.grant_send_credit_bundle(
 p_user_id uuid,
 p_bundle_id text,
 p_credits integer,
 p_amount numeric,
 p_payment_id text,
 p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_purchase_id uuid;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to grant send credits' using errcode = '42501';
 end if;
 if p_credits <= 0 then
  raise exception 'credits must be positive' using errcode = '22023';
 end if;

 insert into public.send_credit_purchases(user_id, bundle_id, credits, amount, payment_id, expires_at)
 values (p_user_id, p_bundle_id, p_credits, p_amount, p_payment_id, p_expires_at)
 on conflict (payment_id) do nothing
 returning id into v_purchase_id;

 if v_purchase_id is not null then
  update public.user_profiles
  set send_credits = send_credits + p_credits,
      send_credits_expires_at = greatest(coalesce(send_credits_expires_at, p_expires_at), p_expires_at)
  where id = p_user_id;
  if not found then raise exception 'profile_not_found'; end if;
 end if;
end;
$$;

-- PDF conversion confirmation uses the same central document-credit rule.
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
  total_amount, invoice_number, currency, source_pdf_filename, source_pdf_stored, document_type
 ) values (
  p_user_id, p_filename, 'done', p_ubl_xml, p_customer_name, p_customer_email,
  p_total_amount, p_invoice_number, p_currency, p_source_pdf_filename, false, v_type
 ) returning id into v_conversion_id;

 update public.conversion_drafts
 set status = 'confirmed', conversion_id = v_conversion_id,
     invoice_data = '{}'::jsonb, assumptions = '[]'::jsonb, updated_at = now()
 where id = p_draft_id;

 return query select v_conversion_id, false, coalesce(v_credit.credit_used, false);
end;
$$;

-- Compatibility wrapper for the previous Invoice-only PDF confirmation route.
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
 p_currency text
)
returns table(conversion_id uuid, already_confirmed boolean, credit_used boolean)
language sql
security definer
set search_path = ''
as $$
 select * from public.confirm_conversion_draft(
  p_user_id, p_draft_id, p_filename, p_source_pdf_filename, p_ubl_xml,
  p_customer_name, p_customer_email, p_total_amount, p_invoice_number,
  p_currency,
  case
   when p_ubl_xml like '%<ubl:CreditNote %' or p_ubl_xml like '%<CreditNote %' then 'CreditNote'
   else 'Invoice'
  end
  );
$$;

revoke all on function public.use_credit(uuid, text, text) from public, anon, authenticated, hermes_operator;
revoke all on function public.use_credit(uuid) from public, anon, authenticated, hermes_operator;
revoke all on function public.can_use_credit(uuid, text, text) from public, anon, authenticated, hermes_operator;
revoke all on function public.create_generated_conversion(uuid, text, text, text, text, numeric, text, text, text) from public, anon, authenticated, hermes_operator;
revoke all on function public.grant_send_credit_bundle(uuid, text, integer, numeric, text, timestamptz) from public, anon, authenticated, hermes_operator;
revoke all on function public.grant_bundle_ubl_credits_from_purchase() from public, anon, authenticated, hermes_operator;
revoke all on function public.record_ubl_credit_consumption_from_conversion() from public, anon, authenticated, hermes_operator;
revoke all on function public.release_ubl_credit(uuid) from public, anon, authenticated, hermes_operator;
revoke all on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, text, numeric, text, text, text) from public, anon, authenticated, hermes_operator;
revoke all on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, text, numeric, text, text) from public, anon, authenticated, hermes_operator;

grant execute on function public.use_credit(uuid, text, text) to service_role;
grant execute on function public.use_credit(uuid) to service_role;
grant execute on function public.can_use_credit(uuid, text, text) to service_role;
grant execute on function public.create_generated_conversion(uuid, text, text, text, text, numeric, text, text, text) to service_role;
grant execute on function public.grant_send_credit_bundle(uuid, text, integer, numeric, text, timestamptz) to service_role;
grant execute on function public.release_ubl_credit(uuid) to service_role;
grant execute on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, text, numeric, text, text, text) to service_role;
grant execute on function public.confirm_conversion_draft(uuid, uuid, text, text, text, text, text, numeric, text, text) to service_role;

commit;
