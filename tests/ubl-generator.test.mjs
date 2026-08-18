import test from 'node:test';
import assert from 'node:assert/strict';
import { generateUBL } from '../lib/ubl-generator.ts';

const baseInvoice = {
 supplierName: 'Supplier BV',
 supplierAddress: 'Straat 1',
 supplierPostalCode: '1234AB',
 supplierCity: 'Waddinxveen',
 supplierCountry: 'NL',
 supplierVatNr: 'NL005450830B62',
 supplierKvkKbo: '42041391',
 supplierIban: 'NL64RABO0118774336',
 customerName: 'Belgische Klant BV',
 customerAddress: 'Gentseweg 1',
 customerPostalCode: '9120',
 customerCity: 'Antwerpen',
 customerCountry: 'NL',
 customerVatNr: 'BE0674771986',
 customerKvkKbo: '',
 customerPeppolId: '',
 customerEmail: 'customer@example.nl',
 buyerReference: 'TEST',
 invoiceNumber: 'TEST-1',
 invoiceDate: '2026-08-13',
 dueDate: '2026-08-27',
 currency: 'EUR',
 lines: [{ id: '1', description: 'Test', quantity: 1, unitPrice: 100, vatPct: 21 }],
};

test('UBL generation uses VAT scheme 9925 for Belgian VAT numbers with BE prefix', () => {
 const xml = generateUBL(baseInvoice);
 assert.match(xml, /<cbc:EndpointID schemeID="9925">BE0674771986<\/cbc:EndpointID>/);
 assert.match(xml, /<cac:AccountingCustomerParty>[\s\S]*<cbc:IdentificationCode>BE<\/cbc:IdentificationCode>/);
 assert.doesNotMatch(xml, /<cbc:EndpointID schemeID="0208">BE0674771986<\/cbc:EndpointID>/);
});

test('UBL generation uses KBO scheme 0208 for Belgian KBO numbers without BE prefix', () => {
 const xml = generateUBL({ ...baseInvoice, customerVatNr: '', customerKvkKbo: '0674771986' });
 assert.match(xml, /<cbc:EndpointID schemeID="0208">0674771986<\/cbc:EndpointID>/);
});

test('UBL generation uses Dutch VAT and KvK schemes from the selected number', () => {
 const vatXml = generateUBL({ ...baseInvoice, customerCountry: 'NL', customerVatNr: 'NL005450830B62', customerKvkKbo: '' });
 assert.match(vatXml, /<cbc:EndpointID schemeID="9944">NL005450830B62<\/cbc:EndpointID>/);
 const kvkXml = generateUBL({ ...baseInvoice, customerCountry: 'NL', customerVatNr: '', customerKvkKbo: '42041391' });
 assert.match(kvkXml, /<cbc:EndpointID schemeID="0106">42041391<\/cbc:EndpointID>/);
});

test('UBL generation strips existing Peppol scheme prefix from endpoint value', () => {
 const xml = generateUBL({ ...baseInvoice, customerPeppolId: '0106:42041391', customerVatNr: '', customerKvkKbo: '' });
 assert.match(xml, /<cbc:EndpointID schemeID="0106">42041391<\/cbc:EndpointID>/);
 assert.doesNotMatch(xml, /<cbc:EndpointID schemeID="0106">0106:42041391<\/cbc:EndpointID>/);
});
