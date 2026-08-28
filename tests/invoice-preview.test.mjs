import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateUBL } from '../lib/ubl-generator.ts';
import { buildRecommandPayloadFromUbl } from '../lib/ubl-to-recommand.ts';
import { buildInvoicePreviewFromPayload, validateStoredInvoiceConsistency, INVOICE_TOTAL_MISMATCH_MESSAGE } from '../lib/invoice-preview.ts';

const dashboard = readFileSync(new URL('../app/dashboard/DashboardClient.tsx', import.meta.url), 'utf8');
const nieuwPage = readFileSync(new URL('../app/nieuw/page.tsx', import.meta.url), 'utf8');
const sendRoute = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const generateRoute = readFileSync(new URL('../app/api/generate/route.ts', import.meta.url), 'utf8');

const baseInvoice = {
 supplierName: 'Red Productions',
 supplierAddress: 'Zuidelijke Knibbelweg 38',
 supplierPostalCode: '2765 JT',
 supplierCity: 'Cortelande',
 supplierCountry: 'NL',
 supplierVatNr: 'NL001607606B42',
 supplierKvkKbo: '33265552',
 supplierIban: 'NL64RABO0118774336',
 customerName: 'TWIN4U EVENTS & PROJECTS B.V.',
 customerAddress: 'Gentseweg 309 C03',
 customerPostalCode: '9120',
 customerCity: 'Beveren-Kruibeke-Zwijndrecht',
 customerCountry: 'BE',
 customerVatNr: 'BE0674771986',
 customerKvkKbo: '0674771986',
 customerPeppolId: '0208:0674771986',
 customerEmail: 'finance@example.be',
 buyerReference: '14052',
 invoiceNumber: '14052',
 invoiceDate: '2026-08-19',
 dueDate: '2026-08-20',
 currency: 'EUR',
};

test('stored invoice consistency blocks the known 14052 mismatch before sending or downloading', () => {
 const staleUbl = generateUBL({
  ...baseInvoice,
  lines: [{ id: '1', description: '2e deelfactuur 25% factuur', quantity: 1, unitPrice: 6991.00, vatPct: 21 }],
 });
 const result = validateStoredInvoiceConsistency(8459.22, staleUbl);
 assert.deepEqual(result, { ok: false, error: INVOICE_TOTAL_MISMATCH_MESSAGE });
 assert.equal(buildRecommandPayloadFromUbl(staleUbl).payableAmount, 8459.11);
});

test('stored invoice consistency allows a matching conversion to continue', () => {
 const ubl = generateUBL({
  ...baseInvoice,
  invoiceNumber: '14058',
  lines: [{ id: '1', description: '3e aanbetaling', quantity: 1, unitPrice: 6991.09, vatPct: 21 }],
 });
 assert.deepEqual(validateStoredInvoiceConsistency(8459.22, ubl), { ok: true });
});

test('confirmation preview uses the same amounts as the Recommand payload including multiple VAT rates', () => {
 const ubl = generateUBL({
  ...baseInvoice,
  invoiceNumber: 'TEST-DASH-001',
  lines: [
   { id: '1', description: 'Dashboard ketentest 21 procent', quantity: 2, unitPrice: 50, vatPct: 21 },
   { id: '2', description: 'Dashboard ketentest 9 procent', quantity: 1, unitPrice: 100, vatPct: 9 },
  ],
 });
 const payload = buildRecommandPayloadFromUbl(ubl);
 const preview = buildInvoicePreviewFromPayload(payload.recipient, payload.document, payload.currency);
 assert.equal(preview.recipient, payload.recipient);
 assert.deepEqual(preview.lines.map((line) => [line.description, line.quantity, line.netPriceAmount, line.vatPercentage]), payload.document.lines.map((line) => [line.description, line.quantity, line.netPriceAmount, line.vat.percentage]));
 assert.deepEqual(preview.totals.vatByRate.map((vat) => [vat.percentage, vat.vatAmount]), [['21.00', '21.00'], ['9.00', '9.00']]);
 assert.equal(preview.totals.subtotal, '200.00');
 assert.equal(preview.totals.total, '230.00');
});

test('Belgian recipient preview preserves scheme 0208 instead of defaulting to Dutch 0106', () => {
 const ubl = generateUBL({
  ...baseInvoice,
  lines: [{ id: '1', description: 'Belgische ontvanger', quantity: 1, unitPrice: 100, vatPct: 21 }],
 });
 const payload = buildRecommandPayloadFromUbl(ubl);
 const preview = buildInvoicePreviewFromPayload(payload.recipient, payload.document, payload.currency);
 assert.equal(preview.buyer.peppolId, '0208:0674771986');
 assert.notEqual(preview.buyer.peppolId.slice(0, 5), '0106:');
});

test('send route checks consistency before target claim, provider calls or credit debit', () => {
 assert.match(sendRoute, /validateStoredInvoiceConsistency\(existing\.total_amount, existing\.ubl_xml\)/);
 const beforeConsistency = sendRoute.match(/const existing = await fetchTarget[\s\S]*?const consistency = validateStoredInvoiceConsistency/)?.[0] || '';
 assert.match(beforeConsistency, /hasCompletedSend\(existing\)/);
 const consistencyBeforeCredit = sendRoute.match(/const consistency = validateStoredInvoiceConsistency[\s\S]*?const reserved = await reserveSendCredit/)?.[0] || '';
 assert.match(consistencyBeforeCredit, /return jsonError\(consistency\.error, 409\)/);
 assert.doesNotMatch(consistencyBeforeCredit, /reserveSendCredit\(|sendDocument\(|verifyRecipient\(/);
});

test('confirmation UI gates send and UBL download; cancelling performs no fetch and no download', () => {
 assert.match(generateRoute, /totalAmount:/);
 assert.match(nieuwPage, /buildRecommandPayloadFromUbl\(xml\)/);
 assert.match(nieuwPage, /setConfirmation\(\{ action: "download", preview: buildInvoicePreviewFromPayload\(payload\.recipient, payload\.document/);
 assert.match(nieuwPage, /setConfirmation\(\{ action: "send", preview: buildInvoicePreviewFromPayload\(payload\.recipient, payload\.document/);
 assert.match(nieuwPage, /body: JSON\.stringify\(\{ conversionId \}\)/);
 assert.match(dashboard, /prepareConversionAction\("download", conversion, invoiceNumber\)/);
 assert.match(dashboard, /prepareConversionAction\("send", conversion, invoiceNumber\)/);
 assert.match(`${dashboard}\n${nieuwPage}`, /confirmLabel=\{confirmation\.action === "send" \? "Bevestigen en verzenden" : "Downloaden"\}/);
 assert.match(`${dashboard}\n${nieuwPage}`, /onCancel=\{\(\) => setConfirmation\(null\)\}/);
 const cancelBlocks = `${dashboard}\n${nieuwPage}`.match(/onCancel=\{\(\) => setConfirmation\(null\)\}/g) || [];
 assert.equal(cancelBlocks.length, 2);
});
