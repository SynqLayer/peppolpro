import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const convertRoute = readFileSync(new URL('app/api/convert/route.ts', root), 'utf8');
const generateRoute = readFileSync(new URL('app/api/generate/route.ts', root), 'utf8');
const confirmConvertRoute = readFileSync(new URL('app/api/convert/confirm/route.ts', root), 'utf8');
const dashboard = readFileSync(new URL('app/dashboard/DashboardClient.tsx', root), 'utf8');
const adminClient = readFileSync(new URL('app/admin/AdminClient.tsx', root), 'utf8');
const adminPage = readFileSync(new URL('app/admin/page.tsx', root), 'utf8');
const retentionRoute = readFileSync(new URL('app/api/cron/retention-cleanup/route.ts', root), 'utf8');
const migration0028 = readFileSync(new URL('supabase/migrations/0028_normalize_conversion_status.sql', root), 'utf8');
const migration0029 = readFileSync(new URL('supabase/migrations/0029_conversion_drafts_confirm_flow.sql', root), 'utf8');

test('conversion creation uses done as the only completed conversion status', () => {
 assert.match(generateRoute, /status: "done"/);
 assert.match(migration0029, /insert into public\.conversions/);
 assert.match(migration0029, /'done'/);
 assert.match(migration0028, /set status = 'done'[\s\S]*where status = 'success'/i);
 assert.match(migration0028, /set status = 'done'[\s\S]*where status = 'failed'[\s\S]*nullif\(ubl_xml, ''\) is not null/i);
 assert.doesNotMatch(`${convertRoute}\n${confirmConvertRoute}\n${dashboard}\n${adminClient}`, /"success"|'success'/);
});

test('dashboard and admin counters map generated conversions to done only', () => {
 assert.match(dashboard, /done: \{ label: "UBL gegenereerd"/);
 assert.doesNotMatch(dashboard, /success: \{ label:/);
 assert.match(dashboard, /const generatedStatuses = \["done"\]/);
 assert.match(dashboard, /conversion\.ubl_xml \? "done" : conversion\.status/);
 assert.match(adminClient, /const doneCount = conversions\.filter\(c => c\.status === "done"\)\.length/);
 assert.match(adminClient, /conv\.status === "done"/);
});

test('retention cleanup only removes conversion PDFs when a source PDF is actually stored', () => {
 const conversionCleanupBlock = retentionRoute.match(/from\("conversions"\)[\s\S]*?storage\.from\("invoices"\)\.remove\(conversionPdfPaths\)/)?.[0] || '';
 assert.match(conversionCleanupBlock, /select\("id, user_id, created_at"\)/);
 assert.match(conversionCleanupBlock, /\.eq\("source_pdf_stored", true\)/);
 assert.doesNotMatch(conversionCleanupBlock, /\.eq\("status"|\.in\("status"|status:\s*"done"|status:\s*"success"|status:\s*"failed"/);
 assert.match(generateRoute, /source_pdf_stored: false/);
 assert.match(migration0029, /source_pdf_stored boolean not null default true/);
 assert.match(migration0029, /source_pdf_stored[\s\S]*\) values \([\s\S]*false/);
});

test('confirmed PDF conversions keep the original filename without storing the source PDF', () => {
 assert.match(confirmConvertRoute, /select\("filename, assumptions"\)/);
 assert.match(confirmConvertRoute, /p_source_pdf_filename: draftForLog\?\.filename \|\| null/);
 assert.match(migration0029, /source_pdf_filename text/);
 assert.match(migration0029, /source_pdf_filename,[\s\S]*source_pdf_stored/);
 assert.match(adminPage, /source_pdf_filename/);
 assert.match(adminClient, /Bron: \{conv\.source_pdf_filename\}/);
 assert.match(dashboard, /source_pdf_filename/);
 assert.match(dashboard, /Bron: \{conversion\.source_pdf_filename\}/);
 assert.match(confirmConvertRoute, /p_filename: `peppolpro-\$\{invoiceData\.invoiceNumber\}\.xml`/);
});

test('PDF storage failure keeps generated UBL conversion done and logs storage failure', () => {
 assert.doesNotMatch(convertRoute, /const \{ error: uploadError \} = await supabase\.storage/);
 assert.doesNotMatch(convertRoute, /action: "convert_pdf_storage_failed"/);
 assert.match(convertRoute, /action: "convert_draft_created"/);
 assert.match(confirmConvertRoute, /admin\.rpc\("confirm_conversion_draft"/);
 assert.match(migration0029, /insert into public\.conversions/);
 assert.match(migration0029, /'done'/);
});
