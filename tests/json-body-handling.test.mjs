import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

// Een onparseerbare body hoort een 400 te geven, geen 500. Deze routes gaven een 500 omdat de
// parsefout in de algemene catch van de route viel.
const jsonRoutes = [
  ['app/api/generate/route.ts', 'Ongeldige JSON-body'],
  ['app/api/checkout/route.ts', 'Ongeldige JSON-body'],
  ['app/api/webhooks/auth/route.ts', 'Ongeldige JSON-body'],
  ['app/api/monitor-lookup/route.ts', 'Ongeldige JSON-body'],
];

for (const [file, message] of jsonRoutes) {
  test(`${file} geeft 400 bij een onparseerbare body`, () => {
    const source = read(file);
    assert.match(source, /try \{[\s\S]{0,120}await (?:req|request)\.json\(\)[\s\S]{0,200}?catch \{/);
    assert.ok(
      source.includes(`error: "${message}"`) || source.includes(`error: "${message}."`),
      'verwacht de Nederlandse 400-melding',
    );
    assert.match(source, /status:\s*400/);
  });
}

test('de Mollie-webhook geeft 400 als de body geen form-data is', () => {
  const source = read('app/api/mollie/webhook/route.ts');
  assert.match(source, /try \{[\s\S]{0,120}await req\.formData\(\)[\s\S]{0,200}?catch \{/);
  assert.ok(source.includes('Ongeldige webhook-body'));
  assert.match(source, /status:\s*400/);
});

test('de parsefout valt niet meer in de algemene 500-catch', () => {
  for (const [file] of jsonRoutes) {
    const source = read(file);
    const parseIndex = source.indexOf('await req.json()') > -1
      ? source.indexOf('await req.json()')
      : source.indexOf('await request.json()');
    const innerTry = source.lastIndexOf('try {', parseIndex);
    const innerCatch = source.indexOf('catch {', parseIndex);
    assert.ok(innerTry > -1 && innerCatch > parseIndex, `${file} mist een eigen try/catch rond de parse`);
  }
});
