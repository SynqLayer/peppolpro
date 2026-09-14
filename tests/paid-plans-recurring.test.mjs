import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paidPlans, creditBundles } from '../lib/plans.ts';
import * as plans from '../lib/plans.ts';
import { createDbClient, loadTsModule, nextServer } from './behavior-harness.mjs';

const checkoutRoute = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');

const expectedRecurringPlans = ['monitoring', 'monitoring_accountant'];
const expectedCreditBundles = ['send_credits_10', 'send_credits_25', 'send_credits_50'];
const uid = '00000000-0000-4000-8000-000000000001';

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

async function webhookFor(payment) {
 const trace = [];
 const product = payment.metadata.plan;
 const existingPayment = { id: '00000000-0000-4000-8000-000000000010', user_id: uid, amount: Number(payment.amount.value), plan: product, status: payment.status };
 const subscriptionRow = { id: 'sub-local', user_id: uid, plan: product, mollie_subscription_id: null, current_period_end: null };
 const admin = createDbClient({
  'rpc:claim_mollie_webhook_event': { data: { action: 'claimed' }, error: null },
  payments: { data: existingPayment, error: null }, subscriptions: { data: subscriptionRow, error: null },
  user_profiles: { data: { send_credits_expires_at: null }, error: null }, webhook_events: { data: null, error: null }, invoices: { data: [], error: null },
  'rpc:apply_mollie_payment_adjustments': { data: {}, error: null },
 }, trace);
 let subscriptionsCreated = 0;
 const invoiceCalls = [];
 const route = loadTsModule('app/api/mollie/webhook/route.ts', {
  'next/server': nextServer, '@supabase/supabase-js': { createClient: () => admin },
  '@/lib/billing': { ensurePaymentInvoice: async (args) => invoiceCalls.push(args), sendBillingInvoiceEmail: async () => {} },
  '@/lib/mollie-adjustments': { getPaymentAdjustments: async () => [], mollieWebhookEventKey: (paymentId, status) => `${paymentId}:${status}` },
  '@/lib/mollie': {
   getPayment: async () => payment, getSubscription: async () => null, cancelSubscription: async () => {},
   createSubscription: async () => { subscriptionsCreated++; return { id: 'sub-mollie', status: 'active', nextPaymentDate: '2026-10-14' }; },
  },
  '@/lib/plans': plans,
 }, { env: { NEXT_PUBLIC_SUPABASE_URL: 'http://fixture.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture', NEXT_PUBLIC_APP_URL: 'https://app.invalid' } });
 const response = await route.POST({ formData: async () => ({ get: () => payment.id }) });
 return { response, trace, subscriptionsCreated, invoiceCalls };
}

test('webhook creates recurring subscriptions only for recurring monitoring products', async () => {
 const bundle = await webhookFor({ id: 'tr_Bundle', status: 'paid', mode: 'live', amount: { value: '9.00' }, metadata: { user_id: uid, plan: 'send_credits_10', bundle_id: 'send_credits_10' } });
 assert.equal(bundle.response.status, 200);
 assert.equal(bundle.subscriptionsCreated, 0);
 assert.equal(bundle.trace.some((entry) => entry.table === 'subscriptions' && entry.method === 'upsert'), false);
 assert.equal(bundle.invoiceCalls.length, 1);
 assert.equal(bundle.invoiceCalls[0].subscription, null);

 const monitoring = await webhookFor({ id: 'tr_Monitoring', status: 'paid', mode: 'live', amount: { value: '4.95' }, customerId: 'cst_fixture', mandateId: 'mdt_fixture', metadata: { user_id: uid, plan: 'monitoring' } });
 assert.equal(monitoring.response.status, 200);
 assert.equal(monitoring.subscriptionsCreated, 1);
 assert.ok(monitoring.trace.some((entry) => entry.table === 'subscriptions' && entry.method === 'upsert' && entry.args[0].subscription_status === 'active'));
 assert.equal(monitoring.invoiceCalls.length, 1);
 assert.equal(monitoring.invoiceCalls[0].subscription.id, 'sub-local');
});

test('billing derives invoice kind from recurring versus one-off product identity', () => {
 assert.match(billingLib, /invoiceKind: product\.recurring \? "subscription" : "credits"/);
});
