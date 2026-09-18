alter table public.user_profiles add column "email" text;
alter table public.user_profiles add column "company_name" text;
alter table public.user_profiles add column "country" text;
alter table public.user_profiles add column "kvk_kbo" text;
alter table public.user_profiles add column "btw_nr" text;
alter table public.user_profiles add column "address" text;
alter table public.user_profiles add column "iban" text;
alter table public.user_profiles add column "peppol_id" text;
alter table public.user_profiles add column "onboarding_complete" boolean;
alter table public.user_profiles add column "created_at" timestamp with time zone;
alter table public.user_profiles add column "postal_code" text;
alter table public.user_profiles add column "city" text;
alter table public.user_profiles add column "recommand_verification_url" text;
alter table public.user_profiles add column "recommand_raw_response" jsonb;
alter table public.user_profiles add column "is_admin" boolean;
alter table public.user_profiles add column "address_verified" boolean;
alter table public.user_profiles add column "address_validation_source" text;
alter table public.user_profiles add column "vat_validation_status" text;
alter table public.user_profiles add column "vat_validated_at" timestamp with time zone;
alter table public.invoices add column "client_id" uuid;
alter table public.invoices add column "invoice_date" date;
alter table public.invoices add column "due_date" date;
alter table public.invoices add column "currency" text;
alter table public.invoices add column "status" text;
alter table public.invoices add column "total_excl" numeric(12,2);
alter table public.invoices add column "vat_total" numeric(12,2);
alter table public.invoices add column "total_incl" numeric(12,2);
alter table public.invoices add column "peppol_message_id" text;
alter table public.invoices add column "sent_at" timestamp with time zone;
alter table public.invoices add column "created_at" timestamp with time zone;
alter table public.invoices add column "subscription_id" uuid;
alter table public.invoices add column "payment_id" uuid;
alter table public.invoices add column "amount" numeric(12,2);
alter table public.invoices add column "vat_amount" numeric(12,2);
alter table public.invoices add column "vat_rate" numeric(5,2);
alter table public.invoices add column "issued_at" timestamp with time zone;
alter table public.invoices add column "invoice_kind" text;
alter table public.invoices add column "original_invoice_id" uuid;
alter table public.invoices add column "original_invoice_number" text;
alter table public.invoices add column "recommand_document_id" text;
alter table public.invoices add column "recommand_raw_response" jsonb;
alter table public.invoices add column "verified_recipient" boolean;
alter table public.invoices add column "payment_method" text;
alter table public.invoices add column "paid_at" timestamp with time zone;
alter table public.invoices add column "delivered_at" date;
alter table public.invoices add column "pdf_path" text;
alter table public.invoices add column "admin_pdf_path" text;
alter table public.invoices add column "pdf_stored_at" timestamp with time zone;
alter table public.invoices add column "pdf_retention_until" timestamp with time zone;
alter table public.invoices add column "legal_supplier_name" text;
alter table public.invoices add column "legal_supplier_address" text;
alter table public.invoices add column "legal_supplier_postal_code" text;
alter table public.invoices add column "legal_supplier_city" text;
alter table public.invoices add column "legal_supplier_country" text;
alter table public.invoices add column "legal_supplier_vat_id" text;
alter table public.invoices add column "legal_supplier_kvk" text;
alter table public.invoices add column "email_status" text;
alter table public.invoices add column "brevo_message_id" text;
alter table public.invoices add column "email_accepted_at" timestamp with time zone;
alter table public.invoices add column "email_delivered_at" timestamp with time zone;
alter table public.invoices add column "email_error" text;
alter table public.subscriptions add column "id" uuid;
alter table public.subscriptions add column "plan" text;
alter table public.subscriptions add column "mollie_customer_id" text;
alter table public.subscriptions add column "mollie_subscription_id" text;
alter table public.subscriptions add column "mollie_mandate_id" text;
alter table public.subscriptions add column "current_period_start" timestamp with time zone;
alter table public.subscriptions add column "last_payment_id" text;
alter table public.subscriptions add column "last_webhook_status" text;
alter table public.subscriptions add column "created_at" timestamp with time zone;
alter table public.subscriptions add column "updated_at" timestamp with time zone;
alter table public.subscriptions add column "cancel_at_period_end" boolean;
alter table public.subscriptions add column "canceled_at" timestamp with time zone;
create table public.payments("id" uuid,"user_id" uuid,"type" text,"mollie_payment_id" text,"amount" numeric(12,2),"credits" integer,"status" text,"created_at" timestamp with time zone,"mollie_customer_id" text,"mollie_subscription_id" text,"mollie_mandate_id" text,"sequence_type" text,"plan" text,"metadata" jsonb,"mollie_mode" text);
alter table public.payments alter column id set default gen_random_uuid();
create table public.send_credit_purchases("id" uuid,"user_id" uuid,"bundle_id" text,"credits" integer,"amount" numeric(10,2),"payment_id" text,"purchased_at" timestamp with time zone,"expires_at" timestamp with time zone);
alter table public.send_credit_purchases alter column id set default gen_random_uuid();
create table public.bundle_ubl_credit_grants("purchase_id" uuid,"user_id" uuid,"credits" integer,"reason" text,"granted_at" timestamp with time zone);
create table public.invoice_number_sequences("year" integer,"last_number" integer,"updated_at" timestamp with time zone);
alter table public.payments add primary key(id);
alter table public.send_credit_purchases add primary key(id),add unique(payment_id);
alter table public.bundle_ubl_credit_grants add primary key(purchase_id);
alter table public.invoice_number_sequences add primary key(year);
alter table public.invoices alter column id set default gen_random_uuid(),alter column created_at set default now();
alter table public.user_profiles alter column credits set default 0;
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
  or coalesce(v_profile.address_validation_source, '') not in ('pdok','manual') then
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
create trigger grant_bundle_ubl_credits_after_purchase after insert on public.send_credit_purchases for each row execute function public.grant_bundle_ubl_credits_from_purchase();
