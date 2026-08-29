import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const migration = readFileSync(new URL('../supabase/migrations/0023_harden_client_table_privileges.sql', import.meta.url), 'utf8');
const migration0024 = readFileSync(new URL('../supabase/migrations/0024_account_members_service_role_writes.sql', import.meta.url), 'utf8');
const generateRoute = readFileSync(new URL('../app/api/generate/route.ts', import.meta.url), 'utf8');
const convertRoute = readFileSync(new URL('../app/api/convert/route.ts', import.meta.url), 'utf8');
const recommandSendRoute = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const apiKeysRoute = readFileSync(new URL('../app/api/monitoring/api-keys/route.ts', import.meta.url), 'utf8');
const targetsRoute = readFileSync(new URL('../app/api/monitoring/targets/route.ts', import.meta.url), 'utf8');
const webhookConfigRoute = readFileSync(new URL('../app/api/monitoring/webhook-config/route.ts', import.meta.url), 'utf8');
const bulkRoute = readFileSync(new URL('../app/api/monitoring/bulk-import/route.ts', import.meta.url), 'utf8');
const recommandCompanyRoute = readFileSync(new URL('../app/api/recommand/company/route.ts', import.meta.url), 'utf8');
const recommandCompanyStatusRoute = readFileSync(new URL('../app/api/recommand/company/status/route.ts', import.meta.url), 'utf8');

function updateGrantFor(table) {
 const match = migration.match(new RegExp(`grant update \\(([^)]*)\\)\\s+on table public\\.${table} to authenticated`, 'i'));
 assert.ok(match, `missing column-specific UPDATE grant for ${table}`);
 return match[1].split(',').map((column) => column.trim());
}

function insertGrantFor(table) {
 const match = migration.match(new RegExp(`grant insert \\(([^)]*)\\)\\s+on table public\\.${table} to authenticated`, 'i'));
 assert.ok(match, `missing column-specific INSERT grant for ${table}`);
 return match[1].split(',').map((column) => column.trim());
}

test('user_profiles grants only authenticated self-select and onboarding column updates', () => {
 assert.match(migration, /revoke all on table public\.user_profiles from anon, authenticated/);
 assert.match(migration, /grant select on table public\.user_profiles to authenticated/);
 assert.deepEqual(updateGrantFor('user_profiles'), [
  'company_name',
  'country',
  'kvk_kbo',
  'btw_nr',
  'address',
  'postal_code',
  'city',
  'onboarding_complete',
 ]);
 assert.doesNotMatch(migration, /grant insert[^;]+user_profiles to authenticated/i);
 assert.doesNotMatch(migration, /grant delete[^;]+user_profiles to authenticated/i);
 assert.doesNotMatch(updateGrantFor('user_profiles').join(','), /plan|credits|send_credits|send_credits_expires_at|recommand_verified|recommand_company_id|is_admin/);
});

test('clients, invoice lines, conversions and invoices are authenticated SELECT-only where readable and all route writes use service role', () => {
 for (const table of ['clients', 'invoice_lines', 'conversions', 'invoices']) {
  assert.match(migration, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`));
  assert.match(migration, new RegExp(`grant select on table public\\.${table} to authenticated`));
  assert.match(migration, new RegExp(`grant all on table public\\.${table} to service_role`));
  assert.doesNotMatch(migration, new RegExp(`grant (insert|update|delete)[^;]+public\\.${table} to authenticated`, 'i'));
 }
 assert.match(generateRoute, /const admin = createAdminSupabase\(\)/);
 assert.match(generateRoute, /admin\.from\("conversions"\)\.insert/);
 assert.match(convertRoute, /const admin = createAdminSupabase\(\)/);
 assert.match(convertRoute, /await admin\s*\n\s*\.from\("conversions"\)\s*\n\s*\.insert/);
 assert.doesNotMatch(convertRoute, /await supabase\s*\n\s*\.from\("conversions"\)\s*\n\s*\.(insert|update|delete)/);
 assert.match(recommandSendRoute, /const admin = createAdminSupabase\(\)/);
 assert.match(recommandSendRoute, /claimTargetForSending\(admin, targetTable, targetId, user\.id\)/);
 assert.doesNotMatch(recommandSendRoute, /await supabase\.from\(targetTable\)\.update/);
});

test('monitoring_targets protects system columns while target creation still uses default status', () => {
 assert.deepEqual(insertGrantFor('monitoring_targets'), ['user_id', 'identifier_type', 'identifier_value', 'label']);
 assert.deepEqual(updateGrantFor('monitoring_targets'), ['identifier_type', 'identifier_value', 'label']);
 assert.doesNotMatch(updateGrantFor('monitoring_targets').join(','), /status|last_checked_at|last_result/);
 assert.doesNotMatch(targetsRoute, /status:\s*"active"/);
 assert.doesNotMatch(bulkRoute, /status:\s*"active"/);
});

test('account_members invite creation and removal are service-role only while client accept is column-limited', () => {
 assert.match(migration0024, /revoke insert, delete on table public\.account_members from anon, authenticated/);
 assert.match(migration0024, /drop policy if exists "account owners insert members" on public\.account_members/);
 assert.match(migration0024, /drop policy if exists "account owners delete members" on public\.account_members/);
 assert.deepEqual(updateGrantFor('account_members').sort(), ['accepted_at', 'member_user_id', 'status']);
 assert.doesNotMatch(updateGrantFor('account_members').join(','), /account_owner_id|invite_email|role/);
 assert.match(migration, /create policy "invited user can accept membership"[\s\S]*member_user_id = auth\.uid\(\)[\s\S]*status = 'accepted'/);
});

test('api_keys and webhook configs have no authenticated write grants and API routes write through service role', () => {
 assert.match(migration, /revoke all on table public\.api_keys from anon, authenticated/);
 assert.match(migration, /grant select on table public\.api_keys to authenticated/);
 assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]+public\.api_keys to authenticated/i);
 assert.match(apiKeysRoute, /const admin = createAdminSupabase\(\)/);
 assert.match(apiKeysRoute, /await admin\s*\n\s*\.from\("api_keys"\)\s*\n\s*\.insert\(\{ user_id: user\.id, key_hash \}\)/);
 assert.match(apiKeysRoute, /export async function DELETE/);
 assert.match(apiKeysRoute, /await admin\s*\n\s*\.from\("api_keys"\)\s*\n\s*\.update\(\{ revoked_at: new Date\(\)\.toISOString\(\) \}\)/);
 assert.match(migration, /revoke all on table public\.monitoring_webhook_configs from anon, authenticated/);
 assert.match(migration, /grant select on table public\.monitoring_webhook_configs to authenticated/);
 assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]+public\.monitoring_webhook_configs to authenticated/i);
 assert.match(webhookConfigRoute, /createAdminSupabase/);
 assert.match(webhookConfigRoute, /await admin\s*\n\s*\.from\("monitoring_webhook_configs"\)\s*\n\s*\.upsert/);
 assert.match(webhookConfigRoute, /await admin\s*\n\s*\.from\("monitoring_webhook_configs"\)\s*\n\s*\.update/);
});


test('message and history tables cannot be forged by client roles', () => {
 assert.match(migration, /revoke all on table public\.scan_logs from anon, authenticated/);
 assert.match(migration, /grant select on table public\.scan_logs to authenticated/);
 assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]+public\.scan_logs to authenticated/i);
 assert.match(migration, /revoke all on table public\.monitoring_events from anon, authenticated/);
 assert.match(migration, /grant select on table public\.monitoring_events to authenticated/);
 assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]+public\.monitoring_events to authenticated/i);
 assert.match(migration, /revoke all on table public\.inbox_messages from anon, authenticated/);
 assert.match(migration, /grant update \(status\) on table public\.inbox_messages to authenticated/);
 assert.doesNotMatch(migration, /grant insert[^;]+public\.inbox_messages to authenticated/i);
 assert.match(migration, /revoke all on table public\.contact_messages from anon, authenticated/);
 assert.match(migration, /grant insert \(name, email, message\) on table public\.contact_messages to anon, authenticated/);
});

test('invoice_number_sequences remains closed to client roles', () => {
 assert.match(migration, /revoke all on table public\.invoice_number_sequences from anon, authenticated/);
 assert.doesNotMatch(migration, /grant (select|insert|update|delete)[^;]+public\.invoice_number_sequences to (anon|authenticated)/i);
 assert.match(migration, /grant all on table public\.invoice_number_sequences to service_role/);
});

test('privileged Recommand company profile writes use service role', () => {
 for (const route of [recommandCompanyRoute, recommandCompanyStatusRoute]) {
  assert.match(route, /createAdminSupabase/);
  assert.match(route, /await admin\.from\("user_profiles"\)\.update/);
  assert.doesNotMatch(route, /await supabase\.from\("user_profiles"\)\.update/);
 }
});
