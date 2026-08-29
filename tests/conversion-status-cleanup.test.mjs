import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const convertRoute = readFileSync(new URL('app/api/convert/route.ts', root), 'utf8');
const generateRoute = readFileSync(new URL('app/api/generate/route.ts', root), 'utf8');
const dashboard = readFileSync(new URL('app/dashboard/DashboardClient.tsx', root), 'utf8');
const adminClient = readFileSync(new URL('app/admin/AdminClient.tsx', root), 'utf8');
const retentionRoute = readFileSync(new URL('app/api/cron/retention-cleanup/route.ts', root), 'utf8');
const migration0028 = readFileSync(new URL('supabase/migrations/0028_normalize_conversion_status.sql', root), 'utf8');

test('conversion creation uses done as the only completed conversion status', () => {
 assert.match(convertRoute, /status: "done"/);
 assert.match(generateRoute, /status: "done"/);
 assert.match(migration0028, /set status = 'done'[\s\S]*where status = 'success'/i);
 assert.match(migration0028, /set status = 'done'[\s\S]*where status = 'failed'[\s\S]*nullif\(ubl_xml, ''\) is not null/i);
 assert.doesNotMatch(`${convertRoute}\n${dashboard}\n${adminClient}`, /"success"|'success'/);
});

test('dashboard and admin counters map generated conversions to done only', () => {
 assert.match(dashboard, /done: \{ label: "UBL gegenereerd"/);
 assert.doesNotMatch(dashboard, /success: \{ label:/);
 assert.match(dashboard, /const generatedStatuses = \["done"\]/);
 assert.match(dashboard, /conversion\.ubl_xml \? "done" : conversion\.status/);
 assert.match(adminClient, /const doneCount = conversions\.filter\(c => c\.status === "done"\)\.length/);
 assert.match(adminClient, /conv\.status === "done"/);
});

test('retention cleanup does not filter conversion PDFs by conversion status', () => {
 const conversionCleanupBlock = retentionRoute.match(/from\("conversions"\)[\s\S]*?storage\.from\("invoices"\)\.remove\(conversionPdfPaths\)/)?.[0] || '';
 assert.match(conversionCleanupBlock, /select\("id, user_id, created_at"\)/);
 assert.doesNotMatch(conversionCleanupBlock, /\.eq\("status"|\.in\("status"|status:\s*"done"|status:\s*"success"|status:\s*"failed"/);
});

test('PDF storage failure keeps generated UBL conversion done and logs storage failure', () => {
 assert.match(convertRoute, /const \{ error: uploadError \} = await supabase\.storage/);
 const uploadErrorBlock = convertRoute.match(/if \(uploadError\) \{[\s\S]*?\n \}/)?.[0] || '';
 assert.match(uploadErrorBlock, /action: "convert_pdf_storage_failed"/);
 assert.match(uploadErrorBlock, /conversion_id: conversion\.id/);
 assert.doesNotMatch(uploadErrorBlock, /releaseUblCredit|status: "failed"|return NextResponse\.json\(\{ error: "PDF kon niet worden opgeslagen"/);
 assert.match(convertRoute, /action: "convert_success"/);
});
