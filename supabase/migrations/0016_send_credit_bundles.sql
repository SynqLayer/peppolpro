-- One-off Peppol send credit bundles. Not applied automatically.

alter table public.user_profiles
 add column if not exists send_credits integer not null default 0,
 add column if not exists send_credits_expires_at timestamptz;

alter table public.user_profiles
 add constraint user_profiles_send_credits_non_negative
 check (send_credits >= 0)
 not valid;

create table if not exists public.send_credit_purchases (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 bundle_id text not null check (bundle_id in ('send_credits_10','send_credits_25','send_credits_50')),
 credits integer not null check (credits > 0),
 amount numeric(10,2) not null,
 payment_id text not null unique,
 purchased_at timestamptz not null default now(),
 expires_at timestamptz not null
);

create index if not exists send_credit_purchases_user_purchased_idx
 on public.send_credit_purchases(user_id, purchased_at desc);

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
as $$
begin
 insert into public.send_credit_purchases(user_id, bundle_id, credits, amount, payment_id, expires_at)
 values (p_user_id, p_bundle_id, p_credits, p_amount, p_payment_id, p_expires_at);

 update public.user_profiles
 set send_credits = send_credits + p_credits,
     send_credits_expires_at = p_expires_at
 where id = p_user_id;
end;
$$;

alter table public.send_credit_purchases enable row level security;

drop policy if exists "read own send credit purchases" on public.send_credit_purchases;
create policy "read own send credit purchases"
 on public.send_credit_purchases for select
 using (auth.uid() = user_id);

-- Insert/update/delete are intentionally service-role only; Mollie webhooks write from server context.

alter table public.user_profiles
 drop constraint if exists user_profiles_plan_check;

alter table public.user_profiles
 add constraint user_profiles_plan_check
 check (plan in ('free','monitoring','monitoring_accountant','compleet','pro','accountant')) not valid;

alter table public.subscriptions
 drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
 add constraint subscriptions_plan_check
 check (plan in ('monitoring','monitoring_accountant')) not valid;

alter table public.invoices
 drop constraint if exists invoices_invoice_kind_check;

alter table public.invoices
 add constraint invoices_invoice_kind_check
 check (invoice_kind in ('sales','subscription','credits','credit'));
