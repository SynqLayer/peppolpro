import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');
const invoiceRoute = readFileSync(new URL('../app/api/invoices/[invoiceId]/route.ts', import.meta.url), 'utf8');
const invoicePdf = readFileSync(new URL('../lib/invoice-pdf.ts', import.meta.url), 'utf8');
const brevoLib = readFileSync(new URL('../lib/brevo.ts', import.meta.url), 'utf8');
const brevoWebhookRoute = readFileSync(new URL('../app/api/brevo/webhook/route.ts', import.meta.url), 'utf8');
const migration0030 = readFileSync(new URL('../supabase/migrations/0030_billing_address_validation_and_atomic_invoice_rpc.sql', import.meta.url), 'utf8');
const profileApi = readFileSync(new URL('../app/api/profile/route.ts', import.meta.url), 'utf8');
const addressApi = readFileSync(new URL('../app/api/address/lookup/route.ts', import.meta.url), 'utf8');
const addressValidation = readFileSync(new URL('../lib/address-validation.ts', import.meta.url), 'utf8');

test('billing profile selects use columns that exist on user_profiles', () => {
 const billingAndInvoiceSelects = `${billingLib}\n${invoiceRoute}`;
 assert.match(billingAndInvoiceSelects, /select\("company_name, email, address, postal_code, city, country, btw_nr"\)/);
 assert.doesNotMatch(billingAndInvoiceSelects, /full_name|btw_number/);
});

test('credit bundle invoices describe the purchased bundle size', () => {
 assert.match(invoicePdf, /PeppolPro verzendbundel \$\{credits\} credits/);
 assert.match(invoicePdf, /month: "2-digit"/);
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
