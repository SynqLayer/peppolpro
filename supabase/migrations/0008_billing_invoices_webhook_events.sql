-- Billing invoices, credit invoices, webhook idempotency and cancel-at-period-end state.

alter table public.subscriptions
 add column if not exists cancel_at_period_end boolean not null default false,
 add column if not exists canceled_at timestamptz;

alter table public.invoices
 add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null,
 add column if not exists payment_id uuid references public.payments(id) on delete set null,
 add column if not exists amount numeric(12,2),
 add column if not exists vat_amount numeric(12,2),
 add column if not exists vat_rate numeric(5,2) default 21,
 add column if not exists issued_at timestamptz,
 add column if not exists invoice_kind text not null default 'sales'
  check (invoice_kind in ('sales','subscription','credit')),
 add column if not exists original_invoice_id uuid references public.invoices(id) on delete set null,
 add column if not exists original_invoice_number text;

create unique index if not exists invoices_invoice_number_unique
 on public.invoices(invoice_number);

create table if not exists public.invoice_number_sequences (
 year int primary key,
 last_number int not null default 0,
 updated_at timestamptz default now()
);

create or replace function public.next_billing_invoice_number()
returns text
language plpgsql
security definer
as $$
declare
 current_year int := extract(year from now())::int;
 next_number int;
begin
 insert into public.invoice_number_sequences(year, last_number)
 values (current_year, 1)
 on conflict (year) do update
 set last_number = public.invoice_number_sequences.last_number + 1,
     updated_at = now()
 returning last_number into next_number;
 return 'INV-' || current_year || '-' || lpad(next_number::text, 5, '0');
end;
$$;

create table if not exists public.webhook_events (
 id uuid primary key default gen_random_uuid(),
 event_key text not null unique,
 mollie_payment_id text,
 payment_status text,
 status text not null default 'processing' check (status in ('processing','processed','failed')),
 error_message text,
 received_at timestamptz default now(),
 processed_at timestamptz
);

create index if not exists webhook_events_payment_idx
 on public.webhook_events(mollie_payment_id, payment_status);

alter table public.webhook_events enable row level security;

-- Webhook events are internal audit records: no authenticated user policy, service role only.
