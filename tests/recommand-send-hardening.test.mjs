import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const route = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../app/dashboard/DashboardClient.tsx', import.meta.url), 'utf8');
const nieuwPage = readFileSync(new URL('../app/nieuw/page.tsx', import.meta.url), 'utf8');
const migration0025 = readFileSync(new URL('../supabase/migrations/0025_recommand_stale_send_claim.sql', import.meta.url), 'utf8');

test('Recommand send claim can reclaim stale sending rows but not fresh sending rows', () => {
  assert.match(route, /const RECOMMAND_SEND_STALE_AFTER_MINUTES = 10/);
  assert.match(route, /rpc\("claim_recommand_send_target"/);
  assert.match(route, /p_stale_after_minutes: RECOMMAND_SEND_STALE_AFTER_MINUTES/);
  assert.match(route, /recommand_claimed_at/);
  assert.match(route, /const CONVERSION_TARGET_SELECT/);
  assert.match(route, /const INVOICE_TARGET_SELECT/);
  assert.match(migration0025, /i\.total_incl as total_amount/);

  assert.match(migration0025, /add column if not exists recommand_claimed_at timestamptz/);
  assert.match(migration0025, /create or replace function public\.claim_recommand_send_target/);
  assert.match(migration0025, /p_stale_after_minutes integer default 10/);
  assert.match(migration0025, /for update/);
  assert.match(migration0025, /v_existing\.recommand_status = 'sending'[\s\S]*v_existing\.recommand_claimed_at, v_existing\.created_at, now\(\)\) > now\(\) - v_stale_after/);
  assert.match(migration0025, /return query select[\s\S]*false[\s\S]*'already_sending'/);
  assert.match(migration0025, /v_existing\.recommand_status = 'sending'[\s\S]*v_existing\.recommand_claimed_at, v_existing\.created_at, '-infinity'::timestamptz\) <= now\(\) - v_stale_after/);
  assert.match(migration0025, /v_claim_action := 'reclaimed'/);
  assert.match(migration0025, /return query select[\s\S]*true[\s\S]*v_claim_action/);
});

test('Recommand send route has explicit duration and bounded wait inside Vercel Hobby limit', () => {
  assert.match(route, /export const maxDuration = 60/);
  assert.match(route, /const PROCESSING_WAIT_ATTEMPTS = 20/);
  assert.match(route, /const PROCESSING_WAIT_MS = 1000/);
  assert.match(route, /function inProgressSendResponse/);
  assert.match(route, /Verzending loopt nog/);
  assert.match(route, /return inProgressSendResponse\(.*\)/);
});

test('Recommand send API response excludes raw provider data and full documents', () => {
  const responseBlock = route.match(/return NextResponse\.json\(\{ success: true[\s\S]*?\}\);/)?.[0] || '';
  assert.match(responseBlock, /success: true/);
  assert.match(responseBlock, /documentId: send\.documentId/);
  assert.match(responseBlock, /status: recommandStatus/);
  assert.match(responseBlock, /sentAt/);
  assert.match(responseBlock, /remainingCredits: reserved\.send_credits/);
  assert.doesNotMatch(responseBlock, /verify:/);
  assert.doesNotMatch(responseBlock, /verifyDocumentSupport:/);
  assert.doesNotMatch(responseBlock, /send: send\.raw/);
  assert.doesNotMatch(responseBlock, /documents: status/);

  for (const leaked of [
    /return jsonError\([^\n]+\{ verify: verify\.raw/,
    /return jsonError\([^\n]+verifyDocumentSupport: support\.raw/,
    /return jsonError\([^\n]+send: send\.raw/,
    /return jsonError\([^\n]+documents: status/,
  ]) {
    assert.doesNotMatch(route, leaked);
  }
});

test('UI only depends on sanitized send response fields', () => {
  const ui = `${dashboard}\n${nieuwPage}`;
  for (const field of ['verify', 'verifyDocumentSupport', 'send', 'documents']) {
    assert.doesNotMatch(ui, new RegExp(`body\\.${field}\\b`));
  }
  assert.match(ui, /body\.remainingCredits/);
  assert.match(ui, /body\.documentId/);
  assert.match(ui, /body\.status/);
  assert.match(ui, /body\.sentAt/);
  assert.match(dashboard, /body\.status === "sending"/);
});
