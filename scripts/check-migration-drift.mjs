#!/usr/bin/env node
/**
 * Migratiedrift-controle.
 *
 * Vergelijkt de migratiebestanden in supabase/migrations met de versies die in
 * supabase_migrations.schema_migrations op productie geregistreerd staan. De productiehistorie
 * wordt LIVE gelezen via de Management API met SUPABASE_ACCESS_TOKEN; er is geen handmatig
 * manifest meer dat bijgehouden moet worden.
 *
 * Faalt (exit 1) bij drift in beide richtingen:
 *   - een versie die op productie staat maar geen bestand in de repo heeft (db push weigert hierop)
 *   - een bestand in de repo dat niet als toegepast geregistreerd staat
 * Zonder token faalt de controle met exit 2: dan is er niets vergeleken en mag er geen groen
 * vinkje ontstaan.
 */

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const PROJECT_REF = 'nqnznblztvbhwzcmdqga';

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Migratiedrift-controle: SUPABASE_ACCESS_TOKEN ontbreekt.');
  console.error('Deze controle vergelijkt live met de productiehistorie en kan niet zonder token.');
  console.error('Er is niets vergeleken; behandel deze run als onbeslist, niet als groen.');
  process.exit(2);
}

const local = new Map();
for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort()) {
  local.set(file.split('_')[0], file);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'select version, name from supabase_migrations.schema_migrations order by version' }),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Migratiedrift-controle: de Management API gaf HTTP ${response.status}.`);
  console.error(`Antwoord: ${body.slice(0, 400)}`);
  if (response.status === 401 || response.status === 403) {
    console.error('De token mist een recht voor deze controle. Vraag het recht aan dat de API hierboven noemt;');
    console.error('val niet terug op een bredere token.');
  }
  process.exit(2);
}

const rows = await response.json();
if (!Array.isArray(rows)) {
  console.error('Migratiedrift-controle: onverwacht antwoord van de Management API.');
  console.error(`Antwoord: ${JSON.stringify(rows).slice(0, 300)}`);
  process.exit(2);
}

const remote = new Map(rows.map((row) => [row.version, row.name]));
const remoteOnly = [...remote.keys()].filter((version) => !local.has(version));
const localOnly = [...local.keys()].filter((version) => !remote.has(version));

console.log('Migratiedrift-controle — productiehistorie live gelezen');
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
