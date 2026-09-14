#!/usr/bin/env node
/**
 * Migratiedrift-controle.
 *
 * Vergelijkt de migratiebestanden in supabase/migrations met de versies die in
 * supabase_migrations.schema_migrations op productie geregistreerd staan.
 *
 * Twee bronnen voor de productiehistorie:
 *   1. SUPABASE_ACCESS_TOKEN in de omgeving -> live uitlezen via de Management API.
 *   2. Anders: supabase/migration-history.json, een manifest dat met de hand wordt bijgewerkt
 *      na elke toegepaste migratie.
 *
 * Faalt (exit 1) bij drift in beide richtingen:
 *   - een versie die op productie staat maar geen bestand in de repo heeft (db push weigert hierop)
 *   - een bestand in de repo dat niet als toegepast geregistreerd staat
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const MANIFEST = join(ROOT, 'supabase', 'migration-history.json');
const PROJECT_REF = 'nqnznblztvbhwzcmdqga';

const local = new Map();
for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort()) {
  local.set(file.split('_')[0], file);
}

async function remoteFromApi(token) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'select version, name from supabase_migrations.schema_migrations order by version' }),
  });
  if (!response.ok) throw new Error(`Management API gaf ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Onverwacht antwoord van de Management API');
  return new Map(rows.map((row) => [row.version, row.name]));
}

function remoteFromManifest() {
  const parsed = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : parsed.versions;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('Manifest is leeg of onleesbaar');
  return new Map(rows.map((row) => [row.version, row.name]));
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
let remote;
let source;
if (token) {
  remote = await remoteFromApi(token);
  source = 'management-api (live)';
} else {
  remote = remoteFromManifest();
  source = 'supabase/migration-history.json';
}

const remoteOnly = [...remote.keys()].filter((version) => !local.has(version));
const localOnly = [...local.keys()].filter((version) => !remote.has(version));

console.log(`Migratiedrift-controle — bron productiehistorie: ${source}`);
console.log(`  bestanden in de repo: ${local.size}`);
console.log(`  geregistreerd op productie: ${remote.size}`);

if (remoteOnly.length === 0 && localOnly.length === 0) {
  console.log('  resultaat: geen drift');
  process.exit(0);
}

console.error('  resultaat: DRIFT GEVONDEN');
if (remoteOnly.length > 0) {
  console.error(`  op productie zonder repo-bestand (${remoteOnly.length}):`);
  for (const version of remoteOnly) console.error(`    ${version}  ${remote.get(version)}`);
  console.error('  -> voeg een spiegelbestand toe of repareer de historie; db push weigert anders.');
}
if (localOnly.length > 0) {
  console.error(`  in de repo zonder registratie op productie (${localOnly.length}):`);
  for (const version of localOnly) console.error(`    ${version}  ${local.get(version)}`);
  console.error('  -> nog niet toegepast, of de registratie ontbreekt (migration repair).');
}
process.exit(1);
