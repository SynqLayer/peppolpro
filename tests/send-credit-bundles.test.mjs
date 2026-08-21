import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creditBundles } from '../lib/plans.ts';

const plans = readFileSync(new URL('../lib/plans.ts', import.meta.url), 'utf8');
const checkoutRoute = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const mollieWebhookRoute = readFileSync(new URL('../app/api/mollie/webhook/route.ts', import.meta.url), 'utf8');
const recommandRoute = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');
const migration0016 = readFileSync(new URL('../supabase/migrations/0016_send_credit_bundles.sql', import.meta.url), 'utf8');
const migration0019 = readFileSync(new URL('../supabase/migrations/0019_idempotent_send_credit_grants.sql', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../app/dashboard/DashboardClient.tsx', import.meta.url), 'utf8');
const nieuwPage = readFileSync(new URL('../app/nieuw/page.tsx', import.meta.url), 'utf8');
const pricingPage = readFileSync(new URL('../app/prijzen/page.tsx', import.meta.url), 'utf8');
const upgradePage = readFileSync(new URL('../app/upgrade/page.tsx', import.meta.url), 'utf8');

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

test('send route is idempotent for already-sent targets before validation, provider calls or debit', () => {
 assert.match(recommandRoute, /function existingSendResponse/);
 assert.match(recommandRoute, /function hasCompletedSend/);
 assert.match(recommandRoute, /if \(hasCompletedSend\(existing\)\) return existingSendResponse\(existing\)/);
 const beforeRecipientValidation = recommandRoute.match(/const existing = await fetchTarget[\s\S]*?const recipient = normalizePeppolId/)?.[0] || '';
 assert.match(beforeRecipientValidation, /hasCompletedSend\(existing\)/);
 assert.doesNotMatch(beforeRecipientValidation, /sendDocument\(|reserve_send_credit|verifyRecipient\(/);
});

test('send route claims a target and reserves credits atomically before provider calls', () => {
 assert.match(recommandRoute, /function claimTargetForSending/);
 assert.match(recommandRoute, /recommand_status: "sending"/);
 assert.match(recommandRoute, /\.is\("recommand_document_id", null\)/);
 assert.match(recommandRoute, /\.is\("sent_via_recommand_at", null\)/);
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
});
