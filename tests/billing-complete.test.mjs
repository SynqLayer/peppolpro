import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { withPostgres } from './helpers/postgres.mjs';

const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');
const invoiceRoute = readFileSync(new URL('../app/api/invoices/[invoiceId]/route.ts', import.meta.url), 'utf8');
const invoicePdf = readFileSync(new URL('../lib/invoice-pdf.ts', import.meta.url), 'utf8');
const brevoLib = readFileSync(new URL('../lib/brevo.ts', import.meta.url), 'utf8');
const brevoWebhookRoute = readFileSync(new URL('../app/api/brevo/webhook/route.ts', import.meta.url), 'utf8');
const migration0030 = readFileSync(new URL('../supabase/migrations/0030_billing_address_validation_and_atomic_invoice_rpc.sql', import.meta.url), 'utf8');
const profileApi = readFileSync(new URL('../app/api/profile/route.ts', import.meta.url), 'utf8');
const addressApi = readFileSync(new URL('../app/api/address/lookup/route.ts', import.meta.url), 'utf8');
const addressValidation = readFileSync(new URL('../lib/address-validation.ts', import.meta.url), 'utf8');
const service = "select set_config('request.jwt.claim.role','service_role',false);\n";
const uid = '00000000-0000-4000-8000-000000000001';

async function prepareBillingDatabase(db) {
 const query = async (text) => (await db.query(text)).trim();
 await query(`
  create role anon; create role authenticated; create role hermes_operator; create role service_role bypassrls;
  create schema auth;
  create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function auth.role() returns text language sql stable as $$select nullif(current_setting('request.jwt.claim.role',true),'')$$;
  create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}')$$;
  grant usage on schema auth to anon, authenticated, hermes_operator, service_role;
  grant execute on function auth.uid(), auth.role(), auth.jwt() to anon, authenticated, hermes_operator, service_role;
  create function public.handle_new_user() returns trigger language plpgsql as $$begin return new; end$$;
 `);
 const migrations = readdirSync(new URL('../supabase/migrations/', import.meta.url));
 for (let n = 1; n <= 30; n++) {
  const prefix = String(n).padStart(4, '0');
  const name = migrations.find((entry) => entry.startsWith(`${prefix}_`));
  if (name) await query(readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
 }
 return query;
}

test('billing profile selects use columns that exist on user_profiles', () => {
 const billingAndInvoiceSelects = `${billingLib}\n${invoiceRoute}`;
 assert.match(billingAndInvoiceSelects, /select\("company_name, email, address, postal_code, city, country, btw_nr"\)/);
 assert.doesNotMatch(billingAndInvoiceSelects, /full_name|btw_number/);
});

test('credit bundle invoices describe the purchased bundle size', () => {
 assert.match(invoicePdf, /PeppolPro verzendbundel \$\{credits\} credits/);
 assert.match(invoicePdf, /month: "2-digit"/);
 assert.match(invoicePdf, /Totaal excl\. btw/);
 assert.match(invoicePdf, /Prijs\/stuk excl\./);
 assert.match(invoicePdf, /Dit bedrag is reeds voldaan\. U hoeft niets te betalen\./);
 assert.doesNotMatch(invoicePdf, /server-side bewaard volgens de wettelijke bewaartermijn/);
 assert.match(billingLib, /payments\(mollie_payment_id, plan, credits\)/);
 assert.match(invoiceRoute, /payments\(plan, credits\)/);
});

test('billing email failures are explicit and invoices track Brevo delivery status', () => {
 assert.match(migration0030, /email_status text not null default 'pending'/);
 assert.match(migration0030, /brevo_message_id text/);
 assert.match(migration0030, /email_accepted_at timestamptz/);
 assert.match(migration0030, /email_delivered_at timestamptz/);
 assert.match(migration0030, /email_error text/);
 assert.match(brevoLib, /BREVO_API_KEY ontbreekt/);
 assert.match(brevoLib, /if \(!res\.ok\)/);
 assert.match(billingLib, /email_status: "accepted"/);
 assert.match(billingLib, /email_status: "failed"/);
 assert.match(brevoWebhookRoute, /email_status: "delivered"/);
 assert.match(brevoWebhookRoute, /status: "sent"/);
});

test('existing invoices retry email when Brevo has not accepted or delivered it', () => {
 assert.match(billingLib, /select\("id, invoice_number, email_status"\)/);
 assert.match(billingLib, /!\["accepted", "delivered"\]\.includes/);
});

test('address and invoice RPC hardening is present server-side', () => {
 assert.match(addressValidation, /api\.pdok\.nl\/bzk\/locatieserver\/search\/v3_1\/free/);
 assert.match(addressValidation, /address_lookup_cache/);
 assert.match(addressValidation, /vies\/rest-api\/check-vat-number/);
 assert.match(profileApi, /lookupDutchAddress/);
 assert.match(addressApi, /lookupDutchAddress/);
 assert.match(migration0030, /create or replace function public\.create_billing_invoice_for_payment/);
 assert.match(migration0030, /service_role required to create billing invoice/);
 assert.match(migration0030, /billing address incomplete/);
 assert.match(migration0030, /address_validation_source, ''\) not in \('pdok','manual'\)/);
 assert.doesNotMatch(migration0030, /address_verified, false\) is not true/);
 assert.match(migration0030, /set address_validation_source = 'manual'/);
 assert.match(migration0030, /test payments are not invoiced/);
 assert.match(migration0030, /revoke all on table public\.user_profiles from anon, authenticated/);
 assert.match(migration0030, /grant select on table public\.user_profiles to authenticated/);
 assert.doesNotMatch(migration0030, /grant update [^;]+public\.user_profiles to authenticated/i);
 assert.doesNotMatch(migration0030, /grant (insert|delete)[^;]+public\.user_profiles to authenticated/i);
});

test('billing RPC enforces service role, validated addresses, live payments and read-only profiles', { timeout: 300000 }, async () => {
 await withPostgres('billing', async (db) => {
  const query = await prepareBillingDatabase(db);
  await query(`insert into auth.users(id,email) values('${uid}','buyer@example.invalid'); insert into public.user_profiles(id,email,address,postal_code,city,address_validation_source) values('${uid}','buyer@example.invalid','Street 1','1234 AB','Town','manual'); insert into public.payments(id,user_id,type,mollie_payment_id,amount,credits,status,plan,mollie_mode) values('00000000-0000-4000-8000-000000000010','${uid}','credit_purchase','tr_fixture',9,10,'paid','send_credits_10','live');`);
  await assert.rejects(() => query(`set role authenticated; select * from public.create_billing_invoice_for_payment('00000000-0000-4000-8000-000000000010')`), /permission denied/);
  const created = (await query(service + `select invoice_number from public.create_billing_invoice_for_payment('00000000-0000-4000-8000-000000000010')`)).split('\n').at(-1);
  assert.match(created, /^INV-\d{4}-\d{5}$/);
  assert.equal(await query(`select invoice_kind||':'||amount||':'||email_status from public.invoices where payment_id='00000000-0000-4000-8000-000000000010'`), 'credits:9.00:pending');
  assert.equal(await query(`select has_table_privilege('authenticated','public.user_profiles','SELECT')||','||has_table_privilege('authenticated','public.user_profiles','INSERT')||','||has_table_privilege('authenticated','public.user_profiles','DELETE')`), 'true,false,false');
  assert.equal(await query(`select has_table_privilege('authenticated','public.user_profiles','UPDATE')`), 'f');
  await query(`update public.user_profiles set address_validation_source=null where id='${uid}'; insert into public.payments(id,user_id,type,mollie_payment_id,amount,status,plan,mollie_mode) values('00000000-0000-4000-8000-000000000011','${uid}','credit_purchase','tr_bad',9,'paid','send_credits_10','live')`);
  await assert.rejects(() => query(service + `select * from public.create_billing_invoice_for_payment('00000000-0000-4000-8000-000000000011')`), /billing address incomplete/);
 });
});
