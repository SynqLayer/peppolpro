import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const site = readFileSync(new URL('../lib/monitor/site.ts', import.meta.url), 'utf8');
const checkTool = readFileSync(new URL('../app/monitor/_components/CheckTool.tsx', import.meta.url), 'utf8');
const cta = readFileSync(new URL('../app/monitor/_components/Page.tsx', import.meta.url), 'utf8');
const lookupRoute = readFileSync(new URL('../app/api/monitor-lookup/route.ts', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../app/robots.ts', import.meta.url), 'utf8');
const monitorPage = readFileSync(new URL('../app/monitor/page.tsx', import.meta.url), 'utf8');
const faqPage = readFileSync(new URL('../app/monitor/veelgestelde-vragen/page.tsx', import.meta.url), 'utf8');

const rootPage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pricingPage = readFileSync(new URL('../app/prijzen/page.tsx', import.meta.url), 'utf8');
const peppolSendPage = readFileSync(new URL('../app/peppol-factuur-versturen/page.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const constants = readFileSync(new URL('../lib/constants.ts', import.meta.url), 'utf8');
const plans = readFileSync(new URL('../lib/plans.ts', import.meta.url), 'utf8');
const brevo = readFileSync(new URL('../lib/brevo.ts', import.meta.url), 'utf8');
const nieuwPage = readFileSync(new URL('../app/nieuw/page.tsx', import.meta.url), 'utf8');
const privacyPage = readFileSync(new URL('../app/privacy/page.tsx', import.meta.url), 'utf8');
const voorwaardenPage = readFileSync(new URL('../app/voorwaarden/page.tsx', import.meta.url), 'utf8');

const existingNestedPages = [
  '../app/monitor/hoe-het-werkt/page.tsx',
  '../app/monitor/veelgestelde-vragen/page.tsx',
  '../app/monitor/over-ons/page.tsx',
  '../app/monitor/privacyverklaring/page.tsx',
  '../app/monitor/ben-ik-verplicht-te-e-factureren/page.tsx',
  '../app/monitor/peppol-id-opzoeken/page.tsx',
  '../app/monitor/wat-is-peppol/page.tsx',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

const commercialIntentRoutes = [
  'peppol-verplicht-boekhouder',
  'peppol-verplicht-webshop',
  'peppol-verplicht-zzp',
  'peppol-niet-aangesloten-wat-nu',
  'klanten-controleren-op-peppol',
];

const commercialPages = commercialIntentRoutes.map((slug) => ({
  slug,
  source: readFileSync(new URL(`../app/monitor/${slug}/page.tsx`, import.meta.url), 'utf8'),
}));

test('free Peppol monitor content lives under /monitor canonicals', () => {
  assert.match(site, /"\/monitor"/);
  assert.match(site, /"\/monitor\/wat-is-peppol"/);
  assert.match(site, /"\/monitor\/peppol-id-opzoeken"/);
  assert.match(site, /https:\/\/peppolpro\.nl/);
  assert.doesNotMatch(`${monitorPage}\n${existingNestedPages.join('\n')}`, /path: "\/(hoe-het-werkt|veelgestelde-vragen|over-ons|privacyverklaring|ben-ik-verplicht-te-e-factureren|peppol-id-opzoeken|wat-is-peppol)"/);
});

test('lookup API is moved to monitor-lookup and old lookup endpoint is not referenced by UI', () => {
  assert.match(checkTool, /\/api\/monitor-lookup/);
  assert.match(lookupRoute, /fetchDirectoryLookup/);
  assert.doesNotMatch(checkTool, /\/api\/lookup/);
});

test('monitor CTAs use PeppolPro upgrade auth flow', () => {
  assert.match(cta, /Monitoring instellen/);
  assert.match(cta, /Accountant-upgrade bekijken/);
  assert.match(cta, /\/register\?redirect=\/upgrade/);
  assert.match(cta, /\/login\?redirect=\/upgrade/);
  assert.doesNotMatch(cta, /https:\/\/peppolpro\.nl/);
});

test('root sitemap and robots expose monitor routes via monitor route config', () => {
  assert.match(sitemap, /monitorRoutes/);
  assert.match(sitemap, /"\/peppol-factuur-versturen"/);
  assert.match(site, /"\/monitor\/privacyverklaring"/);
  assert.match(site, /"\/monitor\/klanten-controleren-op-peppol"/);
  assert.match(robots, /sitemap\.xml/);
});

test('commercial-intent monitor pages exist with unique metadata and audience-aware CTAs', () => {
  for (const slug of commercialIntentRoutes) {
    assert.equal(existsSync(new URL(`../app/monitor/${slug}/page.tsx`, import.meta.url)), true, `${slug} missing`);
    assert.match(site, new RegExp(`"/monitor/${slug}"`));
  }

  const titles = new Set(commercialPages.map(({ source }) => source.match(/title: "([^"]+)"/)?.[1]));
  const descriptions = new Set(commercialPages.map(({ source }) => source.match(/description: "([^"]+)"/)?.[1]));
  assert.equal(titles.size, commercialIntentRoutes.length);
  assert.equal(descriptions.size, commercialIntentRoutes.length);

  assert.match(commercialPages.find((page) => page.slug === 'klanten-controleren-op-peppol').source, /audience="accountant"/);
  assert.match(commercialPages.find((page) => page.slug === 'peppol-verplicht-boekhouder').source, /audience="accountant"/);
  assert.match(commercialPages.find((page) => page.slug === 'peppol-verplicht-webshop').source, /B2B-webshops/);
  assert.match(commercialPages.find((page) => page.slug === 'peppol-verplicht-zzp').source, /paniekverkoop/);
  assert.match(commercialPages.find((page) => page.slug === 'peppol-niet-aangesloten-wat-nu').source, /momentopname/);
});

test('existing monitor pages have related internal links to commercial-intent pages', () => {
  const existing = `${monitorPage}\n${existingNestedPages.join('\n')}\n${cta}`;
  assert.match(existing, /Gerelateerd/);
  assert.match(existing, /\/monitor\/peppol-verplicht-zzp/);
  assert.match(existing, /\/monitor\/peppol-niet-aangesloten-wat-nu/);
  assert.match(existing, /\/monitor\/klanten-controleren-op-peppol/);
});

test('FAQ page includes FAQPage structured data for rich snippets', () => {
  assert.match(faqPage, /"@type": "FAQPage"/);
  assert.match(faqPage, /"@type": "Question"/);
  assert.match(faqPage, /acceptedAnswer/);
  assert.match(faqPage, /application\/ld\+json/);
  assert.match(faqPage, /JSON\.stringify\(faqJsonLd\)/);
});

test('commercial Peppol copy is honest while direct sending is unavailable', () => {
  const combined = `${rootPage}\n${pricingPage}\n${peppolSendPage}\n${layout}\n${constants}\n${plans}\n${brevo}\n${nieuwPage}`;
  assert.match(combined, /Direct verzenden via Peppol is (nog niet|binnenkort) beschikbaar|Direct verzenden via Peppol is nog niet beschikbaar/);
  assert.match(nieuwPage, /Download de UBL en verstuur via je eigen access point/);
  assert.match(nieuwPage, /Verzenden via Peppol binnenkort/);
  assert.doesNotMatch(combined, /verzend direct via Peppol|Verzenden én ontvangen via Peppol|Bulk verzenden|Klant ontvangt direct|3 Peppol-verzendingen/);
});

test('legal pages describe starter credits and subprocessors consistently', () => {
  assert.match(voorwaardenPage, /Gratis accounts ontvangen eenmalig 3 credits bij registratie/);
  assert.doesNotMatch(voorwaardenPage, /3 credits per maand|3 gratis UBL-generaties bij registratie/);
  assert.match(privacyPage, /Brevo \(transactionele e-mail, verwerkt naam en e-mailadres\)/);
  assert.match(privacyPage, /Conversions en invoices, waaronder UBL, bedragen, klantgegevens en het e-mailadres van de ontvanger, bewaren wij zolang je account actief is, tenzij je een factuur zelf verwijdert\./);
});
