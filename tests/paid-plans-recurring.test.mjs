import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paidPlans } from '../lib/plans.ts';

const checkoutRoute = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const mollieWebhookRoute = readFileSync(new URL('../app/api/mollie/webhook/route.ts', import.meta.url), 'utf8');
const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');

const expectedPaidPlans = ['verzenden_25', 'verzenden_100', 'monitoring', 'monitoring_accountant'];

test('all expected paid plans are present in plan config', () => {
 assert.deepEqual(paidPlans.map((plan) => plan.id).sort(), expectedPaidPlans.toSorted());
});

for (const plan of paidPlans) {
 test(`${plan.id} creates a Mollie customer, subscription record and VAT invoice`, () => {
  assert.equal(plan.paid, true);
  assert.match(plan.amount, /^\d+\.\d{2}$/);

  // Checkout: every paid plan creates/reuses a Mollie customer and pre-creates a pending subscription row.
  assert.match(checkoutRoute, /if \(planConfig\.paid\) \{/);
  assert.match(checkoutRoute, /createCustomer\(/);
  assert.match(checkoutRoute, /sequenceType: customerId \? "first"/);
  assert.match(checkoutRoute, /from\("subscriptions"\)\.upsert\(\{/);
  assert.match(checkoutRoute, /subscription_status: "pending"/);
  assert.doesNotMatch(checkoutRoute, /isMonitoringPlan|isSendingPlan/);

  // Webhook: paid first payments create the recurring Mollie subscription and persist the active subscription row.
  assert.match(mollieWebhookRoute, /if \(!customerId \|\| !planConfig\.paid\) return null/);
  assert.match(mollieWebhookRoute, /createSubscription\(\{/);
  assert.match(mollieWebhookRoute, /from\("subscriptions"\)\.upsert\(\{/);
  assert.match(mollieWebhookRoute, /mollie_subscription_id: subscription\.id/);
  assert.match(mollieWebhookRoute, /subscription_status: subscription\.status === "canceled" \|\| subscription\.status === "suspended" \? subscription\.status : "active"/);
  assert.match(mollieWebhookRoute, /await ensureRecurringSubscription\(\{ supabase, payment, userId, plan: planConfig\.id/);
  assert.doesNotMatch(mollieWebhookRoute, /isMonitoringPlan|isSendingPlan/);

  // Invoice: every paid plan, including sending tiers, produces a subscription VAT invoice on paid webhook.
  assert.match(billingLib, /const plan = getPlan\(planId\)/);
  assert.match(billingLib, /if \(!plan\.paid\) return null/);
  assert.match(billingLib, /invoice_kind: "subscription"/);
  assert.match(mollieWebhookRoute, /await ensurePaymentInvoice\(\{ supabase, payment, paymentRow, subscription \}\)/);
  assert.doesNotMatch(billingLib, /isMonitoringPlan|isSendingPlan/);
 });
}
