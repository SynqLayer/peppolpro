import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateUBL } from '../lib/ubl-generator.ts';
import { validateInvoiceData } from '../lib/ubl-validator.ts';
import { buildRecommandPayloadFromUbl } from '../lib/ubl-to-recommand.ts';
import { buildInvoicePreviewFromPayload } from '../lib/invoice-preview.ts';
import { classifySendException, classifySendResult } from '../lib/recommand-send-outcome.ts';
import {
 findOutgoingDocument,
 PEPPOL_BIS_BILLING_CREDIT_NOTE_DOCUMENT_TYPE,
 PEPPOL_BIS_BILLING_INVOICE_DOCUMENT_TYPE,
 sendDocument,
} from '../lib/recommand.ts';

const root = new URL('../', import.meta.url);
const sendRoute = readFileSync(new URL('app/api/recommand/send/route.ts', root), 'utf8');
const recommandClient = readFileSync(new URL('lib/recommand.ts', root), 'utf8');
const generateRoute = readFileSync(new URL('app/api/generate/route.ts', root), 'utf8');
const nieuwPage = readFileSync(new URL('app/nieuw/page.tsx', root), 'utf8');
const confirmation = readFileSync(new URL('app/components/InvoiceConfirmation.tsx', root), 'utf8');
const convertRoute = readFileSync(new URL('app/api/convert/route.ts', root), 'utf8');

const base = {
 supplierName: 'Supplier BV',
 supplierAddress: 'Straat 1',
 supplierPostalCode: '1234AB',
 supplierCity: 'Amsterdam',
 supplierCountry: 'NL',
 supplierVatNr: 'NL005450830B62',
 supplierKvkKbo: '42041391',
 supplierIban: 'NL64RABO0118774336',
 customerName: 'Customer BV',
 customerAddress: 'Klantstraat 2',
 customerPostalCode: '2000BB',
 customerCity: 'Rotterdam',
 customerCountry: 'NL',
 customerVatNr: 'NL987654321B01',
 customerKvkKbo: '87654321',
 customerPeppolId: '0106:87654321',
 customerEmail: 'customer@example.nl',
 buyerReference: 'ORDER-1',
 invoiceNumber: 'CN-2026-001',
 invoiceDate: '2026-09-10',
 dueDate: '2026-10-10',
 currency: 'EUR',
 documentType: 'creditNote',
 originalInvoiceNumber: 'INV-2026-004',
 originalInvoiceDate: '2026-08-20',
 lines: [
  { id: '1', description: 'Correctie 21%', quantity: 2, unitPrice: 50, vatPct: 21 },
  { id: '2', description: 'Correctie 9%', quantity: 1, unitPrice: 100, vatPct: 9 },
  { id: '3', description: 'Correctie 0%', quantity: 1, unitPrice: 25, vatPct: 0 },
 ],
};

test('Invoice output remains UBL Invoice 380', () => {
 const invoice = { ...base, documentType: 'invoice', invoiceNumber: 'INV-REG-1' };
 const xml = generateUBL(invoice);
 assert.match(xml, /<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"/);
 assert.match(xml, /<cbc:InvoiceTypeCode>380<\/cbc:InvoiceTypeCode>/);
 assert.match(xml, /<cac:InvoiceLine>/);
 assert.match(xml, /<cbc:InvoicedQuantity unitCode="C62">2<\/cbc:InvoicedQuantity>/);
 assert.doesNotMatch(xml, /CreditNote|CreditNoteTypeCode|CreditNoteLine|CreditedQuantity|BillingReference/);
});

test('CreditNote output uses CreditNote-2, type 381, BillingReference and credited lines', () => {
 const xml = generateUBL(base);
 assert.match(xml, /<ubl:CreditNote xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"/);
 assert.match(xml, /<cbc:CreditNoteTypeCode>381<\/cbc:CreditNoteTypeCode>/);
 assert.match(xml, /<cac:BillingReference>[\s\S]*<cac:InvoiceDocumentReference>[\s\S]*<cbc:ID>INV-2026-004<\/cbc:ID>[\s\S]*<cbc:IssueDate>2026-08-20<\/cbc:IssueDate>/);
 assert.equal((xml.match(/<cac:CreditNoteLine>/g) || []).length, 3);
 assert.match(xml, /<cbc:CreditedQuantity unitCode="C62">2<\/cbc:CreditedQuantity>/);
 assert.match(xml, /<cac:AccountingSupplierParty>[\s\S]*<cbc:CompanyID schemeID="0106">42041391<\/cbc:CompanyID>/);
 assert.match(xml, /<cac:AccountingCustomerParty>[\s\S]*<cbc:CompanyID schemeID="0106">87654321<\/cbc:CompanyID>/);
 assert.match(xml, /<cac:PaymentMeans>[\s\S]*<cbc:PaymentMeansCode>30<\/cbc:PaymentMeansCode>[\s\S]*<cbc:ID>NL64RABO0118774336<\/cbc:ID>/);
 assert.doesNotMatch(xml, /<cbc:DueDate>|<cbc:InvoiceTypeCode>|<cac:InvoiceLine>|<cbc:InvoicedQuantity>/);
});

test('CreditNote VAT groups and totals cover 0, 9 and 21 percent', () => {
 const xml = generateUBL(base);
 for (const pct of ['0.00', '9.00', '21.00']) assert.match(xml, new RegExp(`<cbc:Percent>${pct.replace('.', '\\.')}`));
 assert.match(xml, /<cbc:TaxExclusiveAmount currencyID="EUR">225\.00<\/cbc:TaxExclusiveAmount>/);
 assert.match(xml, /<cbc:TaxAmount currencyID="EUR">30\.00<\/cbc:TaxAmount>/);
 assert.match(xml, /<cbc:TaxInclusiveAmount currencyID="EUR">255\.00<\/cbc:TaxInclusiveAmount>/);
 assert.match(xml, /<cbc:PayableAmount currencyID="EUR">255\.00<\/cbc:PayableAmount>/);
});

test('NL CreditNote requires original invoice number server-side', () => {
 const result = validateInvoiceData({ ...base, originalInvoiceNumber: '' });
 assert.equal(result.valid, false);
 assert.ok(result.errors.includes('Oorspronkelijk factuurnummer ontbreekt'));
 assert.match(generateRoute, /validateInvoiceData\(invoiceData\)/);
 assert.match(generateRoute, /documentType !== "invoice" && documentType !== "creditNote"/);
});

test('non-NL CreditNote may omit the original invoice reference', () => {
 const data = { ...base, supplierCountry: 'BE', originalInvoiceNumber: '', originalInvoiceDate: '' };
 assert.equal(validateInvoiceData(data).valid, true);
 const xml = generateUBL(data);
 assert.doesNotMatch(xml, /<cac:BillingReference>/);
 assert.deepEqual(buildRecommandPayloadFromUbl(xml).document.invoiceReferences, []);
});

test('NL-to-NL CreditNote requires a customer KvK or OIN server-side', () => {
 const result = validateInvoiceData({ ...base, customerKvkKbo: '' });
 assert.equal(result.valid, false);
 assert.ok(result.errors.includes('Klant: KvK/OIN ontbreekt voor een Nederlandse creditfactuur'));
});

test('raw Dutch OIN uses scheme 0190 for endpoint and legal entity', () => {
 const oin = '00000004000000054000';
 const xml = generateUBL({ ...base, customerKvkKbo: oin, customerPeppolId: '' });
 assert.match(xml, new RegExp(`<cbc:EndpointID schemeID="0190">${oin}</cbc:EndpointID>`));
 assert.match(xml, new RegExp(`<cbc:CompanyID schemeID="0190">${oin}</cbc:CompanyID>`));
 assert.equal(buildRecommandPayloadFromUbl(xml).recipient, `0190:${oin}`);
 const payload = buildRecommandPayloadFromUbl(xml);
 assert.equal(payload.document.buyer.enterpriseNumber, oin);
 assert.equal(payload.document.buyer.enterpriseNumberScheme, '0190');
});

test('negative CreditNote quantity or price is blocked with the exact safe-UX message', () => {
 const message = 'Gebruik geen minteken. Voer het te crediteren bedrag positief in.';
 for (const lines of [
  [{ ...base.lines[0], unitPrice: -100 }],
  [{ ...base.lines[0], quantity: -1 }],
 ]) {
  const result = validateInvoiceData({ ...base, lines });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes(message));
 }
 assert.match(nieuwPage, /Gebruik geen minteken\. Voer het te crediteren bedrag positief in\./);
 assert.match(nieuwPage, /rawValue\.includes\("-"\)/);
});

test('Recommand payload is derived from CreditNote UBL with invoice references', () => {
 const payload = buildRecommandPayloadFromUbl(generateUBL(base));
 assert.equal(payload.documentType, 'creditNote');
 assert.equal(payload.document.creditNoteNumber, 'CN-2026-001');
 assert.equal(payload.document.issueDate, '2026-09-10');
 assert.equal(payload.document.buyerReference, 'ORDER-1');
 assert.deepEqual(payload.document.invoiceReferences, [{ id: 'INV-2026-004', issueDate: '2026-08-20' }]);
 assert.equal(payload.document.seller.name, 'Supplier BV');
 assert.equal(payload.document.seller.enterpriseNumber, '42041391');
 assert.equal(payload.document.seller.enterpriseNumberScheme, '0106');
 assert.equal(payload.document.buyer.name, 'Customer BV');
 assert.equal(payload.document.buyer.enterpriseNumber, '87654321');
 assert.equal(payload.document.buyer.enterpriseNumberScheme, '0106');
 assert.deepEqual(payload.document.lines.map((line) => [line.quantity, line.netPriceAmount, line.vat.percentage]), [
  ['2', '50.00', '21.00'],
  ['1', '100.00', '9.00'],
  ['1', '25.00', '0.00'],
 ]);
});

test('official Invoice and CreditNote document support identifiers are distinct', () => {
 assert.match(PEPPOL_BIS_BILLING_INVOICE_DOCUMENT_TYPE, /Invoice-2::Invoice##/);
 assert.match(PEPPOL_BIS_BILLING_CREDIT_NOTE_DOCUMENT_TYPE, /CreditNote-2::CreditNote##/);
 assert.notEqual(PEPPOL_BIS_BILLING_CREDIT_NOTE_DOCUMENT_TYPE, PEPPOL_BIS_BILLING_INVOICE_DOCUMENT_TYPE);
});

test('send route trusts stored UBL for document type and preserves protected credit/idempotency flow', () => {
 assert.match(sendRoute, /buildRecommandPayloadFromUbl\(existing\.ubl_xml\)/);
 assert.match(sendRoute, /const documentType = fromUbl\.documentType/);
 assert.match(sendRoute, /documentType === "creditNote"[\s\S]*verifyRecipientSupportsCreditNote/);
 assert.match(sendRoute, /const payload = \{ recipient, documentType, document \}/);
 assert.doesNotMatch(sendRoute, /documentType\s*=\s*input\./);

 const consistency = sendRoute.indexOf('validateStoredInvoiceConsistency');
 const claim = sendRoute.indexOf('claimTargetForSending', consistency);
 const reserve = sendRoute.indexOf('reserveSendCredit', claim);
 const verifySupport = sendRoute.indexOf('verifyRecipientSupports', reserve);
 const send = sendRoute.indexOf('sendDocument', verifySupport);
 assert.ok(consistency >= 0 && claim > consistency && reserve > claim && verifySupport > reserve && send > verifySupport);
 assert.match(sendRoute, /if \(!support\.isValid\)[\s\S]*releaseAfterFailure/);
 assert.match(sendRoute, /sendOutcome = classifySendResult\(send\)/);
 assert.match(sendRoute, /if \(sendOutcome === "provider_outcome_unknown"\)/);
 assert.match(sendRoute, /if \(sendOutcome === "safe_to_release"\)/);
 assert.match(sendRoute, /if \(!creditReleased\)[\s\S]*releaseSendCredit/);
 assert.match(sendRoute, /if \(hasCompletedSend\(existing\)\) return existingSendResponse\(existing\)/);
 assert.match(sendRoute, /if \(!claim\)[\s\S]*waitForCompletedSend/);
});

test('provider acceptance never releases credit when status lookup or persistence fails', () => {
 assert.match(sendRoute, /async function getDocumentStatusBestEffort/);
 assert.match(sendRoute, /getDocumentStatusBestEffort\(acceptedDocumentId\)/);
 assert.match(sendRoute, /let sendOutcome: SendOutcomeDisposition \| null = null/);
 assert.match(sendRoute, /sendOutcome = classifySendResult\(send\)/);
 assert.match(sendRoute, /existing\.recommand_status === "sending"[\s\S]*findOutgoingDocument/);
 assert.ok(sendRoute.indexOf('findOutgoingDocument', sendRoute.indexOf('export async function POST')) < sendRoute.indexOf('claimTargetForSending', sendRoute.indexOf('export async function POST')));
 const catchBlock = sendRoute.match(/\} catch \(error\) \{[\s\S]*?return jsonError\("Recommand verzenden is mislukt/)?.[0] || '';
 assert.match(catchBlock, /sendException === "provider_accepted"/);
 assert.ok(catchBlock.indexOf('sendException === "provider_accepted"') < catchBlock.indexOf('releaseAfterFailure()'));
});

const rawSend = (status, body) => ({ ok: status >= 200 && status < 300, status, statusText: '', url: 'https://provider.invalid/send', body });

test('200 success=true with a contract document id is proven accepted', () => {
 assert.equal(classifySendResult({ success: true, documentId: 'doc-123', raw: rawSend(200, { success: true, id: 'doc-123' }) }), 'provider_accepted');
});

test('400 success=false is a proven reject and may release credit', () => {
 assert.equal(classifySendResult({ success: false, documentId: null, raw: rawSend(400, { success: false, error: 'validation' }) }), 'safe_to_release');
});

test('422 success=false is a proven reject and may release credit', () => {
 assert.equal(classifySendResult({ success: false, documentId: null, raw: rawSend(422, { success: false, error: 'rejected' }) }), 'safe_to_release');
});

test('500 response is unknown and may not release credit', () => {
 assert.equal(classifySendResult({ success: false, documentId: null, raw: rawSend(500, { success: false }) }), 'provider_outcome_unknown');
});

test('200 malformed or missing success/id is unknown and may not release credit', () => {
 for (const body of [{}, { success: true }, { success: false }, 'not-json']) {
  assert.equal(classifySendResult({ success: false, documentId: null, raw: rawSend(200, body) }), 'provider_outcome_unknown');
 }
});

test('fetch exception after request start is unknown and may not release credit', async () => {
 const oldKey = process.env.RECOMMAND_API_KEY;
 const oldSecret = process.env.RECOMMAND_API_SECRET;
 const oldFetch = globalThis.fetch;
 process.env.RECOMMAND_API_KEY = 'test-key';
 process.env.RECOMMAND_API_SECRET = 'test-secret';
 let sendAttempted = false;
 globalThis.fetch = async () => { throw new Error('connection lost'); };
 try {
  await assert.rejects(sendDocument('company-1', {}, () => { sendAttempted = true; }), /connection lost/);
  assert.equal(classifySendException({ sendAttempted }), 'provider_outcome_unknown');
 } finally {
  globalThis.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.RECOMMAND_API_KEY; else process.env.RECOMMAND_API_KEY = oldKey;
  if (oldSecret === undefined) delete process.env.RECOMMAND_API_SECRET; else process.env.RECOMMAND_API_SECRET = oldSecret;
 }
});

test('unknown outcomes reconcile without releasing credit or automatic resend', () => {
 assert.equal(classifySendException({ sendAttempted: false }), 'safe_to_release');
 assert.match(sendRoute, /classifySendException/);
 assert.match(sendRoute, /classifySendResult\(send\)/);
 assert.match(sendRoute, /let sendAttempted = false/);
 assert.match(sendRoute, /sendDocument\([^;]*\(\) => \{ sendAttempted = true; \}\)/);
 assert.match(recommandClient, /onRequestStarted\?\.\(\);[\s\S]*await fetch/);
 assert.match(sendRoute, /function unknownSendOutcomeResponse[\s\S]*status: 409/);
 const catchBlock = sendRoute.match(/\} catch \(error\) \{[\s\S]*?return jsonError\("Recommand verzenden is mislukt/)?.[0] || '';
 assert.match(catchBlock, /sendException === "provider_outcome_unknown"/);
 assert.match(catchBlock, /return reconcileUnknownSendOutcome\(\)/);
 const reconcileBlock = sendRoute.match(/const reconcileUnknownSendOutcome = async \(\) => \{[\s\S]*?return unknownSendOutcomeResponse\(reserved\.send_credits\);[\s\S]*?\};/)?.[0] || '';
 assert.match(reconcileBlock, /findOutgoingDocument/);
 assert.ok(reconcileBlock.indexOf('findOutgoingDocument') < reconcileBlock.indexOf('recommand_status: "send_outcome_unknown"'));
 assert.match(reconcileBlock, /recommand_status: "send_outcome_unknown"/);
 assert.doesNotMatch(reconcileBlock, /releaseAfterFailure/);
 assert.ok(catchBlock.indexOf('sendException === "provider_outcome_unknown"') < catchBlock.indexOf('releaseAfterFailure()'));
 assert.match(sendRoute, /existing\.recommand_status === "send_outcome_unknown"/);
 assert.match(sendRoute, /!recovered\.checked[\s\S]*unknownSendOutcomeResponse/);
});

test('CreditNote preview labels the correction and avoids due-date wording', () => {
 const payload = buildRecommandPayloadFromUbl(generateUBL(base));
 const preview = buildInvoicePreviewFromPayload(payload.recipient, payload.document, payload.currency);
 assert.equal(preview.documentType, 'creditNote');
 assert.equal(preview.originalInvoiceNumber, 'INV-2026-004');
 assert.equal(preview.totals.total, '255.00');
 assert.match(confirmation, /CREDITFACTUUR/);
 assert.match(confirmation, /Crediteert factuur:/);
 assert.match(confirmation, /Te crediteren totaal/);
 assert.match(confirmation, /preview\.documentType === "creditNote"/);
});

test('/nieuw exposes document choice and CreditNote references without changing /convert', () => {
 assert.match(nieuwPage, /Factuur/);
 assert.match(nieuwPage, /Creditfactuur/);
 assert.match(nieuwPage, /originalInvoiceNumber/);
 assert.match(nieuwPage, /originalInvoiceDate/);
 assert.doesNotMatch(convertRoute, /creditNote|CreditNote|originalInvoice/);
});

test('Recommand reconciliation matches only the exact outgoing company document and recipient', async () => {
 const oldKey = process.env.RECOMMAND_API_KEY;
 const oldSecret = process.env.RECOMMAND_API_SECRET;
 const oldFetch = globalThis.fetch;
 process.env.RECOMMAND_API_KEY = 'test-key';
 process.env.RECOMMAND_API_SECRET = 'test-secret';
 let requestedUrl = '';
 globalThis.fetch = async (url) => {
  requestedUrl = String(url);
  return new Response(JSON.stringify({
   success: true,
   documents: [
    { id: 'wrong', companyId: 'company-1', direction: 'outgoing', receiverId: '0106:99999999', type: 'creditNote', parsed: { creditNoteNumber: 'CN-2026-001' } },
    { id: 'doc-match', companyId: 'company-1', direction: 'outgoing', receiverId: '0106:87654321', type: 'creditNote', createdAt: '2026-09-10T09:00:00Z', parsed: { creditNoteNumber: 'CN-2026-001' } },
   ],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
 };
 try {
  const result = await findOutgoingDocument('company-1', 'creditNote', 'CN-2026-001', '0106:87654321');
  assert.equal(result.checked, true);
  assert.equal(result.documentId, 'doc-match');
  assert.equal(result.createdAt, '2026-09-10T09:00:00Z');
  assert.match(requestedUrl, /companyId=company-1/);
  assert.match(requestedUrl, /direction=outgoing/);
  assert.match(requestedUrl, /type=creditNote/);
  assert.match(requestedUrl, /search=CN-2026-001/);
 } finally {
  globalThis.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.RECOMMAND_API_KEY; else process.env.RECOMMAND_API_KEY = oldKey;
  if (oldSecret === undefined) delete process.env.RECOMMAND_API_SECRET; else process.env.RECOMMAND_API_SECRET = oldSecret;
 }
});
