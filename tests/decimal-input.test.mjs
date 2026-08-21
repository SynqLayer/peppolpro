import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDecimalCurrencyInput, parseDecimalInput, sanitizeDecimalCurrencyDisplayInput, sanitizeDecimalCurrencyInput, sanitizeDecimalDisplayInput } from '../lib/decimal-input.ts';

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


test('controlled currency input keeps a typed comma decimal visible while storing a number', () => {
 let visible = '';
 let stored = 0;
 for (const char of '6991,09') {
  visible = sanitizeDecimalCurrencyDisplayInput(`${visible}${char}`);
  stored = parseDecimalCurrencyInput(visible);
 }
 assert.equal(visible, '6991,09');
 assert.equal(stored, 6991.09);
 assert.equal(Math.round(stored * 1.21 * 100) / 100, 8459.22);
});

test('controlled currency input keeps a typed dot decimal visible while storing a number', () => {
 let visible = '';
 let stored = 0;
 for (const char of '6991.09') {
  visible = sanitizeDecimalCurrencyDisplayInput(`${visible}${char}`);
  stored = parseDecimalCurrencyInput(visible);
 }
 assert.equal(visible, '6991.09');
 assert.equal(stored, 6991.09);
});


test('controlled quantity input keeps comma decimals visible while storing a number', () => {
 let visible = '';
 let stored = 0;
 for (const char of '1,5') {
  visible = sanitizeDecimalDisplayInput(`${visible}${char}`, 3);
  stored = parseDecimalInput(visible, 3);
 }
 assert.equal(visible, '1,5');
 assert.equal(stored, 1.5);
});

test('controlled quantity input supports large decimal quantities', () => {
 let visible = '';
 let stored = 0;
 for (const char of '1234567,125') {
  visible = sanitizeDecimalDisplayInput(`${visible}${char}`, 3);
  stored = parseDecimalInput(visible, 3);
 }
 assert.equal(visible, '1234567,125');
 assert.equal(stored, 1234567.125);
});

test('pasted Dutch thousands currency input is normalized for display and totals', () => {
 const visible = sanitizeDecimalCurrencyDisplayInput('6.991,09');
 const stored = parseDecimalCurrencyInput(visible);
 assert.equal(visible, '6991,09');
 assert.equal(stored, 6991.09);
 assert.equal(Math.round(stored * 1.21 * 100) / 100, 8459.22);
});
