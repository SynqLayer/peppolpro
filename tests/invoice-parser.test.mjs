import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parseGeminiInvoiceJson,
 extractFirstJsonValue,
 InvoiceParserError,
 describeInvoiceParserError,
} from '../lib/invoice-parser.ts';

const invoiceJson = JSON.stringify({
 seller: { name: 'Leverancier BV', address: null, postal_code: null, city: null, country: 'NL', kvk_number: null, btw_number: null, iban: null, email: null, phone: null },
 buyer: { name: 'Klant BV', address: null, postal_code: null, city: null, country: 'NL', btw_number: null },
 invoice: { number: 'INV-1', date: '2026-08-28', due_date: null, currency: 'EUR', payment_terms: null, reference: null },
 lines: [{ description: 'Werk', quantity: 1, unit_price: 100, vat_rate: 21, vat_amount: 21, line_total: 121 }],
 totals: { subtotal: 100, total_vat: 21, total: 121 },
});

test('invoice parser parses fenced json responses', () => {
 const parsed = parseGeminiInvoiceJson('```json\n' + invoiceJson + '\n```');
 assert.equal(parsed.invoice.number, 'INV-1');
});

test('invoice parser parses unlabeled fenced json responses', () => {
 const parsed = parseGeminiInvoiceJson('```\n' + invoiceJson + '\n```');
 assert.equal(parsed.totals.total, 121);
});

test('invoice parser extracts first json object with text before and after', () => {
 const parsed = parseGeminiInvoiceJson(`Hier is de factuur:\n${invoiceJson}\nSucces.`);
 assert.equal(parsed.seller.name, 'Leverancier BV');
});

test('json extraction respects braces inside strings', () => {
 const json = '{"seller":{"name":"A { B }"},"buyer":{},"invoice":{"currency":"EUR"},"lines":[],"totals":{"subtotal":0,"total_vat":0,"total":0}}';
 assert.equal(extractFirstJsonValue(`prefix ${json} suffix`), json);
});

test('invalid json yields typed parser error with log-safe details', () => {
 assert.throws(
  () => parseGeminiInvoiceJson('prefix {"seller": true trailing'),
  (error) => {
   assert.ok(error instanceof InvoiceParserError);
   assert.equal(error.kind, 'unexpected_response');
   const details = describeInvoiceParserError(error);
   assert.equal(details.name, 'InvoiceParserError');
   assert.equal(details.kind, 'unexpected_response');
   assert.match(details.message, /onvolledige JSON|ongeldige JSON|geen JSON/);
   assert.ok(!('rawResponse' in details));
   return true;
  },
 );
});
