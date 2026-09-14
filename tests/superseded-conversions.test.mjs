import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSuperseded, supersededDetail, SUPERSEDED_STATUS } from '../lib/superseded.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

const dashboardPage = read('app/dashboard/page.tsx');
const dashboardClient = read('app/dashboard/DashboardClient.tsx');
const sendRoute = read('app/api/recommand/send/route.ts');
const migration = read('supabase/migrations/0035_conversion_supersede.sql');

test('een rij met een verwijzing naar de leidende versie is achterhaald', () => {
  assert.equal(isSuperseded({ superseded_by_conversion_id: 'abc' }), true);
  assert.equal(isSuperseded({ superseded_by_conversion_id: null }), false);
  assert.equal(isSuperseded({}), false);
  assert.equal(isSuperseded(null), false);
});

test('de uitleg verkiest de reden, dan de verwijzing, dan een standaardtekst', () => {
  assert.equal(
    supersededDetail({ superseded_reason: 'Achterhaald door factuur 14046.', superseded_by_label: 'factuur 14046' }),
    'Achterhaald door factuur 14046.',
  );
  assert.equal(supersededDetail({ superseded_by_label: 'creditnota CF-1' }), 'Achterhaald door creditnota CF-1.');
  assert.match(supersededDetail({}), /achterhaald/i);
});

test('de server stuurt het achterhaalde bestand niet mee naar de browser', () => {
  const start = dashboardPage.indexOf('const conversions = (conversionsData || []).map');
  assert.ok(start > -1, 'superseded-mapping ontbreekt in de dashboardpagina');
  const block = dashboardPage.slice(start, dashboardPage.indexOf('return (', start));
  assert.match(block, /if \(!isSuperseded\(row\)\) return row as Conversion;/);
  assert.match(block, /ubl_xml: null/, 'het achterhaalde UBL-bestand moet uit de payload blijven');
});

test('de dashboardpagina haalt de verwijzing en de kolommen op', () => {
  assert.match(dashboardPage, /superseded_by_conversion_id, superseded_at, superseded_reason/);
  assert.match(dashboardPage, /superseded_by_label/);
});

test('de send-route leest de kolom en blokkeert achterhaald vóór elke creditering', () => {
  assert.match(sendRoute, /superseded_by_conversion_id/);
  const guardIndex = sendRoute.indexOf('isSuperseded(existing)');
  const reservationIndex = sendRoute.indexOf('await reserveSendCredit(');
  assert.ok(guardIndex > -1, 'grendel op achterhaalde conversies ontbreekt');
  assert.ok(reservationIndex > -1, 'creditering niet gevonden');
  assert.ok(guardIndex < reservationIndex, 'de grendel moet vóór de creditering staan');
});

test('de klant ziet een achterhaalde rij als achterhaald en kan niet downloaden of verzenden', () => {
  assert.match(dashboardClient, new RegExp(`${SUPERSEDED_STATUS}: \\{ label: "Achterhaald"`));
  assert.match(dashboardClient, /isSuperseded\(conversion\)\) return false;/);
  assert.ok(dashboardClient.includes('isSuperseded(conversion) ? <span className="action-muted">{SUPERSEDED_DOWNLOAD_LABEL}</span>'))
  assert.ok(dashboardClient.includes('SUPERSEDED_SEND_BLOCKED_MESSAGE'));
  assert.match(dashboardClient, /const archivedStatuses = \["duplicate_voided", "superseded"\];/);
});

test('de bevestigingsroute geeft een achterhaald bestand niet terug', () => {
  const confirmRoute = read('app/api/convert/confirm/route.ts');
  assert.match(confirmRoute, /select\("ubl_xml, total_amount, currency, superseded_by_conversion_id"\)/);
  assert.ok(confirmRoute.includes('SUPERSEDED_DOWNLOAD_BLOCKED_MESSAGE'));
});

test('de migratie voegt alleen kolommen en een index toe', () => {
  assert.match(migration, /add column if not exists superseded_by_conversion_id uuid/);
  assert.match(migration, /add column if not exists superseded_at timestamptz/);
  assert.match(migration, /add column if not exists superseded_reason text/);
  assert.match(migration, /create index if not exists conversions_superseded_by_idx/);
  assert.doesNotMatch(migration, /\bupdate\s+public\.conversions\b/i, 'geen datastap in de schemamigratie');
  assert.doesNotMatch(migration, /\bdelete\s+from\b/i, 'geen verwijderingen in de schemamigratie');
});
