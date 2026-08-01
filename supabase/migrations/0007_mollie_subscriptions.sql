-- Mollie subscription infrastructure for recurring monitoring plans.

create table if not exists public.subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 plan text not null check (plan in ('monitoring','monitoring_accountant')),
 mollie_customer_id text not null,
 mollie_subscription_id text,
 mollie_mandate_id text,
 current_period_start timestamptz,
 current_period_end timestamptz,
 subscription_status text not null default 'pending'
  check (subscription_status in ('pending','active','past_due','grace','canceled','suspended','expired')),
 last_payment_id text,
 last_webhook_status text,
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 unique (user_id),
 unique (mollie_subscription_id)
);

create index if not exists subscriptions_user_status_idx
 on public.subscriptions(user_id, subscription_status);

create index if not exists subscriptions_mollie_customer_idx
 on public.subscriptions(mollie_customer_id);

alter table public.payments
 add column if not exists mollie_customer_id text,
 add column if not exists mollie_subscription_id text,
 add column if not exists mollie_mandate_id text,
 add column if not exists sequence_type text,
 add column if not exists plan text,
 add column if not exists metadata jsonb;

alter table public.payments
 drop constraint if exists payments_type_check;

alter table public.payments
 add constraint payments_type_check
 check (type in ('credit_purchase','subscription','subscription_first','subscription_renewal','refund','chargeback'));

create unique index if not exists payments_mollie_payment_id_unique
 on public.payments(mollie_payment_id)
 where mollie_payment_id is not null;

create index if not exists payments_mollie_subscription_id_idx
 on public.payments(mollie_subscription_id);

alter table public.subscriptions enable row level security;

drop policy if exists "read own subscriptions" on public.subscriptions;
create policy "read own subscriptions"
 on public.subscriptions for select
 using (auth.uid() = user_id);

-- Insert/update/delete are intentionally service-role only; checkout and Mollie webhooks write from server context.
