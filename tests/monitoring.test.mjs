import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const plans = readFileSync(new URL('../lib/plans.ts', import.meta.url), 'utf8');
const migration0003 = readFileSync(new URL('../supabase/migrations/0003_monitoring_tier.sql', import.meta.url), 'utf8');
const migration0004 = readFileSync(new URL('../supabase/migrations/0004_monitoring_accountant_tier.sql', import.meta.url), 'utf8');
const targetsRoute = readFileSync(new URL('../app/api/monitoring/targets/route.ts', import.meta.url), 'utf8');
const bulkRoute = readFileSync(new URL('../app/api/monitoring/bulk-import/route.ts', import.meta.url), 'utf8');
const cronRoute = readFileSync(new URL('../app/api/cron/monitoring-check/route.ts', import.meta.url), 'utf8');
const migration0005 = readFileSync(new URL('../supabase/migrations/0005_monitoring_integrations_and_team.sql', import.meta.url), 'utf8');
const reportRoute = readFileSync(new URL('../app/api/monitoring/report/[targetId]/route.ts', import.meta.url), 'utf8');
const webhookRoute = readFileSync(new URL('../app/api/monitoring/webhook-config/route.ts', import.meta.url), 'utf8');
const workflow = readFileSync(new URL('../.github/workflows/monitoring-cron.yml', import.meta.url), 'utf8');
const migration0006 = readFileSync(new URL('../supabase/migrations/0006_retention_cleanup.sql', import.meta.url), 'utf8');
const cleanupRoute = readFileSync(new URL('../app/api/cron/retention-cleanup/route.ts', import.meta.url), 'utf8');
const reportLib = readFileSync(new URL('../lib/monitoring-report-pdf.ts', import.meta.url), 'utf8');
const memberDeleteRoute = readFileSync(new URL('../app/api/account/members/[memberId]/route.ts', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../app/dashboard/DashboardClient.tsx', import.meta.url), 'utf8');
const privacyPage = readFileSync(new URL('../app/privacy/page.tsx', import.meta.url), 'utf8');
const mollieLib = readFileSync(new URL('../lib/mollie.ts', import.meta.url), 'utf8');
const checkoutRoute = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const mollieWebhookRoute = readFileSync(new URL('../app/api/mollie/webhook/route.ts', import.meta.url), 'utf8');
const monitoringAccess = readFileSync(new URL('../lib/monitoring-access.ts', import.meta.url), 'utf8');
const migration0007 = readFileSync(new URL('../supabase/migrations/0007_mollie_subscriptions.sql', import.meta.url), 'utf8');
const dashboardPage = readFileSync(new URL('../app/dashboard/page.tsx', import.meta.url), 'utf8');
const migration0008 = readFileSync(new URL('../supabase/migrations/0008_billing_invoices_webhook_events.sql', import.meta.url), 'utf8');
const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');
const invoicePdfLib = readFileSync(new URL('../lib/invoice-pdf.ts', import.meta.url), 'utf8');
const invoiceRoute = readFileSync(new URL('../app/api/invoices/[invoiceId]/route.ts', import.meta.url), 'utf8');
const cancelSubscriptionRoute = readFileSync(new URL('../app/api/subscription/cancel/route.ts', import.meta.url), 'utf8');
const retentionCleanupRoute = readFileSync(new URL('../app/api/cron/retention-cleanup/route.ts', import.meta.url), 'utf8');
const onboardingPage = readFileSync(new URL('../app/onboarding/page.tsx', import.meta.url), 'utf8');
const migration0009 = readFileSync(new URL('../supabase/migrations/0009_payments_mollie_payment_id_unique_constraint.sql', import.meta.url), 'utf8');

test('monitoring tiers are configured with limits and frequencies', () => {
 assert.match(plans, /monitoring:\s*{[\s\S]*amount:\s*"9\.00"/);
 assert.match(plans, /monitoring:\s*{[\s\S]*maxTargets:\s*10/);
 assert.match(plans, /monitoring:\s*{[\s\S]*checkFrequency:\s*"weekly"/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*amount:\s*"39\.00"/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*maxTargets:\s*null/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*checkFrequency:\s*"daily"/);
});

test('monitoring events are read-only for authenticated users in RLS migration', () => {
 assert.match(migration0003, /create policy "read own monitoring events"/);
 assert.match(migration0003, /on public\.monitoring_events for select/);
 assert.doesNotMatch(migration0003, /on public\.monitoring_events for insert/);
 assert.doesNotMatch(migration0003, /on public\.monitoring_events for update/);
 assert.doesNotMatch(migration0003, /on public\.monitoring_events for delete/);
});

test('migration 0004 adds accountant tier without database target limit', () => {
 assert.match(migration0004, /monitoring_accountant/);
 assert.doesNotMatch(migration0004, /maxTargets|limit|count\(/i);
});

test('target API enforces monitoring limit while accountant bulk import is gated', () => {
 assert.match(targetsRoute, /assertMonitoringAccess\(user\.id\)/);
 assert.match(targetsRoute, /plan\.maxTargets/);
 assert.match(targetsRoute, /Upgrade naar Monitoring Accountant/);
 assert.match(bulkRoute, /assertMonitoringAccess\(user\.id, \{ requireAccountant: true \}\)/);
 assert.match(bulkRoute, /identifier_type, identifier_value,label/);
});

test('cron monitoring check respects entitlement frequency and writes events', () => {
 assert.match(cronRoute, /getMonitoringEntitlement\(target\.user_id\)/);
 assert.match(cronRoute, /entitlement\.hasAccess/);
 assert.match(cronRoute, /shouldCheck\(target\.last_checked_at, entitlement\.plan\.checkFrequency\)/);
 assert.match(cronRoute, /from\("monitoring_events"\)\.insert/);
 assert.match(cronRoute, /directory\.peppol\.eu\/search\/1\.0\/json/);
});

test('GitHub Actions workflow triggers monitoring cron hourly with CRON_SECRET', () => {
 assert.match(workflow, /cron:\s*"0 \* \* \* \*"/);
 assert.match(workflow, /https:\/\/peppolpro\.nl\/api\/cron\/monitoring-check/);
 assert.match(workflow, /secrets\.CRON_SECRET/);
});

test('monitoring report route is PDF gated by central monitoring entitlement', () => {
 assert.match(reportRoute, /generateMonitoringReportPdf/);
 assert.match(reportRoute, /Content-Type": "application\/pdf"/);
 assert.match(reportRoute, /assertMonitoringAccess\(user\.id\)/);
});

test('webhook and team migration creates secure integration tables and shared target RLS', () => {
 assert.match(migration0005, /create table if not exists public\.api_keys/);
 assert.match(migration0005, /key_hash text not null/);
 assert.match(migration0005, /create table if not exists public\.monitoring_webhook_configs/);
 assert.match(migration0005, /create table if not exists public\.account_members/);
 assert.match(migration0005, /owner or member monitoring targets select/);
 assert.match(migration0005, /owner or member monitoring events select/);
 assert.doesNotMatch(migration0005, /key text not null/i);
});

test('webhook config route validates https webhook URLs', () => {
 assert.match(webhookRoute, /normalizeWebhookUrl/);
 assert.match(webhookRoute, /monitoring_webhook_configs/);
});

test('retention cleanup deletes old monitoring events and expires pending invites without retaining email PII', () => {
 assert.match(migration0006, /monitoring-events.*12 months|12 maanden|Monitoring event history is retained for 12 months/is);
 assert.match(migration0006, /alter table public\.account_members[\s\S]*status text/);
 assert.match(migration0006, /alter table public\.account_members[\s\S]*invite_email drop not null/);
 assert.match(cleanupRoute, /from\("monitoring_events"\)[\s\S]*\.delete\(\{ count: "exact" \}\)[\s\S]*\.lt\("created_at", eventCutoff\)/);
 assert.match(cleanupRoute, /from\("account_members"\)[\s\S]*status: "expired", invite_email: null/);
 assert.match(cleanupRoute, /Bearer \$\{secret\}/);
});

test('workflow runs monitoring hourly and retention cleanup as a separate daily step', () => {
 assert.match(workflow, /cron:\s*"0 \* \* \* \*"/);
 assert.match(workflow, /api\/cron\/monitoring-check/);
 assert.match(workflow, /Daily retention cleanup/);
 assert.match(workflow, /api\/cron\/retention-cleanup/);
 assert.match(workflow, /date -u \+%H/);
 assert.match(workflow, /secrets\.CRON_SECRET/);
});

test('PDF report is generated as a response only without server-side storage or cache', () => {
 const combined = `${reportRoute}\n${reportLib}`;
 assert.match(reportRoute, /new NextResponse\(pdf/);
 assert.match(reportRoute, /"Cache-Control": "no-store"/);
 assert.doesNotMatch(combined, /writeFile|createWriteStream|\.from\("storage"\)|supabase\.storage|revalidate|unstable_cache|cacheTag/);
});

test('webhook UI requires active disclaimer confirmation before saving', () => {
 assert.match(dashboard, /U bent zelf verantwoordelijk voor de beveiliging van dit eindpunt/);
 assert.match(dashboard, /webhookDisclaimerAccepted/);
 assert.match(dashboard, /disabled=\{!webhookDisclaimerAccepted\}/);
 assert.match(dashboard, /disclaimer_accepted: webhookDisclaimerAccepted/);
 assert.match(webhookRoute, /disclaimer_accepted/);
 assert.match(webhookRoute, /Bevestig eerst de webhook-disclaimer/);
});

test('team member delete route removes membership and RLS access depends on accepted row presence', () => {
 assert.match(memberDeleteRoute, /export async function DELETE/);
 assert.match(memberDeleteRoute, /isOwner/);
 assert.match(memberDeleteRoute, /isSelf/);
 assert.match(memberDeleteRoute, /from\("account_members"\)[\s\S]*\.delete\(\)/);
 assert.match(memberDeleteRoute, /accessRevoked: true/);
 assert.match(migration0006, /am\.status = 'accepted'/);
 assert.match(migration0006, /exists \([\s\S]*from public\.account_members am[\s\S]*am\.member_user_id = auth\.uid\(\)/);
});

test('privacy page documents monitoring retention, team invite expiry and webhook forwarding', () => {
 assert.match(privacyPage, /Monitoring-events.*maximaal 12 maanden/);
 assert.match(privacyPage, /Team-uitnodigingen.*maximaal 30 dagen/);
 assert.match(privacyPage, /webhook-URL instelt[\s\S]*op jouw verzoek/);
});


test('mollie subscriptions infrastructure creates customers, first payments and recurring subscriptions', () => {
 assert.match(migration0007, /create table if not exists public\.subscriptions/);
 assert.match(migration0007, /mollie_customer_id text not null/);
 assert.match(migration0007, /mollie_subscription_id text/);
 assert.match(migration0007, /mollie_mandate_id text/);
 assert.match(migration0007, /current_period_end timestamptz/);
 assert.match(migration0007, /subscription_status text not null default 'pending'/);
 assert.match(mollieLib, /export async function createCustomer/);
 assert.match(mollieLib, /export async function createSubscription/);
 assert.match(mollieLib, /export async function cancelSubscription/);
 assert.match(checkoutRoute, /createCustomer/);
 assert.match(checkoutRoute, /sequenceType: customerId \? "first"/);
 assert.match(checkoutRoute, /type: customerId \? "subscription_first"/);
 assert.match(checkoutRoute, /from\("subscriptions"\)\.upsert/);
});

test('mollie webhook handles subscription renewals, grace period, cancellation and refunds', () => {
 assert.match(mollieWebhookRoute, /payment\.subscriptionId/);
 assert.match(mollieWebhookRoute, /getSubscription/);
 assert.match(mollieWebhookRoute, /createSubscription/);
 assert.match(mollieWebhookRoute, /subscription_status: "active"/);
 assert.match(mollieWebhookRoute, /GRACE_DAYS/);
 assert.match(mollieWebhookRoute, /current_period_end: addDays\(new Date\(\), GRACE_DAYS\)/);
 assert.match(mollieWebhookRoute, /payment\.status === "refunded" \|\| payment\.status === "charged_back"/);
 assert.match(mollieWebhookRoute, /cancelKnownSubscription/);
 assert.match(mollieWebhookRoute, /setFree\(supabase, userId, "canceled"\)/);
 assert.match(mollieWebhookRoute, /subscription\.status === "canceled" \|\| subscription\.status === "suspended"/);
});

test('central monitoring entitlement requires active subscription and unexpired current period', () => {
 assert.match(monitoringAccess, /export async function assertMonitoringAccess\(userId/);
 assert.match(monitoringAccess, /subscription\?\.subscription_status === "active"/);
 assert.match(monitoringAccess, /periodIsValid\(subscription\.current_period_end\)/);
 assert.match(monitoringAccess, /isMonitoringPlan\(plan\.id\)/);
 assert.match(monitoringAccess, /resolveAccountOwnerId/);
 assert.match(dashboardPage, /assertMonitoringAccess\(user\.id\)/);
 assert.match(dashboardPage, /monitoringOwnerId \? \(await supabase/);
});


test('billing migration adds invoice numbering, credit invoices and webhook event idempotency', () => {
 assert.match(migration0008, /invoice_number_sequences/);
 assert.match(migration0008, /next_billing_invoice_number/);
 assert.match(migration0008, /invoice_kind in \('sales','subscription','credit'\)/);
 assert.match(migration0008, /original_invoice_number text/);
 assert.match(migration0008, /create table if not exists public\.webhook_events/);
 assert.match(migration0008, /event_key text not null unique/);
 assert.match(migration0008, /status text not null default 'processing' check \(status in \('processing','processed','failed'\)\)/);
});

test('paid subscription payments create invoices and refunds create separate credit invoices', () => {
 assert.match(billingLib, /export async function ensurePaymentInvoice/);
 assert.match(billingLib, /invoice_kind: "subscription"/);
 assert.match(billingLib, /next_billing_invoice_number/);
 assert.match(billingLib, /export async function ensureCreditInvoice/);
 assert.match(billingLib, /invoice_kind: "credit"/);
 assert.match(billingLib, /original_invoice_number/);
 assert.match(mollieWebhookRoute, /ensurePaymentInvoice/);
 assert.match(mollieWebhookRoute, /ensureCreditInvoice/);
});

test('invoice route downloads only own on-the-fly PDFs without server-side cache', () => {
 assert.match(invoiceRoute, /export async function GET/);
 assert.match(invoiceRoute, /eq\("user_id", user\.id\)/);
 assert.match(invoiceRoute, /generateBillingInvoicePdf/);
 assert.match(invoiceRoute, /Content-Type": "application\/pdf"/);
 assert.match(invoiceRoute, /"Cache-Control": "no-store"/);
 assert.match(invoicePdfLib, /PDFDocument\.create/);
 assert.doesNotMatch(`${invoiceRoute}\n${invoicePdfLib}`, /writeFile|createWriteStream|supabase\.storage|\.from\("storage"\)/);
});

test('mollie webhook records idempotency events and failed handler errors durably', () => {
 assert.match(mollieWebhookRoute, /startWebhook/);
 assert.match(mollieWebhookRoute, /eventKey = `\$\{payment\.id\}:\$\{payment\.status\}`/);
 assert.match(mollieWebhookRoute, /duplicate: true/);
 assert.match(mollieWebhookRoute, /markWebhook\(supabase, eventKey, "processed"\)/);
 assert.match(mollieWebhookRoute, /markWebhook\(supabase, eventKey, "failed", message\)/);
 assert.match(mollieWebhookRoute, /failed_preprocess/);
});

test('dashboard uses honest UBL statuses and does not claim delivery without access point evidence', () => {
 assert.match(dashboard, /UBL gegenereerd/);
 assert.match(dashboard, /Direct verzenden niet beschikbaar/);
 assert.doesNotMatch(dashboard, /Afgeleverd/);
 assert.doesNotMatch(dashboard, /Opnieuw verzenden/);
});

test('subscription cancel route cancels at Mollie but keeps access until period end', () => {
 assert.match(cancelSubscriptionRoute, /export async function POST/);
 assert.match(cancelSubscriptionRoute, /cancelSubscription\(subscription\.mollie_customer_id, subscription\.mollie_subscription_id\)/);
 assert.match(cancelSubscriptionRoute, /cancel_at_period_end: true/);
 assert.doesNotMatch(cancelSubscriptionRoute, /plan: "free"/);
 assert.match(dashboard, /Opgezegd, actief tot/);
 assert.match(dashboard, /handleSubscriptionCancel/);
 assert.match(dashboardPage, /select\("id, subscription_status, current_period_end, cancel_at_period_end, canceled_at"\)/);
 assert.match(retentionCleanupRoute, /cancel_at_period_end/);
 assert.match(retentionCleanupRoute, /subscription_status: "expired"/);
 assert.match(retentionCleanupRoute, /update\(\{ plan: "free" \}\)/);
});

test('onboarding writes existing user_profiles columns', () => {
 assert.match(onboardingPage, /kvk_kbo:\s*country === "NL" \? kvk : kbo/);
 assert.match(onboardingPage, /btw_nr:\s*btw/);
 assert.doesNotMatch(onboardingPage, /kvk_number:\s*/);
 assert.doesNotMatch(onboardingPage, /kbo_number:\s*/);
 assert.doesNotMatch(onboardingPage, /btw_number:\s*/);
});

test('payments upsert has a real unique constraint for mollie_payment_id', () => {
 assert.match(migration0009, /alter table public\.payments[\s\S]*add constraint payments_mollie_payment_id_key[\s\S]*unique \(mollie_payment_id\)/i);
 assert.match(checkoutRoute, /onConflict: "mollie_payment_id"/);
 assert.match(mollieWebhookRoute, /onConflict: "mollie_payment_id"/);
});
