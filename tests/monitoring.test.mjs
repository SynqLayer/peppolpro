import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const plans = readFileSync(new URL('../lib/plans.ts', import.meta.url), 'utf8');
const migration0003 = readFileSync(new URL('../supabase/migrations/0003_monitoring_tier.sql', import.meta.url), 'utf8');
const migration0004 = readFileSync(new URL('../supabase/migrations/0004_monitoring_accountant_tier.sql', import.meta.url), 'utf8');
const targetsRoute = readFileSync(new URL('../app/api/monitoring/targets/route.ts', import.meta.url), 'utf8');
const bulkRoute = readFileSync(new URL('../app/api/monitoring/bulk-import/route.ts', import.meta.url), 'utf8');
const cronRoute = readFileSync(new URL('../app/api/cron/monitoring-check/route.ts', import.meta.url), 'utf8');
const migration0005 = readFileSync(new URL('../supabase/migrations/0005_monitoring_integrations_and_team.sql', import.meta.url), 'utf8');
const reportRoute = readFileSync(new URL('../app/api/monitoring/report/[targetId]/route.ts', import.meta.url), 'utf8');
const webhookRoute = readFileSync(new URL('../app/api/monitoring/webhook-config/route.ts', import.meta.url), 'utf8');
const workflow = readFileSync(new URL('../.github/workflows/monitoring-cron.yml', import.meta.url), 'utf8');
const migration0006 = readFileSync(new URL('../supabase/migrations/0006_retention_cleanup.sql', import.meta.url), 'utf8');
const cleanupRoute = readFileSync(new URL('../app/api/cron/retention-cleanup/route.ts', import.meta.url), 'utf8');
const reportLib = readFileSync(new URL('../lib/monitoring-report-pdf.ts', import.meta.url), 'utf8');
const memberDeleteRoute = readFileSync(new URL('../app/api/account/members/[memberId]/route.ts', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../app/dashboard/DashboardClient.tsx', import.meta.url), 'utf8');
const privacyPage = readFileSync(new URL('../app/privacy/page.tsx', import.meta.url), 'utf8');

test('monitoring tiers are configured with limits and frequencies', () => {
 assert.match(plans, /monitoring:\s*{[\s\S]*amount:\s*"9\.00"/);
 assert.match(plans, /monitoring:\s*{[\s\S]*maxTargets:\s*10/);
 assert.match(plans, /monitoring:\s*{[\s\S]*checkFrequency:\s*"weekly"/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*amount:\s*"39\.00"/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*maxTargets:\s*null/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*checkFrequency:\s*"daily"/);
});

test('monitoring events are read-only for authenticated users in RLS migration', () => {
 assert.match(migration0003, /create policy "read own monitoring events"/);
 assert.match(migration0003, /on public\.monitoring_events for select/);
 assert.doesNotMatch(migration0003, /on public\.monitoring_events for insert/);
 assert.doesNotMatch(migration0003, /on public\.monitoring_events for update/);
 assert.doesNotMatch(migration0003, /on public\.monitoring_events for delete/);
});

test('migration 0004 adds accountant tier without database target limit', () => {
 assert.match(migration0004, /monitoring_accountant/);
 assert.doesNotMatch(migration0004, /maxTargets|limit|count\(/i);
});

test('target API enforces monitoring limit while accountant bulk import is gated', () => {
 assert.match(targetsRoute, /plan\.maxTargets/);
 assert.match(targetsRoute, /Upgrade naar Monitoring Accountant/);
 assert.match(bulkRoute, /isMonitoringAccountantPlan/);
 assert.match(bulkRoute, /identifier_type, identifier_value,label/);
});

test('cron monitoring check respects frequency and writes events', () => {
 assert.match(cronRoute, /shouldCheck\(target\.last_checked_at, plan\.checkFrequency\)/);
 assert.match(cronRoute, /from\("monitoring_events"\)\.insert/);
 assert.match(cronRoute, /directory\.peppol\.eu\/search\/1\.0\/json/);
});

test('GitHub Actions workflow triggers monitoring cron hourly with CRON_SECRET', () => {
 assert.match(workflow, /cron:\s*"0 \* \* \* \*"/);
 assert.match(workflow, /https:\/\/peppolpro\.nl\/api\/cron\/monitoring-check/);
 assert.match(workflow, /secrets\.CRON_SECRET/);
});

test('monitoring report route is PDF gated by monitoring plan', () => {
 assert.match(reportRoute, /generateMonitoringReportPdf/);
 assert.match(reportRoute, /Content-Type": "application\/pdf"/);
 assert.match(reportRoute, /isMonitoringPlan/);
});

test('webhook and team migration creates secure integration tables and shared target RLS', () => {
 assert.match(migration0005, /create table if not exists public\.api_keys/);
 assert.match(migration0005, /key_hash text not null/);
 assert.match(migration0005, /create table if not exists public\.monitoring_webhook_configs/);
 assert.match(migration0005, /create table if not exists public\.account_members/);
 assert.match(migration0005, /owner or member monitoring targets select/);
 assert.match(migration0005, /owner or member monitoring events select/);
 assert.doesNotMatch(migration0005, /key text not null/i);
});

test('webhook config route validates https webhook URLs', () => {
 assert.match(webhookRoute, /normalizeWebhookUrl/);
 assert.match(webhookRoute, /monitoring_webhook_configs/);
});

test('retention cleanup deletes old monitoring events and expires pending invites without retaining email PII', () => {
 assert.match(migration0006, /monitoring-events.*12 months|12 maanden|Monitoring event history is retained for 12 months/is);
 assert.match(migration0006, /alter table public\.account_members[\s\S]*status text/);
 assert.match(migration0006, /alter table public\.account_members[\s\S]*invite_email drop not null/);
 assert.match(cleanupRoute, /from\("monitoring_events"\)[\s\S]*\.delete\(\{ count: "exact" \}\)[\s\S]*\.lt\("created_at", eventCutoff\)/);
 assert.match(cleanupRoute, /from\("account_members"\)[\s\S]*status: "expired", invite_email: null/);
 assert.match(cleanupRoute, /Bearer \$\{secret\}/);
});

test('workflow runs monitoring hourly and retention cleanup as a separate daily step', () => {
 assert.match(workflow, /cron:\s*"0 \* \* \* \*"/);
 assert.match(workflow, /api\/cron\/monitoring-check/);
 assert.match(workflow, /Daily retention cleanup/);
 assert.match(workflow, /api\/cron\/retention-cleanup/);
 assert.match(workflow, /date -u \+%H/);
 assert.match(workflow, /secrets\.CRON_SECRET/);
});

test('PDF report is generated as a response only without server-side storage or cache', () => {
 const combined = `${reportRoute}\n${reportLib}`;
 assert.match(reportRoute, /new NextResponse\(pdf/);
 assert.match(reportRoute, /"Cache-Control": "no-store"/);
 assert.doesNotMatch(combined, /writeFile|createWriteStream|\.from\("storage"\)|supabase\.storage|revalidate|unstable_cache|cacheTag/);
});

test('webhook UI requires active disclaimer confirmation before saving', () => {
 assert.match(dashboard, /U bent zelf verantwoordelijk voor de beveiliging van dit eindpunt/);
 assert.match(dashboard, /webhookDisclaimerAccepted/);
 assert.match(dashboard, /disabled=\{!webhookDisclaimerAccepted\}/);
 assert.match(dashboard, /disclaimer_accepted: webhookDisclaimerAccepted/);
 assert.match(webhookRoute, /disclaimer_accepted/);
 assert.match(webhookRoute, /Bevestig eerst de webhook-disclaimer/);
});

test('team member delete route removes membership and RLS access depends on accepted row presence', () => {
 assert.match(memberDeleteRoute, /export async function DELETE/);
 assert.match(memberDeleteRoute, /isOwner/);
 assert.match(memberDeleteRoute, /isSelf/);
 assert.match(memberDeleteRoute, /from\("account_members"\)[\s\S]*\.delete\(\)/);
 assert.match(memberDeleteRoute, /accessRevoked: true/);
 assert.match(migration0006, /am\.status = 'accepted'/);
 assert.match(migration0006, /exists \([\s\S]*from public\.account_members am[\s\S]*am\.member_user_id = auth\.uid\(\)/);
});

test('privacy page documents monitoring retention, team invite expiry and webhook forwarding', () => {
 assert.match(privacyPage, /Monitoring-events.*maximaal 12 maanden/);
 assert.match(privacyPage, /Team-uitnodigingen.*maximaal 30 dagen/);
 assert.match(privacyPage, /webhook-URL instelt[\s\S]*op jouw verzoek/);
});
