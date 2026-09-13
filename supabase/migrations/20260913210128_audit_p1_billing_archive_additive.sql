-- P1-02 ADDITIVE: deploy before application changes. Existing writers still work.
-- Inclusive last retention date for PeppolPro billing invoices (calendar financial year).
create or replace function public.invoice_retention_until(invoice_date date)
returns date language sql immutable strict parallel safe set search_path = pg_catalog as $$
 select (date_trunc('year', invoice_date::timestamp) + interval '8 years' - interval '1 day')::date;
$$;
revoke all on function public.invoice_retention_until(date) from public, anon, authenticated, hermes_operator;
grant execute on function public.invoice_retention_until(date) to authenticated, service_role;

alter table public.invoices
 add column billing_snapshot jsonb,
 add column pdf_sha256 text check (pdf_sha256 ~ '^[0-9a-f]{64}$'),
 add column admin_pdf_sha256 text check (admin_pdf_sha256 ~ '^[0-9a-f]{64}$');

create or replace function public.capture_billing_invoice_snapshot()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_customer jsonb; v_payment jsonb;
begin
 if new.invoice_kind not in ('subscription','credits','credit') then return new; end if;
 select jsonb_build_object('company_name',company_name,'email',email,'address',address,
  'postal_code',postal_code,'city',city,'country',country,'btw_nr',btw_nr)
 into v_customer from public.user_profiles where id = new.user_id;
 select jsonb_build_object('mollie_payment_id',mollie_payment_id,'plan',plan,'credits',credits)
 into v_payment from public.payments where id = new.payment_id;
 new.billing_snapshot := jsonb_build_object('customer',v_customer,'payment',v_payment,
  'captured_at',now(),'provenance','at_issuance',
  'supplier',jsonb_build_object('name',new.legal_supplier_name,'address',new.legal_supplier_address,
   'postal_code',new.legal_supplier_postal_code,'city',new.legal_supplier_city,
   'country',new.legal_supplier_country,'vat_id',new.legal_supplier_vat_id,'kvk',new.legal_supplier_kvk));
 new.pdf_retention_until := public.invoice_retention_until(new.invoice_date)::timestamp at time zone 'UTC';
 return new;
end;
$$;
revoke all on function public.capture_billing_invoice_snapshot() from public, anon, authenticated, hermes_operator;
create trigger capture_billing_invoice_snapshot before insert on public.invoices
 for each row execute function public.capture_billing_invoice_snapshot();

-- Historical PDFs remain the original evidence. Current profile fields are labelled
-- explicitly as a later capture; they are never used to regenerate an old PDF.
update public.invoices i set billing_snapshot = jsonb_build_object(
 'customer',(select jsonb_build_object('company_name',p.company_name,'email',p.email,'address',p.address,
  'postal_code',p.postal_code,'city',p.city,'country',p.country,'btw_nr',p.btw_nr) from public.user_profiles p where p.id=i.user_id),
 'payment',(select jsonb_build_object('mollie_payment_id',p.mollie_payment_id,'plan',p.plan,'credits',p.credits) from public.payments p where p.id=i.payment_id),
 'supplier',jsonb_build_object('name',i.legal_supplier_name,'address',i.legal_supplier_address,
  'postal_code',i.legal_supplier_postal_code,'city',i.legal_supplier_city,'country',i.legal_supplier_country,
  'vat_id',i.legal_supplier_vat_id,'kvk',i.legal_supplier_kvk),
 'captured_at',now(),'provenance','legacy_capture_preserve_existing_pdf'),
 pdf_retention_until = public.invoice_retention_until(i.invoice_date)::timestamp at time zone 'UTC'
where i.invoice_kind in ('subscription','credits','credit') and i.billing_snapshot is null;

-- Replace the current RPC so even its input value uses the shared function.
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
  now()::date, public.invoice_retention_until(current_date)::timestamp at time zone 'UTC',
  'SynqLayer', 'De Akker 39', '2743 DR', 'Waddinxveen', 'NL', 'NL005450830B62', '42041391'
 )
 returning invoices.id into v_invoice_id;

 return query select v_invoice_id, v_invoice_number;
end;
$$;

revoke all on function public.create_billing_invoice_for_payment(uuid, text, uuid, uuid, text, text) from public, anon, authenticated, hermes_operator;
grant execute on function public.create_billing_invoice_for_payment(uuid, text, uuid, uuid, text, text) to service_role;
