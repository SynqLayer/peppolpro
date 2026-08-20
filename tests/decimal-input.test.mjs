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
