import test from 'node:test';
import assert from 'node:assert/strict';
import {
 buildRecommandInvoiceDocument,
 deriveRecommandRecipient,
 validateRecommandInvoiceData,
 validateRecommandInvoiceDocument,
} from '../lib/recommand-invoice.ts';

const validInvoice = {
 supplierName: 'Red Productions',
 supplierAddress: 'Zuidelijke Knibbelweg 38',
 supplierPostalCode: '2765JT',
 supplierCity: 'Cortelande',
 supplierCountry: 'NL',
 supplierVatNr: 'NL001607606B42',
 supplierKvkKbo: '33265552',
 supplierIban: 'NL64RABO0118774336',
 customerName: 'TWIN4U Events & Projects BV',
 customerAddress: 'Gentseweg 309 C03',
 customerPostalCode: '9120',
 customerCity: 'Beveren-Kruibeke-Zwijndrecht',
 customerCountry: 'BE',
 customerVatNr: 'BE0674771986',
 customerKvkKbo: '0674771986',
 customerPeppolId: '',
 customerEmail: 'customer@example.be',
 buyerReference: '14046',
 invoiceNumber: '14046',
 invoiceDate: '2026-08-11',
 dueDate: '2026-08-13',
 currency: 'EUR',
 lines: [{ id: '1', description: '1st deelfactuur 25%', quantity: 1, unitPrice: 6991.10, vatPct: 0 }],
};

test('Recommand send document is built only from explicit form values and succeeds for complete invoice data', () => {
 assert.deepEqual(validateRecommandInvoiceData(validInvoice), []);
 assert.equal(deriveRecommandRecipient(validInvoice), '0208:0674771986');
 const document = buildRecommandInvoiceDocument(validInvoice);
 assert.equal(document.invoiceNumber, '14046');
 assert.equal(document.seller?.postalZone, '2765JT');
 assert.equal(document.buyer.postalZone, '9120');
 assert.equal(document.buyer.country, 'BE');
 assert.equal(document.lines[0].netPriceAmount, '6991.10');
 assert.deepEqual(validateRecommandInvoiceDocument(document), []);
});

test('Recommand send validation blocks missing mandatory fields instead of auto-filling them', () => {
 const errors = validateRecommandInvoiceData({ ...validInvoice, customerPostalCode: '' });
 assert.deepEqual(errors, ['Klant: postcode ontbreekt']);
 assert.throws(() => buildRecommandInvoiceDocument({ ...validInvoice, customerPostalCode: '' }), /Klant: postcode ontbreekt/);
});

test('Recommand API document validation blocks incomplete JSON before provider calls', () => {
 const document = buildRecommandInvoiceDocument(validInvoice);
 const errors = validateRecommandInvoiceDocument({ ...document, buyer: { ...document.buyer, postalZone: '' } });
 assert.deepEqual(errors, ['Klant: postcode ontbreekt']);
});

test('Recommand recipient requires explicit or safely derivable Peppol identifier', () => {
 assert.equal(deriveRecommandRecipient({ ...validInvoice, customerPeppolId: '0208:0674771986', customerKvkKbo: '', customerVatNr: '' }), '0208:0674771986');
 assert.throws(() => deriveRecommandRecipient({ ...validInvoice, customerPeppolId: '0674771986', customerKvkKbo: '', customerVatNr: '' }), /scheme:nummer/);
});
