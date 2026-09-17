import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

test('compliance routes exist and are discoverable', () => {
  for (const path of ['app/cookiebeleid/page.tsx', 'app/annuleren-terugbetaling/page.tsx', 'app/privacy/verwijderen/page.tsx']) {
    assert.equal(existsSync(join(root, path)), true, `${path} ontbreekt`);
  }
  const home = read('app/page.tsx');
  for (const href of ['/cookiebeleid', '/annuleren-terugbetaling', '/privacy/verwijderen', '/avg-gdpr']) {
    assert.match(home, new RegExp(href.replaceAll('/', '\\/')));
  }
  const sitemap = read('app/sitemap.ts');
  assert.match(sitemap, /"\/cookiebeleid"/);
  assert.match(sitemap, /"\/annuleren-terugbetaling"/);
});

test('geen externe Google Fonts of globale motion zonder reduced-motion guard', () => {
  const css = read('app/globals.css');
  assert.doesNotMatch(css, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
});

test('checkout start nooit direct vanaf prijskaart of login', () => {
  const planButton = read('components/PlanButton.tsx');
  const login = read('app/login/page.tsx');
  const resume = read('app/checkout/resume/page.tsx');
  const route = read('app/api/checkout/route.ts');

  assert.doesNotMatch(planButton, /fetch\(["']\/api\/checkout/);
  assert.doesNotMatch(login, /fetch\(["']\/api\/checkout/);
  assert.match(planButton, /checkoutResumePath/);
  assert.match(resume, /confirmPurchase: true/);
  assert.match(resume, /algemene voorwaarden/);
  assert.match(resume, /annuleren-terugbetaling/);
  assert.match(resume, /incl\. btw/);
  assert.match(route, /confirmPurchase !== true/);
  assert.match(route, /termsVersion !== CHECKOUT_TERMS_VERSION/);
  assert.match(route, /purchase_confirmed_at/);
});

test('registratie vereist zakelijke 18+ voorwaardenbevestiging zonder marketingopt-in', () => {
  const register = read('app/register/page.tsx');
  assert.match(register, /age_18_plus_confirmed: true/);
  assert.match(register, /business_use_confirmed: true/);
  assert.match(register, /terms_accepted_at/);
  assert.match(register, /type="checkbox" required/);
  assert.match(register, /privacyverklaring/);
  assert.doesNotMatch(register, /newsletter|nieuwsbrief|marketing_opt/i);
});

test('privacy bevat grondslagen, kinderen, doorgifte en deletion flow', () => {
  const privacy = read('app/privacy/page.tsx');
  assert.match(privacy, /Overeenkomst \/ precontractuele stappen/);
  assert.match(privacy, /Wettelijke verplichting/);
  assert.match(privacy, /Gerechtvaardigd belang/);
  assert.match(privacy, /Doorgifte buiten de EER/);
  assert.match(privacy, /niet bedoeld voor kinderen/);
  assert.match(privacy, /\/privacy\/verwijderen/);
  assert.match(privacy, /Autoriteit Persoonsgegevens/);
});

test('cookie policy verklaart alleen noodzakelijke cookies en geen fake consent banner', () => {
  const policy = read('app/cookiebeleid/page.tsx');
  assert.match(policy, /peppolpro_checkout_plan/);
  assert.match(policy, /Supabase authenticatie\/PKCE/);
  assert.match(policy, /geen advertentiecookies/i);
  assert.match(policy, /geen toestemmingsbanner/i);
  assert.doesNotMatch(read('app/layout.tsx'), /CookieBanner|cookie_consent/);
});

test('publieke claims bevatten geen absolute AI, compliance of ISO garantie', () => {
  const sources = [
    read('lib/constants.ts'),
    read('app/page.tsx'),
    read('app/over-ons/page.tsx'),
    read('app/pdf-naar-ubl/page.tsx'),
    read('app/avg-gdpr/page.tsx'),
  ].join('\n');
  assert.doesNotMatch(sources, /100% conforme|output is altijd 100% correct|AI herkent ze allemaal|geaccepteerd door elk Peppol|AVG\/GDPR compliant|ISO 27001 certificering in Q3 2026/i);
});

test('prijzen en voorwaarden zijn consistent over btw en betaalde extra opties', () => {
  const pricing = read('app/prijzen/page.tsx');
  const terms = read('app/voorwaarden/page.tsx');
  const home = read('app/page.tsx');
  assert.match(pricing, /incl\. btw/);
  assert.match(home, /incl\. btw/);
  assert.match(terms, /inclusief btw/);
  assert.doesNotMatch(terms, /prijzen.*exclusief btw/i);
  assert.doesNotMatch(read('lib/plans.ts'), /Populair/);
});

test('actuele Peppol- en mandate-copy vervangt consultatie en cross-border fout', () => {
  const files = [
    'lib/monitor/mandate.ts',
    'app/monitor/page.tsx',
    'app/monitor/_components/CheckTool.tsx',
    'app/monitor/ben-ik-verplicht-te-e-factureren/page.tsx',
    'app/monitor/over-ons/page.tsx',
    'app/monitor/wat-is-peppol/page.tsx',
    'app/monitor/veelgestelde-vragen/page.tsx',
    'app/peppol-verplicht-belgie/page.tsx',
  ].map(read).join('\n');
  assert.doesNotMatch(files, /in consultatie \/ nog niet definitief/i);
  assert.match(files, /1 juli 2030/);
  assert.match(files, /11 september 2026/);
  assert.match(files, /niet automatisch/);
  assert.match(files, /niet iedere geregistreerde ontvanger/i);
});

test('contactformulier minimaliseert en legt privacy uit', () => {
  const contact = read('app/contact/page.tsx');
  assert.match(contact, /maxLength={5000}/);
  assert.match(contact, /schrijft je niet in voor marketing/);
  assert.match(contact, /href="\/privacy"/);
  assert.doesNotMatch(contact, /meestal binnen 24 uur/i);
});
