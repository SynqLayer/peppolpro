import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/0033_general_goodwill_send_credits.sql', import.meta.url), 'utf8');
const body = migration.match(/create or replace function public\.grant_goodwill_send_credits[\s\S]*?\n\$\$;/)?.[0] || '';

test('0033 replaces the Red-specific RPC with the general goodwill RPC', () => {
 assert.match(migration, /create or replace function public\.grant_goodwill_send_credits\(\s*p_user_id uuid,\s*p_amount integer,\s*p_reason text/);
 assert.match(migration, /drop function if exists public\.grant_red_goodwill_send_credits\(uuid\)/);
 assert.doesNotMatch(migration, /create or replace function public\.grant_red_goodwill_send_credits/);
});

test('general goodwill amount is bounded to 1 through 10', () => {
 assert.match(body, /p_amount is null or p_amount < 1 or p_amount > 10/);
 assert.match(body, /amount must be between 1 and 10/);
});

test('general goodwill reason rejects all whitespace while preserving the exact stored reason', () => {
 assert.match(body, /p_reason is null or regexp_replace\(p_reason, '\[\[:space:\]\]', '', 'g'\) = '' or length\(p_reason\) > 200/);
 assert.match(body, /sl\.action = p_reason/);
 assert.match(body, /values \([\s\S]*p_user_id,[\s\S]*p_reason,/);
});

test('general goodwill is service-role only', () => {
 assert.match(body, /if coalesce\(auth\.role\(\), ''\) <> 'service_role' then/);
 assert.match(migration, /revoke all on function public\.grant_goodwill_send_credits\(uuid, integer, text\)\s+from public, anon, authenticated, hermes_operator/);
 assert.match(migration, /grant execute on function public\.grant_goodwill_send_credits\(uuid, integer, text\)\s+to service_role/);
});

test('general goodwill is transactionally idempotent on user and exact reason', () => {
 const lock = body.indexOf('pg_advisory_xact_lock');
 const lookup = body.indexOf('from public.scan_logs');
 assert.match(body, /hashtextextended\(p_user_id::text \|\| ':' \|\| p_reason, 0\)/);
 assert.ok(lock > -1 && lookup > lock);
 assert.match(body, /where sl\.user_id = p_user_id and sl\.action = p_reason/);
 assert.match(body, /if v_ledger_id is null then[\s\S]*insert into public\.scan_logs[\s\S]*update public\.user_profiles up[\s\S]*v_applied := true/);
});

test('general goodwill keeps the 0032 ledger shape', () => {
 assert.match(body, /jsonb_build_object\('send_credits_delta', p_amount, 'reason', p_reason\)/);
});

test('general goodwill changes only send credits and preserves UBL credits and expiry', () => {
 assert.match(body, /set send_credits = up\.send_credits \+ p_amount/);
 assert.doesNotMatch(body, /set[\s\S]{0,80}\bcredits\s*=/);
 assert.doesNotMatch(body, /send_credits_expires_at\s*=/);
 assert.match(body, /if not found then raise exception 'profile_not_found'/);
});
