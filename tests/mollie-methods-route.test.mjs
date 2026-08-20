import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(new URL('../app/api/admin/mollie-methods/route.ts', import.meta.url), 'utf8');

test('admin Mollie methods diagnostic route is secret protected and uses exact Verzenden 25 query', () => {
  assert.match(route, /process\.env\.ADMIN_SECRET/);
  assert.match(route, /searchParams\.get\("secret"\)/);
  assert.match(route, /status:\s*403/);

  assert.match(route, /process\.env\.MOLLIE_API_KEY/);
  assert.match(route, /https:\/\/api\.mollie\.com\/v2\/methods/);
  assert.match(route, /amount\[currency\]",\s*"EUR"/);
  assert.match(route, /amount\[value\]",\s*"12\.00"/);
  assert.match(route, /sequenceType",\s*"first"/);
  assert.match(route, /resource",\s*"payments"/);
  assert.match(route, /Authorization:\s*`Bearer \$\{apiKey\}`/);
  assert.doesNotMatch(route, /console\.log|console\.error/);
});
