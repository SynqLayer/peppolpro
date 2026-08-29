import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const adminPage = readFileSync(new URL('../app/admin/page.tsx', import.meta.url), 'utf8');
const adminClient = readFileSync(new URL('../app/admin/AdminClient.tsx', import.meta.url), 'utf8');
const revealEmailRoute = readFileSync(new URL('../app/api/admin/reveal-email/route.ts', import.meta.url), 'utf8');
const middleware = readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8');
const migration0023 = readFileSync(new URL('../supabase/migrations/0023_harden_client_table_privileges.sql', import.meta.url), 'utf8');
const migration0027 = readFileSync(new URL('../supabase/migrations/0027_user_profiles_is_admin.sql', import.meta.url), 'utf8');

function updateGrantFor(sql, table) {
 const match = sql.match(new RegExp(`grant update \\(([^)]*)\\)\\s+on table public\\.${table} to authenticated`, 'i'));
 assert.ok(match, `missing column-specific UPDATE grant for ${table}`);
 return match[1].split(',').map((column) => column.trim());
}

test('admin panel no longer accepts a URL secret and requires logged-in is_admin profile', () => {
 assert.doesNotMatch(adminPage, /searchParams|ADMIN_SECRET|secret/i);
 assert.match(adminPage, /createServerSupabase\(\)/);
 assert.match(adminPage, /auth\.getUser\(\)/);
 assert.match(adminPage, /\.from\("user_profiles"\)[\s\S]*\.select\("is_admin"\)[\s\S]*\.eq\("id", user\.id\)/);
 assert.match(adminPage, /if \(!user\) \{[\s\S]*redirect\("\/dashboard"\)/);
 assert.match(adminPage, /if \(!profile\?\.is_admin\) \{[\s\S]*redirect\("\/dashboard"\)/);
 assert.match(middleware, /"\/admin"/);
});

test('admin data is minimized and full emails are revealed only by explicit admin action', () => {
 assert.doesNotMatch(adminPage, /\.select\("\*"\)/);
 assert.match(adminPage, /\.from\("contact_messages"\)[\s\S]*\.select\("id, name, email, message, status, created_at"\)/);
 assert.match(adminPage, /\.from\("payments"\)[\s\S]*\.select\("id, user_id, type, amount, credits, status, created_at"\)/);
 assert.match(adminPage, /\.from\("conversions"\)[\s\S]*\.select\("id, user_id, filename, status, invoice_number, total_amount, currency, created_at"\)/);
 assert.doesNotMatch(adminPage, /ubl_xml|customer_email|customer_name|btw|vat|raw/i);
 assert.match(adminPage, /masked_email: maskEmail\(email\)/);
 assert.doesNotMatch(adminClient, /user\.email|msg\.email/);
 assert.match(adminClient, /toon e-mail/);
 assert.match(adminClient, /\/api\/admin\/reveal-email/);
});

test('email reveal endpoint is admin-gated and only returns email after POST', () => {
 assert.match(revealEmailRoute, /auth\.getUser\(\)/);
 assert.match(revealEmailRoute, /\.select\("is_admin"\)/);
 assert.match(revealEmailRoute, /return profile\?\.is_admin === true \? user : null/);
 assert.match(revealEmailRoute, /status: 403/);
 assert.match(revealEmailRoute, /body\.target !== "user_profile" && body\.target !== "contact_message"/);
 assert.match(revealEmailRoute, /\.select\("email"\)/);
 assert.match(revealEmailRoute, /\.from\("scan_logs"\)\.insert\(\{/);
 assert.match(revealEmailRoute, /action: "admin_reveal_email"/);
 assert.match(revealEmailRoute, /target_id: body\.id/);
 assert.match(revealEmailRoute, /requested_at: new Date\(\)\.toISOString\(\)/);
});

test('is_admin migration defaults false, grants exclude it, and only Artur is set true', () => {
 assert.match(migration0027, /add column if not exists is_admin boolean not null default false/i);
 assert.match(migration0027, /revoke all on table public\.user_profiles from anon, authenticated/);
 assert.match(migration0027, /grant select on table public\.user_profiles to authenticated/);
 assert.deepEqual(updateGrantFor(migration0027, 'user_profiles'), [
  'company_name',
  'country',
  'kvk_kbo',
  'btw_nr',
  'address',
  'postal_code',
  'city',
  'onboarding_complete',
 ]);
 assert.doesNotMatch(updateGrantFor(migration0023, 'user_profiles').join(','), /is_admin/);
 assert.doesNotMatch(updateGrantFor(migration0027, 'user_profiles').join(','), /is_admin/);
 assert.match(migration0027, /set is_admin = false[\s\S]*where lower\(coalesce\(email, ''\)\) <> 'arthybagdas@gmail\.com'/i);
 assert.match(migration0027, /set is_admin = true[\s\S]*where lower\(email\) = 'arthybagdas@gmail\.com'/i);
});
