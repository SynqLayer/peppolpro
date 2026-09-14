-- Spiegelbestand van de productiehistorie (versie 20260908163021, billing_address_validation_and_atomic_invoice_rpc).
--
-- Deze migratie is op 8 september 2026 handmatig op productie toegepast en staat daar in
-- supabase_migrations.schema_migrations geregistreerd. Dit bestand is toegevoegd zodat repo en
-- productie exact dezelfde versiehistorie hebben; de inhoud is de oorspronkelijke productie-SQL.
--
-- DDL uit de billing-ronde. Inhoudelijk gedekt door 0030; deze versie bestaat omdat de wijziging
aan productie in twee losse stappen is toegepast.

alter table public.user_profiles
  add column if not exists address_verified boolean not null default false,
  add column if not exists address_validation_source text
    check (address_validation_source in ('pdok','manual')),
  add column if not exists vat_validation_status text not null default 'unchecked'
    check (vat_validation_status in ('unchecked','valid','invalid')),
  add column if not exists vat_validated_at timestamptz;

update public.user_profiles
set address_validation_source = 'manual'
where address_validation_source is null
  and nullif(trim(coalesce(address, '')), '') is not null
  and nullif(trim(coalesce(postal_code, '')), '') is not null
  and nullif(trim(coalesce(city, '')), '') is not null;

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
  add column if not exists legal_supplier_kvk text,
  add column if not exists email_status text not null default 'pending'
    check (email_status in ('pending','accepted','delivered','failed')),
  add column if not exists brevo_message_id text,
  add column if not exists email_accepted_at timestamptz,
  add column if not exists email_delivered_at timestamptz,
  add column if not exists email_error text;

revoke all on table public.user_profiles from anon, authenticated;
grant select on table public.user_profiles to authenticated;
grant all on table public.user_profiles to service_role;
