import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paidPlans, creditBundles } from '../lib/plans.ts';

const checkoutRoute = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const mollieWebhookRoute = readFileSync(new URL('../app/api/mollie/webhook/route.ts', import.meta.url), 'utf8');
const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');

const expectedRecurringPlans = ['monitoring', 'monitoring_accountant'];
const expectedCreditBundles = ['send_credits_10', 'send_credits_25', 'send_credits_50'];

test('only monitoring plans are recurring paid plans', () => {
 assert.deepEqual(paidPlans.map((plan) => plan.id).sort(), expectedRecurringPlans.toSorted());
 for (const plan of paidPlans) {
  assert.equal(plan.paid, true);
  assert.equal(plan.recurring, true);
  assert.match(plan.amount, /^\d+\.\d{2}$/);
 }
});

test('send credit bundles are one-off products, not subscriptions', () => {
 assert.deepEqual(creditBundles.map((bundle) => bundle.id).sort(), expectedCreditBundles.toSorted());
 assert.deepEqual(creditBundles.map((bundle) => bundle.credits), [10, 25, 50]);
 assert.deepEqual(creditBundles.map((bundle) => bundle.amount), ['9.00', '19.00', '34.00']);
 for (const bundle of creditBundles) {
  assert.equal(bundle.paid, true);
  assert.equal(bundle.recurring, false);
  assert.equal(bundle.validMonths, 12);
 }
});

test('credit bundle checkout does not create Mollie customer or subscription flow', () => {
 const bundleBlock = checkoutRoute.match(new RegExp('if \\(isCreditBundle\\(product\\.id\\)\\) \\{[\\s\\S]*?return NextResponse\\.json\\(\\{ checkoutUrl: payment\\._links\\.checkout\\.href \\}\\);\\n  \\}'))?.[0] || '';
 assert.match(bundleBlock, /purchase_type: "send_credit_bundle"/);
 assert.match(bundleBlock, /type: "credit_purchase"/);
 assert.match(bundleBlock, /sequence_type: "oneoff"/);
 assert.doesNotMatch(bundleBlock, /createCustomer\(/);
 assert.doesNotMatch(bundleBlock, /customerId/);
 assert.doesNotMatch(bundleBlock, /sequenceType:\s*"first"/);
 assert.doesNotMatch(bundleBlock, /from\("subscriptions"\)\.upsert/);
});

test('monitoring checkout still creates Mollie first payment and subscription row', () => {
 assert.match(checkoutRoute, /if \(!isMonitoringPlan\(product\.id\)\)/);
 assert.match(checkoutRoute, /createCustomer\(/);
 assert.match(checkoutRoute, /sequenceType: "first"/);
 assert.match(checkoutRoute, /purchase_type: "monitoring_subscription"/);
 assert.match(checkoutRoute, /type: "subscription_first"/);
 assert.match(checkoutRoute, /from\("subscriptions"\)\.upsert\(\{/);
 assert.match(checkoutRoute, /subscription_status: "pending"/);
});

test('webhook creates recurring subscriptions only for recurring monitoring products', () => {
 assert.match(mollieWebhookRoute, /!planConfig\.paid \|\| !planConfig\.recurring/);
 assert.match(mollieWebhookRoute, /createSubscription\(\{/);
 assert.match(mollieWebhookRoute, /await ensureRecurringSubscription\(\{ supabase, payment, userId, plan: planConfig\.id/);
 assert.match(mollieWebhookRoute, /await ensurePaymentInvoice\(\{ supabase, payment, paymentRow, subscription \}\)/);
 assert.match(billingLib, /invoice_kind: product\.recurring \? "subscription" : "credits"/);
});
