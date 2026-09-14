import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateUBL } from '../lib/ubl-generator.ts';
import { buildRecommandPayloadFromUbl } from '../lib/ubl-to-recommand.ts';
import { validateRecommandCreditNoteDocument } from '../lib/recommand-credit-note.ts';

const sendRoute = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/0034_idempotent_failed_send_ubl_refunds.sql', import.meta.url), 'utf8');

const base = {
 supplierName: 'SynqLayer',
 supplierAddress: 'Teststraat 1',
 supplierPostalCode: '1234AB',
 supplierCity: 'Amsterdam',
 supplierCountry: 'NL',
 supplierVatNr: 'NL005450830B62',
 supplierKvkKbo: '42041391',
 supplierIban: 'NL64RABO0118774336',
 customerName: 'Ontvanger',
 customerAddress: 'Klantstraat 2',
 customerPostalCode: '2000BB',
 customerCity: 'Rotterdam',
 customerCountry: 'NL',
 customerVatNr: 'NL987654321B01',
 customerKvkKbo: '87654321',
 customerPeppolId: '0106:87654321',
 customerEmail: 'customer@example.invalid',
 buyerReference: 'ORDER-1',
 invoiceNumber: 'CN-SCHEME-1',
 invoiceDate: '2026-09-14',
 dueDate: '2026-10-14',
 currency: 'EUR',
 documentType: 'creditNote',
 originalInvoiceNumber: 'INV-1',
 originalInvoiceDate: '2026-09-01',
 lines: [{ id: '1', description: 'Correctie', quantity: 1, unitPrice: 10, vatPct: 21 }],
};

function customerParty(xml) {
 return xml.match(/<cac:AccountingCustomerParty>[\s\S]*?<\/cac:AccountingCustomerParty>/)?.[0] || '';
}

function supplierParty(xml) {
 return xml.match(/<cac:AccountingSupplierParty>[\s\S]*?<\/cac:AccountingSupplierParty>/)?.[0] || '';
}

test('CreditNote writes and maps BE KBO scheme 0208 for the buyer', () => {
 const xml = generateUBL({
  ...base,
  customerCountry: 'BE',
  customerVatNr: 'BE0674771986',
  customerKvkKbo: '0674771986',
  customerPeppolId: '0208:0674771986',
 });
 assert.match(customerParty(xml), /<cac:PartyLegalEntity>[\s\S]*<cbc:CompanyID schemeID="0208">0674771986<\/cbc:CompanyID>/);
 const payload = buildRecommandPayloadFromUbl(xml);
 assert.equal(payload.documentType, 'creditNote');
 assert.equal(payload.document.buyer.enterpriseNumber, '0674771986');
 assert.equal(payload.document.buyer.enterpriseNumberScheme, '0208');
});

test('CreditNote writes and maps NL KvK scheme 0106 for buyer and seller', () => {
 const xml = generateUBL(base);
 assert.match(customerParty(xml), /<cac:PartyLegalEntity>[\s\S]*<cbc:CompanyID schemeID="0106">87654321<\/cbc:CompanyID>/);
 assert.match(supplierParty(xml), /<cac:PartyLegalEntity>[\s\S]*<cbc:CompanyID schemeID="0106">42041391<\/cbc:CompanyID>/);
 const payload = buildRecommandPayloadFromUbl(xml);
 assert.equal(payload.documentType, 'creditNote');
 assert.equal(payload.document.buyer.enterpriseNumberScheme, '0106');
 assert.equal(payload.document.seller.enterpriseNumberScheme, '0106');
});

test('Invoice also always writes PartyLegalEntity schemeID for buyer and seller', () => {
 const xml = generateUBL({ ...base, documentType: 'invoice', invoiceNumber: 'INV-SCHEME-1' });
 assert.match(customerParty(xml), /<cac:PartyLegalEntity>[\s\S]*<cbc:CompanyID schemeID="0106">87654321<\/cbc:CompanyID>/);
 assert.match(supplierParty(xml), /<cac:PartyLegalEntity>[\s\S]*<cbc:CompanyID schemeID="0106">42041391<\/cbc:CompanyID>/);
});

test('stored UBL scheme fallback prefers legal entity, PartyIdentification, EndpointID, then number prefix', () => {
 const generated = generateUBL(base);
 const endpointFallback = generated.replace(
  /(<cac:AccountingCustomerParty>[\s\S]*?<cac:PartyLegalEntity>[\s\S]*?<cbc:CompanyID) schemeID="0106"/,
  '$1',
 );
 assert.equal(buildRecommandPayloadFromUbl(endpointFallback).document.buyer.enterpriseNumberScheme, '0106');

 const partyIdentificationFallback = endpointFallback.replace(
  /(<cac:AccountingCustomerParty>\s*<cac:Party>)/,
  '$1\n<cac:PartyIdentification><cbc:ID schemeID="0190">00000004000000054000</cbc:ID></cac:PartyIdentification>',
 );
 const partyPayload = buildRecommandPayloadFromUbl(partyIdentificationFallback);
 assert.equal(partyPayload.document.buyer.enterpriseNumberScheme, '0190');
 assert.equal(partyPayload.document.buyer.enterpriseNumber, '00000004000000054000');

 const prefixFallback = endpointFallback
  .replace(/(<cac:AccountingCustomerParty>[\s\S]*?<cbc:EndpointID) schemeID="0106">87654321/, '$1>ONBEKEND');
 assert.equal(buildRecommandPayloadFromUbl(prefixFallback).document.buyer.enterpriseNumberScheme, '0106');
});

test('missing or unsupported enterprise scheme fails hard before a Recommand call', () => {
 const xml = generateUBL(base)
  .replace(/(<cac:AccountingCustomerParty>[\s\S]*?<cbc:EndpointID) schemeID="0106">87654321/, '$1>ONBEKEND')
  .replace(/(<cac:AccountingCustomerParty>[\s\S]*?<cac:PartyLegalEntity>[\s\S]*?<cbc:CompanyID) schemeID="0106">87654321/, '$1>ONBEKEND');
 assert.throws(() => buildRecommandPayloadFromUbl(xml), /Klant: ondernemingsnummerschema ontbreekt of wordt niet door Recommand ondersteund/);
 const validationBlock = sendRoute.match(/let fromUbl[\s\S]*?const claim = await claimTargetForSending/)?.[0] || '';
 assert.match(validationBlock, /buildRecommandPayloadFromUbl/);
 assert.match(validationBlock, /validateRecommandCreditNoteDocument/);
 assert.match(validationBlock, /refundUblGenerationCreditAfterFailure/);
 assert.doesNotMatch(validationBlock, /sendDocument\(/);
});

test('pre-send validator covers every required CreditNote party and line field and rejects invalid schemes', () => {
 const payload = buildRecommandPayloadFromUbl(generateUBL(base));
 const malformed = structuredClone(payload.document);
 malformed.buyer.enterpriseNumberScheme = '9944';
 malformed.buyer.enterpriseNumber = '';
 malformed.buyer.postalZone = '';
 malformed.buyerReference = '';
 malformed.lines[0].name = '';
 malformed.lines[0].quantity = '';
 malformed.lines[0].netPriceAmount = '';
 malformed.lines[0].vat.percentage = '';
 const errors = validateRecommandCreditNoteDocument(malformed);
 assert.ok(errors.includes('Klant: ondernemingsnummer ontbreekt'));
 assert.ok(errors.includes('Klant: ondernemingsnummerschema wordt niet door Recommand ondersteund'));
 assert.ok(errors.includes('Klant: postcode ontbreekt'));
 assert.ok(errors.includes('Klantreferentie ontbreekt'));
 assert.ok(errors.includes('Regel 1: naam ontbreekt'));
 assert.ok(errors.includes('Regel 1: aantal ontbreekt'));
 assert.ok(errors.includes('Regel 1: prijs ontbreekt'));
 assert.ok(errors.includes('Regel 1: BTW-percentage ontbreekt'));
});

test('failed-send UBL refund migration is conversion-idempotent, audited and service-role only', () => {
 assert.match(migration, /add column if not exists ubl_credit_used boolean not null default false/);
 assert.match(migration, /create table if not exists public\.failed_send_ubl_credit_refunds/);
 assert.match(migration, /conversion_id uuid primary key references public\.conversions\(id\)/);
 assert.match(migration, /reason text not null/);
 assert.match(migration, /for update/);
 assert.match(migration, /v_credit_used is not true/);
 assert.match(migration, /v_document_id is not null/);
 assert.match(migration, /v_sent_at is not null/);
 assert.match(migration, /on conflict \(conversion_id\) do nothing/);
 assert.match(migration, /set credits = up\.credits \+ 1/);
 assert.match(migration, /service_role required to release failed-send UBL credit/);
 assert.match(migration, /revoke all on function public\.release_failed_send_ubl_credit\(uuid, text\) from public, anon, authenticated, hermes_operator/);
 assert.match(migration, /grant execute on function public\.release_failed_send_ubl_credit\(uuid, text\) to service_role/);
});

test('send route refunds consumed UBL credit on local validation and definitive provider failure', () => {
 assert.match(sendRoute, /rpc\("release_failed_send_ubl_credit"/);
 assert.match(sendRoute, /recommand_pre_send_validation_failed/);
 assert.match(sendRoute, /recommand_provider_rejected/);
 const providerReject = sendRoute.match(/if \(send\.raw\.status >= 400[\s\S]*?if \(sendOutcome === "provider_outcome_unknown"\)/)?.[0] || '';
 assert.match(providerReject, /refundUblGenerationCreditAfterFailure/);
});
