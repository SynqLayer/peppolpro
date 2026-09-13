import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ts from 'typescript';

const source = readFileSync(new URL('../app/api/invoices/[invoiceId]/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const id = '00000000-0000-4000-8000-000000000001';
function route({ user = { id: 'owner' }, invoice = { id, pdf_path: 'private/archived.pdf', invoice_number: 'INV-2026-00001' }, dbError = null, storageError = null, storageData = new Blob(['archived bytes']) } = {}) {
 const calls = [];
 const query = {
  select(fields) { assert.ok(!fields.includes('payments')); calls.push(['select', fields]); return this; },
  eq(key, value) { calls.push([key, value]); return this; },
  async maybeSingle() { return { data: invoice, error: dbError }; },
 };
 const exports = {};
 class NextResponse extends Response { static json(body, init) { return Response.json(body, init); } }
 vm.runInNewContext(compiled, { exports, Buffer, require(name) {
  if (name === 'node:crypto') return crypto;
  if (name === 'next/server') return { NextResponse };
  if (name === '@/lib/supabase-server') return {
   createServerSupabase: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: () => query }),
   createAdminSupabase: () => { calls.push(['admin']); return { storage: { from: () => ({ download: async (path) => { calls.push(['download', path]); return { data: storageData, error: storageError }; } }) } }; },
  };
  throw new Error(`Unexpected import ${name}`);
 } });
 return { get: (invoiceId = id) => exports.GET(null, { params: Promise.resolve({ invoiceId }) }), calls };
}
for (const [label, options, status] of [
 ['anonymous user', { user: null }, 401],
 ['database outage', { dbError: { message: 'private database error' } }, 500],
 ['missing or foreign invoice', { invoice: null }, 404],
 ['unarchived invoice', { invoice: { id } }, 503],
]) {
 test(`P1-01 ${label} returns ${status} without privileged storage access`, async () => {
  const r = route(options); const response = await r.get();
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(r.calls.some(([name]) => name === 'admin'), false);
  assert.ok(!(await response.text()).includes('private database error'));
 });
}
test('P1-01 invalid IDs are rejected before any invoice or storage lookup', async () => {
 const r = route(); assert.equal((await r.get('bad')).status, 400); assert.deepEqual(r.calls, []);
});
test('P1-01 archive errors return 503 without generating a replacement', async () => {
 const r = route({ storageError: { message: 'secret provider detail' } });
 const response = await r.get(); assert.equal(response.status, 503);
 assert.ok(!(await response.text()).includes('secret provider detail'));
});
test('P1-01 downloads unchanged archive bytes after owner filtering', async () => {
 const r = route(); const response = await r.get();
 assert.equal(response.status, 200); assert.equal(await response.text(), 'archived bytes');
 assert.equal(response.headers.get('content-type'), 'application/pdf');
 assert.ok(r.calls.findIndex(([name]) => name === 'user_id') < r.calls.findIndex(([name]) => name === 'admin'));
 assert.deepEqual(r.calls.find(([name]) => name === 'user_id'), ['user_id', 'owner']);
});
