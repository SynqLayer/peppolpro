import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDecimalCurrencyInput, sanitizeDecimalCurrencyInput } from '../lib/decimal-input.ts';

test('comma decimal currency input is stored as a number', () => {
 const sanitized = sanitizeDecimalCurrencyInput('150,50');
 assert.equal(sanitized, '150.50');
 assert.equal(parseDecimalCurrencyInput(sanitized), 150.5);
});

test('currency input allows only digits and one decimal separator with max two decimals', () => {
 assert.equal(sanitizeDecimalCurrencyInput('12a3,456'), '123.45');
 assert.equal(sanitizeDecimalCurrencyInput('1,2.3'), '1.23');
 assert.equal(sanitizeDecimalCurrencyInput('9.876'), '9.87');
});

test('currency input handles Dutch and international thousands separators', () => {
 const cases = [
  ['6991,09', 6991.09],
  ['6.991,09', 6991.09],
  ['6991.09', 6991.09],
  ['150,50', 150.5],
  ['150.5', 150.5],
 ];

 for (const [input, expected] of cases) {
  assert.equal(parseDecimalCurrencyInput(input), expected, `${input} should parse as ${expected}`);
 }
});
