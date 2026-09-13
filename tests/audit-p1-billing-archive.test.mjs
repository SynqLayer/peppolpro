import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as crypto from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../lib/billing-archive.ts', import.meta.url), 'utf8');
const exports = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
 { exports, Buffer, Uint8Array, require: (name) => { assert.equal(name, 'node:crypto'); return crypto; } });
const { preserveArchivedPdf, pdfHash } = exports;
const bytes = Buffer.from('original invoice bytes');
test('P1-02 archived invoice is returned without rendering or uploading', async () => {
 let renders = 0;
 const result = await preserveArchivedPdf({ bucket: { download: async () => ({ data: new Blob([bytes]) }) }, path: 'archive', archived: true,
  expectedHash: pdfHash(bytes), render: async () => { renders++; return Buffer.from('changed profile'); } });
 assert.deepEqual(Buffer.from(result), bytes); assert.equal(renders, 0);
});
test('P1-02 missing archived bytes fail instead of regenerating', async () => {
 await assert.rejects(preserveArchivedPdf({ bucket: { download: async () => ({ error: new Error('missing') }) }, path: 'archive', archived: true,
  render: async () => { assert.fail('must not render'); } }), /niet beschikbaar/);
});
test('P1-02 tampered bytes fail integrity validation', async () => {
 await assert.rejects(preserveArchivedPdf({ bucket: { download: async () => ({ data: new Blob(['altered']) }) }, path: 'archive', archived: true,
  expectedHash: pdfHash(bytes), render: async () => bytes }), /integriteitscontrole/);
});
test('P1-02 retry after upload/DB failure preserves the first stored version', async () => {
 const bucket = {
  upload: async (_path, _bytes, options) => { assert.equal(options.upsert, false); return { error: { statusCode: '409' } }; },
  download: async () => ({ data: new Blob([bytes]) }),
 };
 const result = await preserveArchivedPdf({ bucket, path: 'archive', archived: false, render: async () => Buffer.from('second render') });
 assert.deepEqual(Buffer.from(result), bytes);
});
test('P1-02 failed upload cannot be presented as an archive success', async () => {
 await assert.rejects(preserveArchivedPdf({ bucket: { upload: async () => ({ error: { statusCode: 503 } }) }, path: 'archive', archived: false,
  render: async () => bytes }), /opslaan mislukt/);
});

test('P1-02 application obtains the exact retention date from SQL', async () => {
 const calls = [];
 const db = { rpc: async (name, args) => { calls.push({ name, args }); return { data: '2033-12-31', error: null }; } };
 assert.equal(await exports.verifyInvoiceRetention(db, '2026-01-01', '2033-12-31T00:00:00+00:00'), '2033-12-31');
 assert.equal(calls[0].name, 'invoice_retention_until');
 assert.equal(calls[0].args.invoice_date, '2026-01-01');
 for (const stored of ['2033-12-30T00:00:00Z', '2034-01-01T00:00:00Z']) {
  await assert.rejects(exports.verifyInvoiceRetention(db, '2026-01-01', stored), /wijkt af/);
 }
});
test('P1-02 unavailable retention RPC fails closed', async () => {
 await assert.rejects(exports.verifyInvoiceRetention({ rpc: async () => ({ error: { message: 'unavailable' } }) }, '2026-01-01', '2033-12-31T00:00:00Z'), /kon niet worden gecontroleerd/);
});
