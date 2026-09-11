import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/0032_red_goodwill_send_credits.sql', import.meta.url), 'utf8');

test('goodwill RPC hardcodes the exact one-time amount and reason', () => {
 assert.match(migration, /create or replace function public\.grant_red_goodwill_send_credits\(p_user_id uuid\)/);
 assert.match(migration, /v_reason constant text := 'goodwill_loyalty_20260911'/);
 assert.match(migration, /v_amount constant integer := 3/);
 assert.match(migration, /set send_credits = up\.send_credits \+ v_amount/);
 assert.doesNotMatch(migration, /credits = credits \+/);
 assert.doesNotMatch(migration, /send_credits_expires_at\s*=/);
});

test('goodwill RPC is wallet-isolated to the passed account only', () => {
 const body = migration.match(/create or replace function public\.grant_red_goodwill_send_credits[\s\S]*?\n\$\$;/)?.[0] || '';
 assert.match(body, /where sl\.user_id = p_user_id and sl\.action = v_reason/);
 assert.match(body, /update public\.user_profiles up/);
 assert.match(body, /where up\.id = p_user_id/);
 assert.doesNotMatch(body, /update public\.user_profiles\s+set send_credits = send_credits \+ v_amount;/);
});

test('goodwill RPC is guarded to service_role and revoked from every other role', () => {
 assert.match(migration, /if coalesce\(auth\.role\(\), ''\) <> 'service_role' then/);
 assert.match(migration, /raise exception 'service_role required to grant red goodwill send credits' using errcode = '42501'/);
 assert.match(migration, /revoke all on function public\.grant_red_goodwill_send_credits\(uuid\) from public, anon, authenticated, hermes_operator/);
 assert.match(migration, /grant execute on function public\.grant_red_goodwill_send_credits\(uuid\) to service_role/);
 assert.doesNotMatch(migration, /grant execute on function public\.grant_red_goodwill_send_credits\(uuid\) to (public|anon|authenticated|hermes_operator)/);
});

test('goodwill RPC takes a transaction-scoped per-account/reason advisory lock before the idempotency check', () => {
 const body = migration.match(/create or replace function public\.grant_red_goodwill_send_credits[\s\S]*?\n\$\$;/)?.[0] || '';
 const lockIndex = body.indexOf('pg_advisory_xact_lock');
 const lookupIndex = body.indexOf('from public.scan_logs');
 assert.match(body, /perform pg_advisory_xact_lock\(hashtextextended\(p_user_id::text \|\| ':' \|\| v_reason, 0\)\)/);
 assert.ok(lockIndex > -1 && lookupIndex > -1 && lockIndex < lookupIndex, 'advisory lock must be acquired before the scan_logs idempotency lookup');
});

test('goodwill RPC checks scan_logs for an existing audit row and skips the credit grant on retry', () => {
 const body = migration.match(/create or replace function public\.grant_red_goodwill_send_credits[\s\S]*?\n\$\$;/)?.[0] || '';
 assert.match(body, /select sl\.id into v_ledger_id\s+from public\.scan_logs sl/);
 assert.match(body, /if v_ledger_id is null then[\s\S]*insert into public\.scan_logs\(user_id, action, meta\)[\s\S]*set send_credits = up\.send_credits \+ v_amount[\s\S]*v_applied := true;\s*end if;/);
 assert.match(body, /returning id into v_ledger_id/);
 assert.match(body, /if not found then raise exception 'profile_not_found'/);
});

test('goodwill RPC returns ledger id, applied flag, credits, send credits and expiry', () => {
 assert.match(migration, /returns table\(\s*ledger_id uuid,\s*applied boolean,\s*credits integer,\s*send_credits integer,\s*send_credits_expires_at timestamptz\s*\)/);
 assert.match(migration, /select v_ledger_id, v_applied, up\.credits, up\.send_credits, up\.send_credits_expires_at/);
});
