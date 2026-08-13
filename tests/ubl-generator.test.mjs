import test from 'node:test';
import assert from 'node:assert/strict';
import { generateUBL } from '../lib/ubl-generator.ts';

const baseInvoice = {
 supplierName: 'Supplier BV',
 supplierAddress: 'Straat 1',
 supplierCity: 'Waddinxveen',
 supplierCountry: 'NL',
 supplierVatNr: 'NL005450830B62',
 supplierKvkKbo: '42041391',
 supplierIban: 'NL64RABO0118774336',
 customerName: 'Belgische Klant BV',
 customerAddress: 'Gentseweg 1',
 customerCity: 'Antwerpen',
 customerCountry: 'NL',
 customerVatNr: 'BE0674771986',
 customerKvkKbo: '',
 customerPeppolId: '',
 buyerReference: 'TEST',
 invoiceNumber: 'TEST-1',
 invoiceDate: '2026-08-13',
 dueDate: '2026-08-27',
 currency: 'EUR',
 lines: [{ id: '1', description: 'Test', quantity: 1, unitPrice: 100, vatPct: 21 }],
};

test('UBL generation corrects customer country and endpoint scheme from VAT country prefix', () => {
 const xml = generateUBL(baseInvoice);
 assert.match(xml, /<cbc:EndpointID schemeID="0208">BE0674771986<\/cbc:EndpointID>/);
 assert.match(xml, /<cac:AccountingCustomerParty>[\s\S]*<cbc:IdentificationCode>BE<\/cbc:IdentificationCode>/);
 assert.doesNotMatch(xml, /<cbc:EndpointID schemeID="0106">BE0674771986<\/cbc:EndpointID>/);
});
