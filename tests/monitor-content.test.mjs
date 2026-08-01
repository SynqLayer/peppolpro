import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const site = readFileSync(new URL('../lib/monitor/site.ts', import.meta.url), 'utf8');
const checkTool = readFileSync(new URL('../app/monitor/_components/CheckTool.tsx', import.meta.url), 'utf8');
const cta = readFileSync(new URL('../app/monitor/_components/Page.tsx', import.meta.url), 'utf8');
const lookupRoute = readFileSync(new URL('../app/api/monitor-lookup/route.ts', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../app/robots.ts', import.meta.url), 'utf8');
const monitorPage = readFileSync(new URL('../app/monitor/page.tsx', import.meta.url), 'utf8');
const nestedPages = [
  '../app/monitor/hoe-het-werkt/page.tsx',
  '../app/monitor/veelgestelde-vragen/page.tsx',
  '../app/monitor/over-ons/page.tsx',
  '../app/monitor/privacyverklaring/page.tsx',
  '../app/monitor/ben-ik-verplicht-te-e-factureren/page.tsx',
  '../app/monitor/peppol-id-opzoeken/page.tsx',
  '../app/monitor/wat-is-peppol/page.tsx',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

test('free Peppol monitor content lives under /monitor canonicals', () => {
  assert.match(site, /"\/monitor"/);
  assert.match(site, /"\/monitor\/wat-is-peppol"/);
  assert.match(site, /"\/monitor\/peppol-id-opzoeken"/);
  assert.match(site, /https:\/\/peppolpro\.nl/);
  assert.doesNotMatch(`${monitorPage}\n${nestedPages.join('\n')}`, /path: "\/(hoe-het-werkt|veelgestelde-vragen|over-ons|privacyverklaring|ben-ik-verplicht-te-e-factureren|peppol-id-opzoeken|wat-is-peppol)"/);
});

test('lookup API is moved to monitor-lookup and old lookup endpoint is not referenced by UI', () => {
  assert.match(checkTool, /\/api\/monitor-lookup/);
  assert.match(lookupRoute, /fetchDirectoryLookup/);
  assert.doesNotMatch(checkTool, /\/api\/lookup/);
});

test('monitor CTAs use PeppolPro upgrade auth flow', () => {
  assert.match(cta, /Monitoring instellen/);
  assert.match(cta, /\/register\?redirect=\/upgrade/);
  assert.match(cta, /\/login\?redirect=\/upgrade/);
  assert.doesNotMatch(cta, /https:\/\/peppolpro\.nl/);
});

test('root sitemap and robots expose monitor routes without separate monitor sitemap', () => {
  assert.match(sitemap, /monitorRoutes/);
  assert.match(sitemap, /"\/peppol-factuur-versturen"/);
  assert.match(site, /"\/monitor\/privacyverklaring"/);
  assert.match(robots, /sitemap\.xml/);
});
