-- Lock down SECURITY DEFINER RPCs that mutate credits, send credits, or billing counters.
-- These functions are only valid behind server routes using the Supabase service-role key.

create or replace function public.use_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare ok boolean := false;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to use credit' using errcode = '42501';
 end if;

 update public.user_profiles
 set credits = credits - 1
 where id = p_user_id and credits > 0;
 if found then ok := true; end if;
 return ok;
end;
$$;

create or replace function public.reserve_send_credit(p_user_id uuid)
returns table(send_credits integer, send_credits_expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to reserve send credit' using errcode = '42501';
 end if;

 return query
 update public.user_profiles up
 set send_credits = up.send_credits - 1
 where up.id = p_user_id
   and up.send_credits > 0
   and up.send_credits_expires_at is not null
   and up.send_credits_expires_at > now()
 returning up.send_credits, up.send_credits_expires_at;
end;
$$;

create or replace function public.release_send_credit(p_user_id uuid)
returns table(send_credits integer, send_credits_expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to release send credit' using errcode = '42501';
 end if;

 return query
 update public.user_profiles up
 set send_credits = up.send_credits + 1
 where up.id = p_user_id
 returning up.send_credits, up.send_credits_expires_at;
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
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to grant send credits' using errcode = '42501';
 end if;
 if p_credits <= 0 then
  raise exception 'credits must be positive' using errcode = '22023';
 end if;

 insert into public.send_credit_purchases(user_id, bundle_id, credits, amount, payment_id, expires_at)
 values (p_user_id, p_bundle_id, p_credits, p_amount, p_payment_id, p_expires_at)
 on conflict (payment_id) do nothing;

 if found then
  update public.user_profiles
  set send_credits = send_credits + p_credits,
      send_credits_expires_at = p_expires_at
  where id = p_user_id;
 end if;
end;
$$;

create or replace function public.increment_credits(p_user_id uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to increment credits' using errcode = '42501';
 end if;
 update public.user_profiles set credits = credits + amount where id = p_user_id;
end;
$$;

create or replace function public.claim_mollie_webhook_event(
 p_event_key text,
 p_mollie_payment_id text,
 p_payment_status text,
 p_processing_stale_after interval default '2 minutes'
)
returns table(event_key text, action text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_existing public.webhook_events%rowtype;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to claim webhook event' using errcode = '42501';
 end if;

 insert into public.webhook_events(event_key, mollie_payment_id, payment_status, status)
 values (p_event_key, p_mollie_payment_id, p_payment_status, 'processing')
 on conflict do nothing;

 if found then
  return query select p_event_key, 'claimed'::text;
  return;
 end if;

 select * into v_existing
 from public.webhook_events we
 where we.event_key = p_event_key
 for update;

 if not found then
  return query select p_event_key, 'duplicate'::text;
  return;
 end if;

 if v_existing.status = 'processed' then
  return query select p_event_key, 'processed_duplicate'::text;
  return;
 end if;

 if v_existing.status = 'failed'
    or (v_existing.status = 'processing' and coalesce(v_existing.received_at, now()) < now() - p_processing_stale_after) then
  update public.webhook_events
  set status = 'processing',
      mollie_payment_id = p_mollie_payment_id,
      payment_status = p_payment_status,
      error_message = null,
      processed_at = null,
      received_at = now()
  where public.webhook_events.event_key = p_event_key;

  return query select p_event_key, 'reclaimed'::text;
  return;
 end if;

 return query select p_event_key, 'processing_duplicate'::text;
end;
$$;

create or replace function public.next_billing_invoice_number()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 current_year int := extract(year from now())::int;
 next_number int;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to generate billing invoice number' using errcode = '42501';
 end if;

 insert into public.invoice_number_sequences(year, last_number)
 values (current_year, 1)
 on conflict (year) do update
 set last_number = public.invoice_number_sequences.last_number + 1,
     updated_at = now()
 returning last_number into next_number;
 return 'INV-' || current_year || '-' || lpad(next_number::text, 5, '0');
end;
$$;

revoke all on function public.use_credit(uuid) from public, anon, authenticated, hermes_operator;
revoke all on function public.reserve_send_credit(uuid) from public, anon, authenticated, hermes_operator;
revoke all on function public.release_send_credit(uuid) from public, anon, authenticated, hermes_operator;
revoke all on function public.grant_send_credit_bundle(uuid, text, integer, numeric, text, timestamptz) from public, anon, authenticated, hermes_operator;
revoke all on function public.increment_credits(uuid, integer) from public, anon, authenticated, hermes_operator;
revoke all on function public.claim_mollie_webhook_event(text, text, text, interval) from public, anon, authenticated, hermes_operator;
revoke all on function public.next_billing_invoice_number() from public, anon, authenticated, hermes_operator;
revoke all on function public.handle_new_user() from public, anon, authenticated, hermes_operator;

grant execute on function public.use_credit(uuid) to service_role;
grant execute on function public.reserve_send_credit(uuid) to service_role;
grant execute on function public.release_send_credit(uuid) to service_role;
grant execute on function public.grant_send_credit_bundle(uuid, text, integer, numeric, text, timestamptz) to service_role;
grant execute on function public.increment_credits(uuid, integer) to service_role;
grant execute on function public.claim_mollie_webhook_event(text, text, text, interval) to service_role;
grant execute on function public.next_billing_invoice_number() to service_role;