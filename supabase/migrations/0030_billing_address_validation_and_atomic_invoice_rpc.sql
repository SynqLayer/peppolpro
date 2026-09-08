-- Address validation, legally complete billing PDFs and atomic invoice creation.
-- Additive only: does not reset or renumber invoice_number_sequences.

alter table public.user_profiles
 add column if not exists postal_code text,
 add column if not exists city text,
 add column if not exists address_verified boolean not null default false,
 add column if not exists address_validation_source text
  check (address_validation_source in ('pdok','manual')),
 add column if not exists vat_validation_status text not null default 'unchecked'
  check (vat_validation_status in ('unchecked','valid','invalid')),
 add column if not exists vat_validated_at timestamptz;

create table if not exists public.address_lookup_cache (
 lookup_key text primary key,
 street text not null,
 house_number text not null,
 postal_code text not null,
 city text not null,
 country text not null default 'NL',
 raw jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table public.address_lookup_cache enable row level security;
revoke all on table public.address_lookup_cache from anon, authenticated;
grant all on table public.address_lookup_cache to service_role;

alter table public.payments
 add column if not exists mollie_mode text check (mollie_mode in ('live','test'));

alter table public.invoices
 add column if not exists payment_method text,
 add column if not exists paid_at timestamptz,
 add column if not exists delivered_at date,
 add column if not exists pdf_path text,
 add column if not exists admin_pdf_path text,
 add column if not exists pdf_stored_at timestamptz,
 add column if not exists pdf_retention_until timestamptz,
 add column if not exists legal_supplier_name text,
 add column if not exists legal_supplier_address text,
 add column if not exists legal_supplier_postal_code text,
 add column if not exists legal_supplier_city text,
 add column if not exists legal_supplier_country text,
 add column if not exists legal_supplier_vat_id text,
 add column if not exists legal_supplier_kvk text;

revoke all on table public.user_profiles from anon, authenticated;
grant select on table public.user_profiles to authenticated;
grant update (company_name, country, kvk_kbo, btw_nr, address, postal_code, city, address_verified, address_validation_source, vat_validation_status, vat_validated_at, onboarding_complete)
 on table public.user_profiles to authenticated;
grant all on table public.user_profiles to service_role;

create or replace function public.create_billing_invoice_for_payment(
 p_payment_id uuid,
 p_invoice_kind text default null,
 p_subscription_id uuid default null,
 p_original_invoice_id uuid default null,
 p_original_invoice_number text default null,
 p_mollie_mode text default null
)
returns table(id uuid, invoice_number text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_payment public.payments%rowtype;
 v_profile public.user_profiles%rowtype;
 v_invoice_kind text;
 v_year int := extract(year from now())::int;
 v_next_number int;
 v_invoice_number text;
 v_amount numeric(12,2);
 v_vat numeric(12,2);
 v_total_excl numeric(12,2);
 v_currency text := 'EUR';
 v_invoice_id uuid;
 v_original public.invoices%rowtype;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to create billing invoice';
 end if;

 select * into v_payment
 from public.payments
 where payments.id = p_payment_id
 for update;
 if not found then
  raise exception 'payment not found';
 end if;

 if coalesce(p_mollie_mode, v_payment.mollie_mode, v_payment.metadata->>'mode') = 'test' then
  raise exception 'test payments are not invoiced';
 end if;

 select * into v_profile
 from public.user_profiles
 where user_profiles.id = v_payment.user_id
 for update;
 if not found then
  raise exception 'user profile not found';
 end if;

 if nullif(trim(coalesce(v_profile.address, '')), '') is null
  or nullif(trim(coalesce(v_profile.postal_code, '')), '') is null
  or nullif(trim(coalesce(v_profile.city, '')), '') is null
  or coalesce(v_profile.address_verified, false) is not true then
  raise exception 'billing address incomplete';
 end if;

 v_invoice_kind := coalesce(
  p_invoice_kind,
  case
   when v_payment.type = 'credit_purchase' or coalesce(v_payment.plan, '') like 'send_credits_%' then 'credits'
   else 'subscription'
  end
 );
 if v_invoice_kind not in ('subscription','credits','credit') then
  raise exception 'invalid billing invoice kind';
 end if;

 if v_invoice_kind = 'credit' then
  if v_payment.status not in ('refunded','charged_back') then
   raise exception 'credit invoice requires refunded or charged_back payment';
  end if;
  select * into v_original
  from public.invoices
  where invoices.payment_id = v_payment.id
   and invoices.invoice_kind <> 'credit'
  order by coalesce(invoices.issued_at, invoices.created_at) asc
  limit 1;
  v_amount := -abs(coalesce(v_original.amount, v_payment.amount, 0));
  v_vat := -abs(coalesce(v_original.vat_amount, round((abs(v_amount) - abs(v_amount) / 1.21) * 100) / 100));
  v_total_excl := round((v_amount - v_vat) * 100) / 100;
 else
  if v_payment.status <> 'paid' then
   raise exception 'invoice requires paid payment';
  end if;
  v_amount := coalesce(v_payment.amount, 0);
  v_vat := round((v_amount - v_amount / 1.21) * 100) / 100;
  v_total_excl := round((v_amount - v_vat) * 100) / 100;
 end if;

 insert into public.invoice_number_sequences(year, last_number)
 values (v_year, 1)
 on conflict (year) do update
 set last_number = public.invoice_number_sequences.last_number + 1,
     updated_at = now()
 returning last_number into v_next_number;

 v_invoice_number := 'INV-' || v_year || '-' || lpad(v_next_number::text, 5, '0');

 insert into public.invoices (
  user_id, invoice_number, invoice_date, currency, status, total_excl, vat_total,
  total_incl, subscription_id, payment_id, amount, vat_amount, vat_rate, issued_at,
  invoice_kind, original_invoice_id, original_invoice_number, payment_method, paid_at,
  delivered_at, pdf_retention_until, legal_supplier_name, legal_supplier_address,
  legal_supplier_postal_code, legal_supplier_city, legal_supplier_country,
  legal_supplier_vat_id, legal_supplier_kvk
 )
 values (
  v_payment.user_id, v_invoice_number, now()::date, v_currency, 'generated', v_total_excl, v_vat,
  v_amount, p_subscription_id, v_payment.id, v_amount, v_vat, 21, now(),
  v_invoice_kind, coalesce(p_original_invoice_id, v_original.id), coalesce(p_original_invoice_number, v_original.invoice_number),
  'online betaling', case when v_invoice_kind = 'credit' then null else now() end,
  now()::date, now() + interval '7 years',
  'SynqLayer', 'De Akker 39', '2743 DR', 'Waddinxveen', 'NL', 'NL005450830B62', '42041391'
 )
 returning invoices.id into v_invoice_id;

 return query select v_invoice_id, v_invoice_number;
end;
$$;

revoke all on function public.create_billing_invoice_for_payment(uuid, text, uuid, uuid, text, text) from public, anon, authenticated, hermes_operator;
grant execute on function public.create_billing_invoice_for_payment(uuid, text, uuid, uuid, text, text) to service_role;
