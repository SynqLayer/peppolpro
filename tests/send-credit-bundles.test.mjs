import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creditBundles } from '../lib/plans.ts';
import { generateUBL } from '../lib/ubl-generator.ts';
import { buildRecommandPayloadFromUbl } from '../lib/ubl-to-recommand.ts';

const plans = readFileSync(new URL('../lib/plans.ts', import.meta.url), 'utf8');
const checkoutRoute = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const mollieWebhookRoute = readFileSync(new URL('../app/api/mollie/webhook/route.ts', import.meta.url), 'utf8');
const recommandRoute = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');
const migration0016 = readFileSync(new URL('../supabase/migrations/0016_send_credit_bundles.sql', import.meta.url), 'utf8');
const migration0019 = readFileSync(new URL('../supabase/migrations/0019_idempotent_send_credit_grants.sql', import.meta.url), 'utf8');
const migration0021 = readFileSync(new URL('../supabase/migrations/0021_lock_down_security_definer_rpcs.sql', import.meta.url), 'utf8');
const migration0022 = readFileSync(new URL('../supabase/migrations/0022_release_ubl_credit.sql', import.meta.url), 'utf8');
const generateRoute = readFileSync(new URL('../app/api/generate/route.ts', import.meta.url), 'utf8');
const convertRoute = readFileSync(new URL('../app/api/convert/route.ts', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../app/dashboard/DashboardClient.tsx', import.meta.url), 'utf8');
const nieuwPage = readFileSync(new URL('../app/nieuw/page.tsx', import.meta.url), 'utf8');
const pricingPage = readFileSync(new URL('../app/prijzen/page.tsx', import.meta.url), 'utf8');
const upgradePage = readFileSync(new URL('../app/upgrade/page.tsx', import.meta.url), 'utf8');
const peppolSendPage = readFileSync(new URL('../app/peppol-factuur-versturen/page.tsx', import.meta.url), 'utf8');
const brevoSource = readFileSync(new URL('../lib/brevo.ts', import.meta.url), 'utf8');

test('send credit bundles replace old sending subscriptions in plan source', () => {
 assert.deepEqual(creditBundles.map((bundle) => [bundle.id, bundle.credits, bundle.amount]), [
  ['send_credits_10', 10, '9.00'],
  ['send_credits_25', 25, '19.00'],
  ['send_credits_50', 50, '34.00'],
 ]);
 assert.doesNotMatch(plans, /verzenden_25:\s*\{/);
 assert.doesNotMatch(plans, /verzenden_100:\s*\{/);
 assert.doesNotMatch(plans, /includedSends|extraSendPrice/);
});

test('migration adds send credit wallet and purchase ledger without applying production data', () => {
 assert.match(migration0016, /add column if not exists send_credits integer not null default 0/);
 assert.match(migration0016, /add column if not exists send_credits_expires_at timestamptz/);
 assert.match(migration0016, /create table if not exists public\.send_credit_purchases/);
 assert.match(migration0016, /payment_id text not null unique/);
 assert.match(migration0016, /bundle_id text not null check \(bundle_id in \('send_credits_10','send_credits_25','send_credits_50'\)\)/);
 assert.match(migration0016, /invoice_kind in \('sales','subscription','credits','credit'\)/);
 assert.match(migration0016, /create or replace function public\.grant_send_credit_bundle/);
});

test('atomic send-credit reservation migration is auth-bound and checks expiry in SQL', () => {
 const migration0017 = readFileSync(new URL('../supabase/migrations/0017_atomic_send_credit_reservation.sql', import.meta.url), 'utf8');
 assert.match(migration0017, /create or replace function public\.reserve_send_credit/);
 assert.match(migration0017, /auth\.uid\(\) <> p_user_id/);
 assert.match(migration0017, /set send_credits = up\.send_credits - 1/);
 assert.match(migration0017, /up\.send_credits > 0/);
 assert.match(migration0017, /up\.send_credits_expires_at > now\(\)/);
 assert.match(migration0017, /returning up\.send_credits/);
 assert.match(migration0017, /create or replace function public\.release_send_credit/);
 assert.match(migration0017, /set send_credits = up\.send_credits \+ 1/);
});

test('bundle checkout is one-off Mollie payment and records credit_purchase', () => {
 const bundleBlock = checkoutRoute.match(new RegExp('if \\(isCreditBundle\\(product\\.id\\)\\) \\{[\\s\\S]*?return NextResponse\\.json\\(\\{ checkoutUrl: payment\\._links\\.checkout\\.href \\}\\);\\n  \\}'))?.[0] || '';
 assert.match(bundleBlock, /purchase_type: "send_credit_bundle"/);
 assert.match(bundleBlock, /bundle_id: product\.id/);
 assert.match(bundleBlock, /type: "credit_purchase"/);
 assert.match(bundleBlock, /credits: product\.credits/);
 assert.match(bundleBlock, /sequence_type: "oneoff"/);
 assert.doesNotMatch(bundleBlock, /sequenceType/);
 assert.doesNotMatch(bundleBlock, /createCustomer|from\("subscriptions"\)\.upsert/);
});

test('paid bundle webhook grants exact credits, extends expiry 12 months and creates credits invoice', () => {
 assert.match(mollieWebhookRoute, /grantSendCredits/);
 assert.match(mollieWebhookRoute, /bundle\.validMonths/);
 assert.match(mollieWebhookRoute, /addMonths\(start, bundle\.validMonths\)/);
 assert.match(mollieWebhookRoute, /rpc\("grant_send_credit_bundle"/);
 assert.match(mollieWebhookRoute, /grant_send_credit_bundle/);
 assert.match(mollieWebhookRoute, /credits: bundle\.credits/);
 assert.match(mollieWebhookRoute, /await ensurePaymentInvoice\(\{ supabase, payment, paymentRow, subscription: null \}\)/);
 assert.match(billingLib, /invoice_kind: product\.recurring \? "subscription" : "credits"/);
});

test('send credit grant is idempotent when a Mollie webhook retries after partial success', () => {
 assert.match(migration0019, /create or replace function public\.grant_send_credit_bundle/);
 assert.match(migration0019, /on conflict \(payment_id\) do nothing/);
 assert.match(migration0019, /if found then[\s\S]*send_credits = send_credits \+ p_credits/);
 assert.match(migration0019, /grant execute on function public\.grant_send_credit_bundle/);
});

test('security-definer credit RPCs are service-role only with defense-in-depth guards', () => {
 for (const fn of [
  'use_credit\\(uuid\\)',
  'reserve_send_credit\\(uuid\\)',
  'release_send_credit\\(uuid\\)',
  'release_ubl_credit\\(uuid\\)',
  'grant_send_credit_bundle\\(uuid, text, integer, numeric, text, timestamptz\\)',
  'increment_credits\\(uuid, integer\\)',
 ]) {
  assert.match(`${migration0021}\n${migration0022}`, new RegExp(`revoke all on function public\\.${fn} from public, anon, authenticated, hermes_operator`));
  assert.match(`${migration0021}\n${migration0022}`, new RegExp(`grant execute on function public\\.${fn} to service_role`));
 }
 for (const message of [
  'service_role required to use credit',
  'service_role required to reserve send credit',
  'service_role required to release send credit',
  'service_role required to release UBL credit',
  'service_role required to grant send credits',
  'service_role required to increment credits',
 ]) {
  assert.match(`${migration0021}\n${migration0022}`, new RegExp(message));
 }
 assert.match(migration0022, /create or replace function public\.release_ubl_credit/);
 assert.match(migration0022, /set credits = up\.credits \+ 1/);
 assert.match(migration0022, /revoke all on function public\.release_ubl_credit\(uuid\) from public, anon, authenticated, hermes_operator/);
 assert.match(migration0022, /grant execute on function public\.release_ubl_credit\(uuid\) to service_role/);
 assert.doesNotMatch(`${migration0021}\n${migration0022}`, /grant execute on function public\.(use_credit|reserve_send_credit|release_send_credit|release_ubl_credit|grant_send_credit_bundle|increment_credits)[^;]+authenticated/);
 assert.doesNotMatch(`${migration0021}\n${migration0022}`, /grant execute on function public\.(use_credit|reserve_send_credit|release_send_credit|release_ubl_credit|grant_send_credit_bundle|increment_credits)[^;]+anon/);
});

test('routes call credit RPCs with the service-role admin client after auth', () => {
 assert.match(generateRoute, /createAdminSupabase/);
 assert.match(generateRoute, /admin\.rpc\("use_credit"/);
 assert.match(generateRoute, /admin\.rpc\("release_ubl_credit"/);
 assert.doesNotMatch(generateRoute, /supabase\.rpc\("use_credit"/);
 assert.match(convertRoute, /createAdminSupabase/);
 assert.match(convertRoute, /admin\.rpc\("use_credit"/);
 assert.match(convertRoute, /admin\.rpc\("release_ubl_credit"/);
 assert.doesNotMatch(convertRoute, /supabase\.rpc\("use_credit"/);
 assert.match(recommandRoute, /createAdminSupabase/);
 assert.match(recommandRoute, /reserveSendCredit\(admin, user\.id\)/);
 assert.match(recommandRoute, /releaseSendCredit\(admin, user\.id\)/);
});

test('send route is idempotent for already-sent targets before validation, provider calls or debit', () => {
 assert.match(recommandRoute, /function existingSendResponse/);
 assert.match(recommandRoute, /function hasCompletedSend/);
 assert.match(recommandRoute, /if \(hasCompletedSend\(existing\)\) return existingSendResponse\(existing\)/);
 const beforeRecipientValidation = recommandRoute.match(/const existing = await fetchTarget[\s\S]*?let recipient = normalizePeppolId/)?.[0] || '';
 assert.match(beforeRecipientValidation, /hasCompletedSend\(existing\)/);
 assert.doesNotMatch(beforeRecipientValidation, /sendDocument\(|reserve_send_credit|verifyRecipient\(/);
});

test('send route claims a target and reserves credits atomically before provider calls', () => {
 assert.match(recommandRoute, /function claimTargetForSending/);
 assert.match(recommandRoute, /rpc\("claim_recommand_send_target"/);
 assert.match(recommandRoute, /p_stale_after_minutes: RECOMMAND_SEND_STALE_AFTER_MINUTES/);
 assert.match(recommandRoute, /recommand_claimed_at/);
 assert.match(recommandRoute, /rpc\("reserve_send_credit"/);
 const reserveBeforeProvider = recommandRoute.match(/const reserved = await reserveSendCredit[\s\S]*?const verify = await verifyRecipient/)?.[0] || '';
 assert.match(reserveBeforeProvider, /reserveSendCredit/);
 assert.doesNotMatch(recommandRoute, /send_credits: sendCredits - 1/);
 assert.doesNotMatch(recommandRoute, /const sendCredits = profile\.send_credits/);
});

test('send route releases reserved credits on provider-side failure paths', () => {
 assert.match(recommandRoute, /rpc\("release_send_credit"/);
 assert.match(recommandRoute, /const releaseAfterFailure = async \(\) => releaseSendCredit/);
 const recipientFailBlock = recommandRoute.match(/if \(!verify\.isValid\) \{[\s\S]*?return jsonError\("Ontvanger is niet gevonden/)?.[0] || '';
 const supportFailBlock = recommandRoute.match(/if \(!support\.isValid\) \{[\s\S]*?return jsonError\("Ontvanger ondersteunt/)?.[0] || '';
 const sendFailBlock = recommandRoute.match(/if \(!send\.success\) \{[\s\S]*?return jsonError\("Recommand heeft/)?.[0] || '';
 const catchBlock = recommandRoute.match(/catch \(error\) \{[\s\S]*?return jsonError\("Recommand verzenden is mislukt/)?.[0] || '';
 for (const block of [recipientFailBlock, supportFailBlock, sendFailBlock, catchBlock]) {
  assert.match(block, /releaseAfterFailure\(\)/);
 }
});



test('UBL credit debit is atomic and released when storage after debit fails', () => {
 assert.match(migration0021, /update public\.user_profiles\s+set credits = credits - 1\s+where id = p_user_id and credits > 0/);
 assert.match(migration0022, /update public\.user_profiles up\s+set credits = up\.credits \+ 1\s+where up\.id = p_user_id\s+returning up\.credits/);

 const generateDebitToInsertFailure = generateRoute.match(/admin\.rpc\("use_credit"[\s\S]*?if \(conversionError \|\| !conversion\) \{[\s\S]*?\}/)?.[0] || '';
 assert.match(generateDebitToInsertFailure, /use_credit/);
 assert.match(generateDebitToInsertFailure, /releaseUblCredit\(admin, user\.id\)/);
 assert.match(generateDebitToInsertFailure, /Factuur kon niet worden opgeslagen/);

 const convertDebitToInsertFailure = convertRoute.match(/if \(convError \|\| !conversion\) \{[\s\S]*?Kan conversie niet aanmaken[\s\S]*?\}/)?.[0] || '';
 const convertUploadFailure = convertRoute.match(/if \(uploadError\) \{[\s\S]*?PDF kon niet worden opgeslagen[\s\S]*?\}/)?.[0] || '';
 assert.match(convertRoute, /admin\.rpc\("use_credit"/);
 assert.match(convertDebitToInsertFailure, /releaseUblCredit\(admin, user\.id\)/);
 assert.match(convertDebitToInsertFailure, /Kan conversie niet aanmaken/);
 assert.match(convertUploadFailure, /releaseUblCredit\(admin, user\.id\)/);
 assert.match(convertUploadFailure, /PDF kon niet worden opgeslagen/);

 assert.doesNotMatch(`${generateRoute}\n${convertRoute}`, /credits\s*=\s*credits\s*-\s*1/);
});

test('UI surfaces bundles and remaining send credit wallet', () => {
 assert.match(pricingPage, /publicPricingPlans/);
 assert.match(upgradePage, /creditBundles/);
 for (const source of [pricingPage, upgradePage]) {
  assert.doesNotMatch(source, /Verzenden 25|Verzenden 100|€0,45|€0,35/);
 }
 assert.match(dashboard, /label="Verzendtegoed"/);
 assert.match(dashboard, /send_credits_expires_at/);
 assert.match(nieuwPage, /Verzendtegoed:/);
 assert.match(nieuwPage, /Koop een verzendbundel om via Peppol te verzenden/);
 assert.doesNotMatch(nieuwPage, /Verzenden 25|Verzenden 100/);
 assert.doesNotMatch(peppolSendPage, /Verzenden 25|Verzenden 100|€0,45|€0,35/);
 assert.match(peppolSendPage, /CREDIT_BUNDLES/);
 assert.doesNotMatch(brevoSource, /Verzenden 25|Verzenden 100|€0,45|€0,35/);
});

test('dashboard renders a per-invoice send action and removes the old new-invoice instruction', () => {
 assert.match(dashboard, /function handleDashboardSend/);
 assert.match(dashboard, /fetch\("\/api\/recommand\/send"/);
 assert.match(dashboard, /JSON\.stringify\(\{ conversionId: conversion\.id \}\)/);
 assert.match(dashboard, /Download XML/);
 assert.match(dashboard, /"Verzenden"/);
 assert.match(dashboard, /Koop verzendtegoed/);
 assert.match(dashboard, /href="\/prijzen"/);
 assert.match(dashboard, /Verifieer eerst/);
 assert.doesNotMatch(dashboard, /Verzenden via Nieuwe factuur/);
});

test('dashboard status prefers Recommand delivery state and only labels AS4 receipt as delivered', () => {
 assert.match(dashboard, /const effectiveStatus = \(conversion: Conversion\) => conversion\.recommand_status \|\| \(conversion\.ubl_xml \? "success" : conversion\.status\)/);
 assert.match(dashboard, /as4_received: \{ label: "Afgeleverd"/);
 assert.match(dashboard, /Ontvangstbevestiging op/);
 assert.match(dashboard, /send_failed: \{ label: "Verzenden mislukt"/);
 assert.match(dashboard, /const failureReason/);
 assert.doesNotMatch(dashboard, /recommand_raw_response\?:/);
 assert.doesNotMatch(dashboard, /responseReason/);
 assert.match(dashboard, /duplicate_voided: \{ label: "Vervallen \(dubbel\)"/);
 assert.doesNotMatch(dashboard, /delivered: \{ label: "Afgeleverd"/);
 assert.match(dashboard, /<StatusBadge conversion=\{conversion\} \/>/);
 assert.doesNotMatch(dashboard, /<StatusBadge status=\{conversion\.status\} \/>/);
});

test('dashboard send action updates row state and the send-credit KPI without refresh', () => {
 assert.match(dashboard, /const \[localConversions, setLocalConversions\]/);
 assert.match(dashboard, /const \[localSendCredits, setLocalSendCredits\]/);
 assert.match(dashboard, /if \(typeof body\.remainingCredits === "number"\) setLocalSendCredits\(body\.remainingCredits\)/);
 assert.match(dashboard, /setLocalConversions\(\(current\) => current\.map/);
 assert.match(dashboard, /recommand_status: body\.status/);
 assert.match(dashboard, /recommand_document_id: body\.documentId/);
});

test('send route can reuse a stored conversion UBL when dashboard sends only the conversion id', () => {
 assert.match(recommandRoute, /buildRecommandPayloadFromUbl/);
 assert.match(recommandRoute, /existing\.ubl_xml/);
 assert.match(recommandRoute, /document \|\|= fromUbl\.document/);
 assert.match(recommandRoute, /recipient \|\|= fromUbl\.recipient/);

 const xml = generateUBL({
  supplierName: 'SynqLayer BV',
  supplierAddress: 'Straat 1',
  supplierPostalCode: '1000AA',
  supplierCity: 'Amsterdam',
  supplierCountry: 'NL',
  supplierVatNr: 'NL123456789B01',
  supplierKvkKbo: '12345678',
  supplierIban: 'NL91ABNA0417164300',
  customerName: 'Klant BV',
  customerAddress: 'Klantstraat 2',
  customerPostalCode: '2000BB',
  customerCity: 'Rotterdam',
  customerCountry: 'NL',
  customerVatNr: 'NL987654321B01',
  customerKvkKbo: '87654321',
  customerPeppolId: '0106:87654321',
  customerEmail: 'klant@example.nl',
  buyerReference: 'PO-1',
  invoiceNumber: 'F-TEST-1',
  invoiceDate: '2026-08-28',
  dueDate: '2026-09-27',
  currency: 'EUR',
  lines: [{ id: '1', description: 'Dienst', quantity: 2, unitPrice: 50, vatPct: 21 }],
 });
 const payload = buildRecommandPayloadFromUbl(xml);
 assert.equal(payload.recipient, '0106:87654321');
 assert.equal(payload.document.invoiceNumber, 'F-TEST-1');
 assert.equal(payload.document.buyer.name, 'Klant BV');
 assert.equal(payload.document.seller?.vatNumber, 'NL123456789B01');
 assert.equal(payload.document.paymentMeans[0].iban, 'NL91ABNA0417164300');
 assert.deepEqual(payload.document.lines.map((line) => [line.name, line.quantity, line.netPriceAmount, line.vat.percentage]), [['Dienst', '2', '50.00', '21.00']]);
});
