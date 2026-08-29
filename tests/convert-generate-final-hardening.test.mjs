import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateInvoiceData } from '../lib/ubl-validator.ts';

const root = new URL('../', import.meta.url);
const convertRoute = readFileSync(new URL('app/api/convert/route.ts', root), 'utf8');
const generateRoute = readFileSync(new URL('app/api/generate/route.ts', root), 'utf8');
const middleware = readFileSync(new URL('middleware.ts', root), 'utf8');
const sendRoute = readFileSync(new URL('app/api/recommand/send/route.ts', root), 'utf8');
const dashboard = readFileSync(new URL('app/dashboard/DashboardClient.tsx', root), 'utf8');
const mollieWebhook = readFileSync(new URL('app/api/mollie/webhook/route.ts', root), 'utf8');
const migration0026 = readFileSync(new URL('supabase/migrations/0026_recommand_failed_document_retry.sql', root), 'utf8');

const validInvoice = {
  supplierName: 'Leverancier BV',
  supplierAddress: 'Straat 1',
  supplierPostalCode: '1000 AA',
  supplierCity: 'Amsterdam',
  supplierCountry: 'NL',
  supplierVatNr: 'NL005450830B62',
  supplierKvkKbo: '42041391',
  supplierIban: 'NL64RABO0118774336',
  customerName: 'Klant BV',
  customerAddress: 'Klantstraat 1',
  customerPostalCode: '1000 AA',
  customerCity: 'Amsterdam',
  customerCountry: 'NL',
  customerVatNr: 'NL005450830B62',
  customerKvkKbo: '42041391',
  customerPeppolId: '0106:42041391',
  customerEmail: 'klant@example.com',
  buyerReference: 'REF-1',
  invoiceNumber: 'INV-1',
  invoiceDate: '2026-08-29',
  dueDate: '2026-09-12',
  currency: 'EUR',
  lines: [{ id: '1', description: 'Werk', quantity: 1, unitPrice: 100, vatPct: 21 }],
};

test('validateInvoiceData rejects non-EUR server-side for /api/generate', () => {
  const result = validateInvoiceData({ ...validInvoice, currency: 'USD' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Alleen EUR-facturen worden ondersteund'));
  assert.match(generateRoute, /validateInvoiceData\(invoiceData\)/);
});

test('validateInvoiceData rejects control characters in invoice number and free text fields', () => {
  for (const patch of [
    { invoiceNumber: 'INV\u0000-1' },
    { customerName: 'Klant\u0000BV' },
    { supplierAddress: 'Straat\u0000 1' },
    { buyerReference: 'REF\u0000' },
    { lines: [{ ...validInvoice.lines[0], description: 'Werk\u0000' }] },
  ]) {
    const result = validateInvoiceData({ ...validInvoice, ...patch });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('ongeldig teken')));
  }
});

test('/api/convert creates conversion rows only after successful parse and UBL generation', () => {
  const parseIndex = convertRoute.indexOf('parsed = await parseInvoicePDF(base64)');
  const ublIndex = convertRoute.indexOf('const ublXml = generateUBL(invoiceData)');
  const insertMatch = /\.from\("conversions"\)\s*\.insert\(\{/.exec(convertRoute);
  const insertIndex = insertMatch?.index ?? -1;
  assert.ok(parseIndex > 0, 'parse call exists');
  assert.ok(ublIndex > parseIndex, 'UBL generation happens after parse');
  assert.ok(insertIndex > ublIndex, 'conversion insert happens after successful UBL generation');
  assert.doesNotMatch(convertRoute.slice(0, parseIndex), /\.from\("conversions"\)[\s\S]*\.insert/);
  assert.match(convertRoute, /action: "convert_parse_failed"/);
  assert.doesNotMatch(convertRoute, /base64[\s\S]{0,120}scan_logs|scan_logs[\s\S]{0,120}base64/);
});

test('/convert is middleware protected', () => {
  assert.match(middleware, /\["\/dashboard", "\/nieuw", "\/convert"\]/);
});

test('failed Recommand sends with provider documentId remain retryable', () => {
  assert.match(sendRoute, /function hasCompletedSend\(row\?: TargetRow \| null\)[\s\S]*sentStatuses\.has/);
  assert.match(sendRoute, /row\?\.sent_via_recommand_at/);
  assert.match(dashboard, /canSendConversion[\s\S]*failedStatuses\.includes/);
  assert.match(migration0026, /v_sent_statuses text\[\]/);
  assert.match(migration0026, /recommand_status = any\(v_sent_statuses\)/);
  assert.match(migration0026, /coalesce\(v_existing\.recommand_status, ''\) not in \('send_failed'/);
});

test('Mollie webhook passes service-role client into billing invoice creation', () => {
  assert.match(mollieWebhook, /function createAdminClient\(\)[\s\S]*SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(mollieWebhook, /const supabase = createAdminClient\(\)/);
  assert.match(mollieWebhook, /await ensurePaymentInvoice\(\{ supabase, payment, paymentRow, subscription/);
  assert.match(mollieWebhook, /await ensureCreditInvoice\(\{ supabase, payment, paymentRow, subscription/);
  assert.match(mollieWebhook, /await ensureCreditInvoice\(\{ supabase, payment, paymentRow, subscription: null \}\)/);
});
