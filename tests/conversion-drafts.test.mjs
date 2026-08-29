import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateUBL } from '../lib/ubl-generator.ts';
import { parsedInvoiceToDraft, validateParsedInvoiceForConversion, CONVERSION_DRAFT_RETENTION_DAYS } from '../lib/conversion-drafts.ts';

const convertRoute = readFileSync(new URL('../app/api/convert/route.ts', import.meta.url), 'utf8');
const confirmRoute = readFileSync(new URL('../app/api/convert/confirm/route.ts', import.meta.url), 'utf8');
const convertPage = readFileSync(new URL('../app/convert/page.tsx', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/0029_conversion_drafts_confirm_flow.sql', import.meta.url), 'utf8');
const retentionRoute = readFileSync(new URL('../app/api/cron/retention-cleanup/route.ts', import.meta.url), 'utf8');

const parsed = {
 seller: { name: 'Leverancier BV', address: 'Straat 1', postal_code: '1000AA', city: 'Amsterdam', country: 'NL', kvk_number: '12345678', btw_number: 'NL123456789B01', iban: 'NL91ABNA0417164300', email: 'sales@example.nl', phone: null },
 buyer: { name: 'Klant BV', address: 'Klantstraat 2', postal_code: '2000BB', city: 'Rotterdam', country: 'NL', btw_number: 'NL987654321B01', kvk_number: '87654321', peppol_id: '0106:87654321', email: 'finance@example.nl' },
 invoice: { number: 'INV-1', date: '2026-08-29', due_date: '2026-09-28', currency: 'EUR', payment_terms: '30 dagen', reference: 'PO-1' },
 lines: [{ description: 'Dienst', quantity: 2, unit_price: 50, vat_rate: 21, vat_amount: 21, line_total: 121 }],
 totals: { subtotal: 100, total_vat: 21, total: 121 },
};

test('PDF parse step creates a conversion draft without charging credit or writing a conversion', () => {
 assert.match(convertRoute, /from\("conversion_drafts"\)/);
 assert.match(convertRoute, /parsedInvoiceToDraft\(parsed\)/);
 assert.doesNotMatch(convertRoute, /from\("conversions"\)\.insert/);
 assert.doesNotMatch(convertRoute, /rpc\("use_credit"/);
 assert.doesNotMatch(convertRoute, /generateUBL\(/);
 assert.doesNotMatch(convertRoute, /convert_success/);
 assert.doesNotMatch(convertRoute, /storage\.from\("invoices"\)\.upload/);
});

test('cancel keeps a saved draft client-side without hitting the confirm route', () => {
 assert.match(convertPage, /Annuleren en later afmaken/);
 assert.match(convertPage, /setDraft\(null\); setFile\(null\); setErrors\(\[\]\);/);
 assert.match(convertPage, /Concept opgeslagen tot/);
 assert.doesNotMatch(convertPage.match(/Annuleren en later afmaken[\s\S]{0,500}/)?.[0] || '', /fetch\(/);
});

test('confirm route validates corrected data server-side before UBL, credit debit and conversion insert', () => {
 assert.match(confirmRoute, /validateParsedInvoiceForConversion\(invoiceData\)/);
 const beforeRpc = confirmRoute.match(/const validation = validateParsedInvoiceForConversion[\s\S]*?admin\.rpc\("confirm_conversion_draft"/)?.[0] || '';
 assert.match(beforeRpc, /if \(!validation\.valid\)/);
 assert.match(beforeRpc, /generateUBL\(invoiceData\)/);
 assert.doesNotMatch(beforeRpc, /from\("conversions"\)\.insert/);
});

test('corrected data is the source for the generated UBL', () => {
 const draft = parsedInvoiceToDraft(parsed);
 const corrected = { ...draft.invoiceData, invoiceNumber: 'CORR-42', lines: [{ id: '1', description: 'Gecorrigeerde regel', quantity: 3, unitPrice: 10, vatPct: 9 }] };
 const validation = validateParsedInvoiceForConversion(corrected);
 assert.equal(validation.valid, true);
 const xml = generateUBL(corrected);
 assert.match(xml, /<cbc:ID>CORR-42<\/cbc:ID>/);
 assert.match(xml, /<cbc:PayableAmount currencyID="EUR">32\.70<\/cbc:PayableAmount>/);
});

test('invalid corrected values are rejected by shared server validation', () => {
 const draft = parsedInvoiceToDraft(parsed);
 assert.deepEqual(validateParsedInvoiceForConversion({ ...draft.invoiceData, currency: 'USD' }).errors, ['Alleen EUR-facturen worden ondersteund']);
 const controlCharResult = validateParsedInvoiceForConversion({ ...draft.invoiceData, invoiceNumber: 'INV\u0001' });
 assert.equal(controlCharResult.valid, false);
 assert.match(controlCharResult.errors.join('\n'), /ongeldig teken/);
});

test('double confirm is idempotent in the database function and logs success only once', () => {
 assert.match(migration, /for update/);
 assert.match(migration, /if v_draft\.status = 'confirmed' and v_draft\.conversion_id is not null then/);
 assert.match(migration, /return query select v_draft\.conversion_id, true, false/);
 assert.match(confirmRoute, /row\.already_confirmed === true[\s\S]*\.from\("conversions"\)[\s\S]*\.select\("ubl_xml, total_amount, currency"\)/);
 assert.match(confirmRoute, /xml: responseXml/);
 assert.match(migration, /'done'/);
 assert.match(migration, /set credits = credits - 1/);
 assert.match(confirmRoute, /if \(row\.already_confirmed !== true\)/);
});

test('draft storage is private to the owner and not writable with anon/authenticated RLS', () => {
 const policyBlock = migration.match(/alter table public\.conversion_drafts enable row level security;[\s\S]*?-- No anon\/authenticated insert\/update\/delete policies/)?.[0] || '';
 assert.match(policyBlock, /alter table public\.conversion_drafts enable row level security/);
 assert.match(policyBlock, /create policy "read own conversion drafts"[\s\S]*for select using \(auth\.uid\(\) = user_id\)/);
 assert.match(policyBlock, /No anon\/authenticated insert\/update\/delete policies/);
 assert.doesNotMatch(policyBlock.replace(/for select/g, ''), /for insert|for update|for delete/);
 assert.match(migration, /revoke all on function public\.confirm_conversion_draft[\s\S]*from public, anon, authenticated, hermes_operator/);
 assert.match(migration, /grant execute on function public\.confirm_conversion_draft[\s\S]*to service_role/);
});

test('drafts are separate from dashboard conversions and expire through retention cleanup', () => {
 assert.match(migration, /create table if not exists public\.conversion_drafts/);
 assert.match(migration, /expires_at timestamptz not null default \(now\(\) \+ interval '14 days'\)/);
 assert.equal(CONVERSION_DRAFT_RETENTION_DAYS, 14);
 assert.match(retentionRoute, /from\("conversion_drafts"\)/);
 assert.match(retentionRoute, /\.lt\("expires_at", draftCutoff\)/);
 assert.match(retentionRoute, /expiredDrafts: expiredDraftIds\.length/);
 assert.match(retentionRoute, /conversionDrafts: "14 dagen na parsing zonder bevestiging"/);
});
