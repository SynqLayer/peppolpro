import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateUBL } from '../lib/ubl-generator.ts';
import { validateInvoiceData } from '../lib/ubl-validator.ts';
import { buildRecommandPayloadFromUbl } from '../lib/ubl-to-recommand.ts';
import { buildInvoicePreviewFromPayload } from '../lib/invoice-preview.ts';
import {
 PEPPOL_BIS_BILLING_CREDIT_NOTE_DOCUMENT_TYPE,
 PEPPOL_BIS_BILLING_INVOICE_DOCUMENT_TYPE,
} from '../lib/recommand.ts';

const root = new URL('../', import.meta.url);
const sendRoute = readFileSync(new URL('app/api/recommand/send/route.ts', root), 'utf8');
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
 assert.deepEqual(payload.document.invoiceReferences, [{ id: 'INV-2026-004', issueDate: '2026-08-20' }]);
 assert.equal(payload.document.seller.name, 'Supplier BV');
 assert.equal(payload.document.buyer.name, 'Customer BV');
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
 assert.match(sendRoute, /if \(!send\.success\)[\s\S]*releaseAfterFailure/);
 assert.match(sendRoute, /if \(!creditReleased\)[\s\S]*releaseSendCredit/);
 assert.match(sendRoute, /if \(hasCompletedSend\(existing\)\) return existingSendResponse\(existing\)/);
 assert.match(sendRoute, /if \(!claim\)[\s\S]*waitForCompletedSend/);
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
