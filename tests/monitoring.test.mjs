import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const plans = readFileSync(new URL('../lib/plans.ts', import.meta.url), 'utf8');
const migration0003 = readFileSync(new URL('../supabase/migrations/0003_monitoring_tier.sql', import.meta.url), 'utf8');
const migration0004 = readFileSync(new URL('../supabase/migrations/0004_monitoring_accountant_tier.sql', import.meta.url), 'utf8');
const targetsRoute = readFileSync(new URL('../app/api/monitoring/targets/route.ts', import.meta.url), 'utf8');
const bulkRoute = readFileSync(new URL('../app/api/monitoring/bulk-import/route.ts', import.meta.url), 'utf8');
const cronRoute = readFileSync(new URL('../app/api/cron/monitoring-check/route.ts', import.meta.url), 'utf8');

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
