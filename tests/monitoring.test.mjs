import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const plans = readFileSync(new URL('../lib/plans.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/0003_monitoring_tier.sql', import.meta.url), 'utf8');

test('monitoring plan is configured as a paid checkout plan', () => {
  assert.match(plans, /monitoring:\s*{/);
  assert.match(plans, /id:\s*"monitoring"/);
  assert.match(plans, /amount:\s*"19\.00"/);
  assert.match(plans, /checkoutDescription:\s*"PeppolPro Monitoring €19\/mnd"/);
  assert.match(plans, /paid:\s*true/);
});

test('monitoring events are read-only for authenticated users in RLS migration', () => {
  assert.match(migration, /create policy "read own monitoring events"/);
  assert.match(migration, /on public\.monitoring_events for select/);
  assert.doesNotMatch(migration, /on public\.monitoring_events for insert/);
  assert.doesNotMatch(migration, /on public\.monitoring_events for update/);
  assert.doesNotMatch(migration, /on public\.monitoring_events for delete/);
});
