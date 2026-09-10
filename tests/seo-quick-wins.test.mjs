import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const pricing = read('../app/prijzen/page.tsx');
const homepage = read('../app/page.tsx');
const sitemap = read('../app/sitemap.ts');
const monitor = read('../app/monitor/page.tsx');
const about = read('../app/monitor/over-ons/page.tsx');
const customers = read('../app/monitor/klanten-controleren-op-peppol/page.tsx');
const notConnected = read('../app/monitor/peppol-niet-aangesloten-wat-nu/page.tsx');
const idLookup = read('../app/monitor/peppol-id-opzoeken/page.tsx');
const checkTool = read('../app/monitor/_components/CheckTool.tsx');
const lookupApi = read('../app/api/monitor-lookup/route.ts');

function count(source, fragment) {
  return source.split(fragment).length - 1;
}

test('/prijzen owns Peppol cost and pricing intent', () => {
  assert.match(pricing, /import type \{ Metadata \} from "next"/);
  assert.match(pricing, /title: "Peppol prijzen en kosten"/);
  assert.match(pricing, /description: "Bekijk de actuele PeppolPro-prijzen/);
  assert.match(pricing, /alternates:\s*\{ canonical: "\/prijzen" \}/);
  assert.match(sitemap, /"\/prijzen"/);
  assert.equal(count(homepage, 'href: "/prijzen"'), 1);
});

test('/monitor metadata owns Peppol checker intent without changing the page H1', () => {
  assert.match(monitor, /title: "Peppol checker \| Gratis Peppol ID opzoeken"/);
  assert.match(monitor, /description: "Gebruik de gratis Peppol checker/);
  assert.match(monitor, /path: "\/monitor"/);
  assert.match(monitor, />Check of een NL-bedrijf vindbaar is op Peppol\.<\/h1>/);
});

test('/monitor related links strengthen both protected destination pages', () => {
  assert.equal(count(monitor, 'href: "/monitor/klanten-controleren-op-peppol"'), 1);
  assert.equal(count(monitor, 'href: "/monitor/peppol-niet-aangesloten-wat-nu"'), 1);
  assert.match(customers, /title="Klanten controleren op Peppol"/);
  assert.match(customers, /Peppol-vindbaarheid is technische informatie/);
  assert.match(notConnected, /title="Niet aangesloten op Peppol: wat nu\?"/);
  assert.match(notConnected, /Een lookup is een momentopname/);
});

test('/monitor/over-ons has about intent and a contextual checker link', () => {
  assert.match(about, /title: "Over SynqLayer en PeppolPro Monitor"/);
  assert.match(about, /description: "Lees wie PeppolPro Monitor bouwt/);
  assert.match(about, /<Link href="\/monitor">Peppol checker<\/Link>/);
  assert.match(about, /title="Peppol-Check is een SynqLayer-tool"/);
});

test('Monitor functionality contract remains intact', () => {
  assert.match(checkTool, /<form onSubmit=\{onSubmit\}/);
  assert.match(checkTool, /onChange=\{\(event\) => setQuery\(event\.target\.value\)\}/);
  assert.match(checkTool, /fetch\(`\/api\/monitor-lookup\?q=\$\{encodeURIComponent\(query\)\}`/);
  assert.match(checkTool, /result\.peppolIds\.map/);
  assert.match(checkTool, /result\.supportedDocumentTypes\.slice\(0, 8\)\.map/);
  assert.match(lookupApi, /fetchDirectoryLookup/);
  assert.match(idLookup, /path: "\/monitor\/peppol-id-opzoeken"/);
});
