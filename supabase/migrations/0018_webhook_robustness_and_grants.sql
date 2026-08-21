-- Webhook robustness and service-role-only grant hygiene.

create or replace function public.claim_mollie_webhook_event(
 p_event_key text,
 p_mollie_payment_id text,
 p_payment_status text,
 p_processing_stale_after interval default interval '2 minutes'
)
returns table(event_key text, action text)
language plpgsql
security definer
set search_path = public
as $$
declare
 v_existing public.webhook_events%rowtype;
begin
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

revoke all on function public.claim_mollie_webhook_event(text, text, text, interval) from public;
grant execute on function public.claim_mollie_webhook_event(text, text, text, interval) to service_role;

create table if not exists public.recommand_webhook_events (
 id uuid primary key default gen_random_uuid(),
 event_key text not null unique,
 event_type text,
 company_id text,
 status text,
 raw_body_hash text not null,
 payload jsonb not null,
 processing_status text not null default 'processed' check (processing_status in ('processed','failed')),
 error_message text,
 received_at timestamptz not null default now(),
 processed_at timestamptz
);

create index if not exists recommand_webhook_events_company_idx
 on public.recommand_webhook_events(company_id, received_at desc);

alter table public.recommand_webhook_events enable row level security;

revoke all on table public.webhook_events from anon, authenticated;
revoke all on table public.recommand_webhook_events from anon, authenticated;
grant all on table public.recommand_webhook_events to service_role;
