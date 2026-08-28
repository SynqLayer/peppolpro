import { existsSync, readFileSync } from 'node:fs';
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
const apiKeysRoute = readFileSync(new URL('../app/api/monitoring/api-keys/route.ts', import.meta.url), 'utf8');
const accountMembersRoute = readFileSync(new URL('../app/api/account/members/route.ts', import.meta.url), 'utf8');
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
const migration0016 = readFileSync(new URL('../supabase/migrations/0016_send_credit_bundles.sql', import.meta.url), 'utf8');
const migration0018 = readFileSync(new URL('../supabase/migrations/0018_webhook_robustness_and_grants.sql', import.meta.url), 'utf8');
const migration0020 = readFileSync(new URL('../supabase/migrations/0020_harden_billing_table_grants.sql', import.meta.url), 'utf8');
const billingLib = readFileSync(new URL('../lib/billing.ts', import.meta.url), 'utf8');
const invoicePdfLib = readFileSync(new URL('../lib/invoice-pdf.ts', import.meta.url), 'utf8');
const invoiceRoute = readFileSync(new URL('../app/api/invoices/[invoiceId]/route.ts', import.meta.url), 'utf8');
const cancelSubscriptionRoute = readFileSync(new URL('../app/api/subscription/cancel/route.ts', import.meta.url), 'utf8');
const retentionCleanupRoute = readFileSync(new URL('../app/api/cron/retention-cleanup/route.ts', import.meta.url), 'utf8');
const onboardingPage = readFileSync(new URL('../app/onboarding/page.tsx', import.meta.url), 'utf8');
const migration0009 = readFileSync(new URL('../supabase/migrations/0009_payments_mollie_payment_id_unique_constraint.sql', import.meta.url), 'utf8');
const recommandLib = readFileSync(new URL('../lib/recommand.ts', import.meta.url), 'utf8');
const recommandRoute = readFileSync(new URL('../app/api/recommand/send/route.ts', import.meta.url), 'utf8');
const recommandInvoice = readFileSync(new URL('../lib/recommand-invoice.ts', import.meta.url), 'utf8');
const migration0011 = readFileSync(new URL('../supabase/migrations/0011_recommand_delivery_fields.sql', import.meta.url), 'utf8');
const migration0012 = readFileSync(new URL('../supabase/migrations/0012_conversion_customer_email.sql', import.meta.url), 'utf8');
const migration0013 = readFileSync(new URL('../supabase/migrations/0013_conversion_pdf_retention.sql', import.meta.url), 'utf8');
const migration0014 = readFileSync(new URL('../supabase/migrations/0014_recommand_company_verification.sql', import.meta.url), 'utf8');
const recommandCompanyRoute = readFileSync(new URL('../app/api/recommand/company/route.ts', import.meta.url), 'utf8');
const recommandCompanyStatusRoute = readFileSync(new URL('../app/api/recommand/company/status/route.ts', import.meta.url), 'utf8');
const recommandWebhookRoute = readFileSync(new URL('../app/api/recommand/webhook/route.ts', import.meta.url), 'utf8');
const recommandCompanyValidation = readFileSync(new URL('../lib/recommand-company-validation.ts', import.meta.url), 'utf8');
const recommandWebhookLib = readFileSync(new URL('../lib/recommand-webhook.ts', import.meta.url), 'utf8');
const conversionPdfRetentionLib = readFileSync(new URL('../lib/conversion-pdf-retention.ts', import.meta.url), 'utf8');
const nieuwPage = readFileSync(new URL('../app/nieuw/page.tsx', import.meta.url), 'utf8');
const ublGenerator = readFileSync(new URL('../lib/ubl-generator.ts', import.meta.url), 'utf8');
const ublValidator = readFileSync(new URL('../lib/ubl-validator.ts', import.meta.url), 'utf8');
const generateRoute = readFileSync(new URL('../app/api/generate/route.ts', import.meta.url), 'utf8');
const middlewareFile = readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8');
const invoiceParser = readFileSync(new URL('../lib/invoice-parser.ts', import.meta.url), 'utf8');
const convertRoute = readFileSync(new URL('../app/api/convert/route.ts', import.meta.url), 'utf8');
const homePage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const loginPage = readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const constants = readFileSync(new URL('../lib/constants.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const privacyPageSource = readFileSync(new URL('../app/privacy/page.tsx', import.meta.url), 'utf8');
const peppolSendPage = readFileSync(new URL('../app/peppol-factuur-versturen/page.tsx', import.meta.url), 'utf8');
const brevoSource = readFileSync(new URL('../lib/brevo.ts', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const packageLock = readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8');


test('npm audit overrides pin brace-expansion and js-yaml to patched versions', () => {
 assert.equal(packageJson.overrides['js-yaml'], '4.3.1');
 assert.equal(packageJson.overrides['minimatch@3.1.5']['brace-expansion'], '1.1.18');
 assert.equal(packageJson.overrides['minimatch@10.2.5']['brace-expansion'], '5.0.9');
 assert.match(packageLock, /"node_modules\/brace-expansion"[\s\S]*"version": "5\.0\.9"/);
 assert.match(packageLock, /"node_modules\/minimatch\/node_modules\/brace-expansion"[\s\S]*"version": "1\.1\.18"/);
 assert.match(packageLock, /"node_modules\/js-yaml"[\s\S]*"version": "4\.3\.1"/);
});


test('homepage navigation exposes login and mobile menu overlays hero content', () => {
 assert.match(homePage, /document\.body\.style\.overflow = menuOpen \? "hidden" : ""/);
 assert.match(homePage, /background: menuOpen \|\| scrollY > 50 \? C\.bg : "transparent"/);
 assert.match(homePage, /zIndex: 1000/);
 assert.match(homePage, /zIndex: 1001/);
 assert.match(homePage, />Inloggen<\/a>/);
 assert.match(homePage, /href="\/register"[\s\S]*>Probeer gratis<\/a>/);
});

test('login page shows configured Google OAuth provider with callback redirect', () => {
 assert.match(loginPage, /signInWithOAuth/);
 assert.match(loginPage, /provider:\s*"google"/);
 assert.match(loginPage, /Doorgaan met Google/);
 assert.match(loginPage, /appendCheckoutIntent\(`\$\{window\.location\.origin\}\/api\/auth\/callback`, checkoutPlan\)/);
});

test('public copy does not claim temporary-only storage, VIES validation, or loose sending', () => {
 for (const source of [homePage, constants, layout, privacyPageSource, peppolSendPage, brevoSource, convertRoute, generateRoute]) {
  assert.doesNotMatch(source, /We slaan niets op/i);
  assert.doesNotMatch(source, /daarna verwijderd/i);
  assert.doesNotMatch(source, /EU VIES-systeem/i);
  assert.doesNotMatch(source, /losse verzending/i);
 }
 assert.match(constants, /factuurhistorie kunt terugzien/);
 assert.match(constants, /BTW-validatie staat op de roadmap/);
 assert.match(homePage, /verzend via Peppol na bedrijfsverificatie met een verzendbundel/);
});

test('middleware invokes proxy session refresh and excludes static assets', () => {
 assert.equal(existsSync(new URL('../proxy.ts', import.meta.url)), false);
 assert.match(middlewareFile, /async function proxy\(request: NextRequest\)/);
 assert.match(middlewareFile, /supabase\.auth\.getUser\(\)/);
 assert.match(middlewareFile, /supabaseResponse\.cookies\.set/);
 assert.match(middlewareFile, /export function middleware\(request: NextRequest\)/);
 assert.match(middlewareFile, /return proxy\(request\)/);
 assert.match(middlewareFile, /api\|_next\/static\|_next\/image\|favicon\.ico/);
 assert.match(middlewareFile, /svg\|png\|jpg\|jpeg\|gif\|webp/);
});

test('invoice parser uses stable Gemini model and surfaces unavailable model errors', () => {
 assert.match(invoiceParser, /INVOICE_PARSER_MODEL = "gemini-2\.5-flash"/);
 assert.doesNotMatch(invoiceParser, /gemini-2\.5-flash-preview-04-17/);
 assert.match(invoiceParser, /isGeminiModelUnavailableError/);
 assert.match(invoiceParser, /Gemini factuurparser-model niet beschikbaar/);
 assert.match(convertRoute, /Gemini factuurparser-model niet beschikbaar/);
 assert.match(convertRoute, /status: 502/);
});

test('legacy duplicate Mollie webhook re-export and fix script are removed', () => {
 assert.equal(existsSync(new URL('../app/api/webhooks/mollie/route.ts', import.meta.url)), false);
 assert.equal(existsSync(new URL('../fix_page.py', import.meta.url)), false);
});

test('send credit bundles replace Compleet while monitoring tiers stay configured', () => {
 assert.match(plans, /PlanId = "free" \| "monitoring" \| "monitoring_accountant"/);
 assert.match(plans, /CreditBundleId = "send_credits_10" \| "send_credits_25" \| "send_credits_50"/);
 assert.doesNotMatch(plans, /\bcompleet\b/i);
 assert.match(plans, /free:\s*{[\s\S]*3 gratis UBL-generaties bij registratie/);
 assert.match(plans, /free:\s*{[\s\S]*Geen Peppol-verzending inbegrepen/);
 assert.match(plans, /send_credits_10:\s*{[\s\S]*amount:\s*"9\.00"/);
 assert.match(plans, /send_credits_25:\s*{[\s\S]*amount:\s*"19\.00"/);
 assert.match(plans, /send_credits_50:\s*{[\s\S]*amount:\s*"34\.00"/);
 assert.match(plans, /validMonths:\s*12/);
 assert.doesNotMatch(plans, /includedSends|extraSendPrice/);
 assert.match(plans, /monitoring:\s*{[\s\S]*amount:\s*"9\.00"/);
 assert.match(plans, /monitoring:\s*{[\s\S]*recurring:\s*true/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*amount:\s*"39\.00"/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*recurring:\s*true/);
});

test('send credit bundles are available for checkout and no longer shown as coming soon', () => {
 const pricingPage = readFileSync(new URL('../app/prijzen/page.tsx', import.meta.url), 'utf8');
 const upgradePage = readFileSync(new URL('../app/upgrade/page.tsx', import.meta.url), 'utf8');
 const homePage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
 assert.match(checkoutRoute, /product\.available === false/);
 assert.match(plans, /send_credits_10:\s*{[\s\S]*available:\s*true/);
 assert.match(plans, /send_credits_25:\s*{[\s\S]*available:\s*true/);
 assert.match(plans, /send_credits_50:\s*{[\s\S]*available:\s*true/);
 assert.match(plans, /publicPricingPlans/);
 assert.doesNotMatch(plans, /Verzenden 25|Verzenden 100|includedSends|extraSendPrice/);
 assert.doesNotMatch(constants, /export const PRICING/);
 assert.match(homePage, /publicPricingPlans/);
 assert.match(pricingPage, /publicPricingPlans/);
 assert.match(pricingPage, /Alle getoonde prijzen zijn incl\. btw/);
 assert.match(pricingPage, /className="pricing-card-cta"/);
 assert.match(pricingPage, /className="pricing-badge"/);
 assert.match(pricingPage, /isLimitation \? "—" : "✓"/);
 assert.doesNotMatch(pricingPage, /plan\.highlight\s*\?\s*\{ background: `linear-gradient/);
 assert.match(upgradePage, /creditBundles/);
 assert.doesNotMatch(`${constants}\n${pricingPage}\n${upgradePage}\n${homePage}\n${layout}\n${peppolSendPage}`, /verzend(?:en|ing|bundels)?[^\n.]{0,80}binnenkort|binnenkort[^\n.]{0,80}verzend/i);
 assert.doesNotMatch(`${pricingPage}\n${upgradePage}`, /Peppol-verzending wordt binnenkort geactiveerd\. UBL genereren en downloaden werkt nu al\./);
 assert.doesNotMatch(`${pricingPage}\n${upgradePage}\n${homePage}`, /Losse verzending: €1,95 per factuur/);
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

test('cron monitoring check waits at least 600ms between Peppol Directory calls', () => {
 const delay = Number(cronRoute.match(/const DIRECTORY_REQUEST_DELAY_MS = (\d+)/)?.[1] || 0);
 assert.ok(delay >= 600);
 assert.match(cronRoute, /function sleep\(ms: number\)[\s\S]*setTimeout\(resolve, ms\)/);
 assert.match(cronRoute, /let directoryChecksStarted = 0/);
 assert.match(cronRoute, /if \(directoryChecksStarted > 0\) await sleep\(DIRECTORY_REQUEST_DELAY_MS\);[\s\S]*directoryChecksStarted \+= 1;[\s\S]*const result = await checkDirectory\(target\)/);
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

test('free plan users cannot access monitoring operations endpoints or tabs while invite acceptance remains open', () => {
 for (const route of [apiKeysRoute, webhookRoute]) {
  assert.match(route, /assertMonitoringAccess\(user\.id\)/);
  assert.match(route, /status: 403/);
 }
 const membersGet = accountMembersRoute.match(/export async function GET\(\)[\s\S]*?\n}\n/)?.[0] || '';
 const membersPost = accountMembersRoute.match(/export async function POST\([\s\S]*?\n}\n/)?.[0] || '';
 const membersPatch = accountMembersRoute.match(/export async function PATCH\([\s\S]*?\n}\n/)?.[0] || '';
 assert.match(membersGet, /assertMonitoringAccess\(user\.id\)/);
 assert.match(membersGet, /status: 403/);
 assert.match(membersPost, /assertMonitoringAccess\(user\.id\)/);
 assert.match(membersPost, /status: 403/);
 assert.doesNotMatch(membersPatch, /assertMonitoringAccess\(user\.id\)/);
 assert.doesNotMatch(membersPatch, /status: 403/);
 assert.match(membersPatch, /status: "accepted"/);
 assert.match(dashboard, /Upgrade nodig/);
 assert.match(dashboard, /Bewaking van Peppol-registraties en signalen — vanaf €9\/mnd\./);
 assert.match(dashboard, /Team en API & Webhooks zijn beschikbaar in het Monitoring-plan/);
 assert.match(dashboard, /\{!isMonitoring \? \(/);
});

test('retention cleanup deletes old monitoring events and expires pending invites without retaining email PII', () => {
 assert.match(migration0006, /monitoring-events.*12 months|12 maanden|Monitoring event history is retained for 12 months/is);
 assert.match(migration0006, /alter table public\.account_members[\s\S]*status text/);
 assert.match(migration0006, /alter table public\.account_members[\s\S]*invite_email drop not null/);
 assert.match(cleanupRoute, /from\("monitoring_events"\)[\s\S]*\.delete\(\{ count: "exact" \}\)[\s\S]*\.lt\("created_at", eventCutoff\)/);
 assert.match(cleanupRoute, /from\("account_members"\)[\s\S]*status: "expired", invite_email: null/);
 assert.match(cleanupRoute, /Bearer \$\{secret\}/);
});

test('retention cleanup removes uploaded conversion PDFs after 14 days based on conversion created_at', () => {
 assert.match(conversionPdfRetentionLib, /CONVERSION_PDF_RETENTION_DAYS = 14/);
 assert.match(conversionPdfRetentionLib, /`\$\{conversion\.user_id\}\/\$\{conversion\.id\}\.pdf`/);
 assert.match(migration0013, /alter table public\.conversions[\s\S]*pdf_deleted_at timestamptz/);
 assert.match(migration0013, /conversions_pdf_retention_idx[\s\S]*where pdf_deleted_at is null/);
 assert.match(cleanupRoute, /conversionPdfRetentionCutoff\(\)/);
 assert.match(cleanupRoute, /from\("conversions"\)[\s\S]*select\("id, user_id, created_at"\)[\s\S]*\.lt\("created_at", conversionPdfCutoff\)[\s\S]*\.is\("pdf_deleted_at", null\)/);
 assert.match(cleanupRoute, /storage\.from\("invoices"\)\.remove\(conversionPdfPaths\)/);
 assert.match(cleanupRoute, /update\(\{ pdf_deleted_at: new Date\(\)\.toISOString\(\) \}\)/);
 assert.match(cleanupRoute, /conversionPdfs: "14 dagen na conversie"/);
 const conversionCleanupBlock = cleanupRoute.match(/from\("conversions"\)[\s\S]*?storage\.from\("invoices"\)\.remove\(conversionPdfPaths\)/)?.[0] || '';
 assert.doesNotMatch(conversionCleanupBlock, /\.eq\("status"|status:\s*"failed"|status:\s*"success"/);
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
 assert.match(mollieLib, /locale: "nl_NL"/);
 assert.match(checkoutRoute, /createCustomer/);
 assert.match(checkoutRoute, /sequenceType: "first"/);
 assert.match(checkoutRoute, /type: "subscription_first"/);
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
 assert.match(migration0016, /invoice_kind in \('sales','subscription','credits','credit'\)/);
 assert.match(migration0008, /original_invoice_number text/);
 assert.match(migration0008, /create table if not exists public\.webhook_events/);
 assert.match(migration0008, /event_key text not null unique/);
 assert.match(migration0008, /status text not null default 'processing' check \(status in \('processing','processed','failed'\)\)/);
});

test('paid subscription payments create invoices and refunds create separate credit invoices', () => {
 assert.match(billingLib, /export async function ensurePaymentInvoice/);
 assert.match(billingLib, /if \(!product\.paid\) return null/);
 assert.doesNotMatch(billingLib, /isMonitoringPlan/);
 assert.match(billingLib, /invoice_kind: product\.recurring \? "subscription" : "credits"/);
 assert.match(billingLib, /next_billing_invoice_number/);
 assert.match(billingLib, /export async function ensureCreditInvoice/);
 assert.match(billingLib, /invoice_kind: "credit"/);
 assert.match(billingLib, /original_invoice_number/);
 assert.match(mollieWebhookRoute, /ensurePaymentInvoice/);
 assert.match(mollieWebhookRoute, /ensureCreditInvoice/);
});

test('paid and credit billing invoices are emailed with generated PDF attachments', () => {
 assert.match(billingLib, /sendBillingInvoiceEmail/);
 assert.match(billingLib, /generateBillingInvoicePdf/);
 assert.match(billingLib, /subject: `Factuur \$\{invoice\.invoice_number\} — PeppolPro`/);
 assert.match(billingLib, /attachment:\s*\[\s*\{\s*content: Buffer\.from\(pdf\)\.toString\("base64"\)/);
 assert.match(billingLib, /name: `\$\{invoice\.invoice_number \|\| "factuur"\}\.pdf`/);
 assert.match(billingLib, /await sendBillingInvoiceEmail\(supabase, invoice\.id\)/);
 assert.match(billingLib, /await sendBillingInvoiceEmail\(supabase, creditInvoice\.id\)/);
 assert.match(mollieWebhookRoute, /await ensurePaymentInvoice\(\{ supabase, payment, paymentRow, subscription \}\)/);
 assert.match(mollieWebhookRoute, /await ensureCreditInvoice\(\{ supabase, payment, paymentRow, subscription \}\)/);
});

test('monitoring paid plans start a Mollie recurring subscription and invoice flow while credit bundles stay one-off', () => {
 assert.match(plans, /send_credits_25:\s*{[\s\S]*?paid: true,/);
 assert.match(plans, /send_credits_50:\s*{[\s\S]*?paid: true,/);
 assert.match(plans, /monitoring:\s*{[\s\S]*?paid: true,/);
 assert.match(plans, /monitoring_accountant:\s*{[\s\S]*?paid: true,/);
 assert.match(checkoutRoute, /if \(!isMonitoringPlan\(product\.id\)\)/);
 assert.match(checkoutRoute, /if \(isCreditBundle\(product\.id\)\)/);
 assert.match(checkoutRoute, /sequenceType: "first"/);
 assert.match(checkoutRoute, /subscription_flow: "recurring_first_payment"/);
 assert.match(checkoutRoute, /from\("subscriptions"\)\.upsert/);
 assert.match(mollieWebhookRoute, /!planConfig\.paid \|\| !planConfig\.recurring/);
 assert.doesNotMatch(mollieWebhookRoute, /if \(!isMonitoringPlan\(planConfig\.id\)\)[\s\S]*return NextResponse\.json\(\{ ok: true \}\)/);
 assert.match(mollieWebhookRoute, /await ensureRecurringSubscription\(\{ supabase, payment, userId, plan: planConfig\.id/);
 assert.match(mollieWebhookRoute, /await ensurePaymentInvoice\(\{ supabase, payment, paymentRow, subscription \}\)/);
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

test('dashboard lists only the signed-in users billing invoices with download links', () => {
 assert.match(dashboardPage, /from\("invoices"\)/);
 assert.match(dashboardPage, /select\("id, invoice_number, invoice_date, issued_at, currency, total_incl, amount, invoice_kind"\)/);
 assert.match(dashboardPage, /\.eq\("user_id", user\.id\)/);
 const billingInvoiceQuery = dashboardPage.match(/const \{ data: billingInvoicesData \} = await supabase[\s\S]*?\.limit\(50\);/)?.[0] || '';
 assert.match(billingInvoiceQuery, /from\("invoices"\)/);
 assert.match(billingInvoiceQuery, /\.eq\("user_id", user\.id\)/);
 assert.doesNotMatch(billingInvoiceQuery, /monitoringOwnerId/);
 assert.match(dashboard, /export type BillingInvoice/);
 assert.match(dashboard, /billingInvoices: BillingInvoice\[\]/);
 assert.match(dashboard, /<h2 style=\{\{ margin: 0, fontSize: 18, fontWeight: 900 \}\}>Facturen<\/h2>/);
 assert.match(dashboard, /billingInvoices\.map/);
 assert.match(dashboard, /href=\{`\/api\/invoices\/\$\{invoice\.id\}`\}/);
 assert.match(dashboard, />Download<\/a>/);
});

test('mollie webhook records idempotency events and reclaims stale processing rows', () => {
 assert.match(mollieWebhookRoute, /startWebhook/);
 assert.match(mollieWebhookRoute, /eventKey = `\$\{payment\.id\}:\$\{payment\.status\}`/);
 assert.match(mollieWebhookRoute, /rpc\("claim_mollie_webhook_event"/);
 assert.match(mollieWebhookRoute, /p_processing_stale_after: "2 minutes"/);
 assert.match(mollieWebhookRoute, /processed_duplicate/);
 assert.match(mollieWebhookRoute, /processing_duplicate/);
 assert.match(mollieWebhookRoute, /reclaimed/);
 assert.match(migration0018, /create or replace function public\.claim_mollie_webhook_event/);
 assert.match(migration0018, /v_existing\.status = 'processed'/);
 assert.match(migration0018, /v_existing\.status = 'failed'/);
 assert.match(migration0018, /v_existing\.status = 'processing'[\s\S]*now\(\) - p_processing_stale_after/);
 assert.match(migration0018, /set status = 'processing'/);
 assert.match(mollieWebhookRoute, /markWebhook\(supabase, eventKey, "processed"\)/);
 assert.match(mollieWebhookRoute, /markWebhook\(supabase, eventKey, "failed", message\)/);
 assert.match(mollieWebhookRoute, /failed_preprocess/);
});

test('dashboard uses honest UBL statuses and shows generated UBL count instead of amount', () => {
 assert.match(dashboard, /UBL gegenereerd/);
 assert.match(dashboard, /value=\{String\(generatedCount\)\}/);
 assert.doesNotMatch(dashboard, /value=\{formatCurrency\(generatedAmount/);
assert.match(dashboard, /Download XML/);
 assert.match(dashboard, /function handleDashboardSend/);
 assert.match(dashboard, /fetch\("\/api\/recommand\/send"/);
 assert.doesNotMatch(dashboard, /Verzenden via Nieuwe factuur/);
 assert.doesNotMatch(dashboard, /Direct verzenden niet beschikbaar/);
 assert.doesNotMatch(dashboard, /href="\/dashboard" className="action-link">Bekijken/);
 assert.match(dashboard, /as4_received: \{ label: "Afgeleverd"/);
 assert.doesNotMatch(dashboard, /delivered: \{ label: "Afgeleverd"/);
 assert.doesNotMatch(dashboard, /Opnieuw verzenden/);
});

test('duplicate voided conversions are archived out of active dashboard metrics and lists', () => {
 assert.match(dashboard, /duplicate_voided: \{ label: "Vervallen \(dubbel\)"/);
 assert.match(dashboard, /const archivedStatuses = \["duplicate_voided"\]/);
 assert.match(dashboard, /const isArchived = \(status\?: string \| null\) => archivedStatuses\.includes/);
 assert.match(dashboard, /const activeConversions = useMemo\(\(\) => localConversions\.filter\(\(conversion\) => !isArchived\(effectiveStatus\(conversion\)\)\)/);
 assert.match(dashboard, /activeConversions\.reduce\(\(sum, conversion\) => sum \+ \(isOpen\(effectiveStatus\(conversion\)\)/);
 assert.match(dashboard, /activeConversions\.filter\(\(conversion\) => isGenerated\(effectiveStatus\(conversion\)\)\)/);
 assert.match(dashboard, /activeConversions\.filter\(\(conversion\) => isDraft\(effectiveStatus\(conversion\)\)/);
 assert.match(dashboard, /activeConversions\.slice\(0, 8\)/);
 assert.match(dashboard, /activeConversions\.length\} actief in archief/);
 assert.doesNotMatch(dashboard, /openStatuses = \[[^\]]*duplicate_voided/);
});

test('Recommand send route refuses duplicate voided targets before provider calls or credit reservation', () => {
 assert.match(recommandRoute, /function isVoidedDuplicate/);
 assert.match(recommandRoute, /recommand_status === "duplicate_voided"/);
 assert.match(recommandRoute, /if \(isVoidedDuplicate\(existing\)\) return jsonError\("Deze factuur is gemarkeerd als dubbel\/voided/);
 assert.match(recommandRoute, /recommand_status\.neq\.duplicate_voided/);
 assert.match(recommandRoute, /if \(hasCompletedSend\(existing\)\) return existingSendResponse\(existing\)/);
 assert.ok(recommandRoute.indexOf('if (isVoidedDuplicate(existing))') < recommandRoute.indexOf('let recipient = normalizePeppolId'));
 assert.ok(recommandRoute.indexOf('if (isVoidedDuplicate(existing))') < recommandRoute.indexOf('const reserved = await reserveSendCredit'));
});

test('dashboard keeps Peppol Inbox notice only in action points without upgrade plan button', () => {
 assert.match(dashboard, /tasks\.push\(\{ title: "Peppol Inbox nog niet beschikbaar"/);
 assert.doesNotMatch(dashboard, /<h2 style=\{\{ margin: 0, fontSize: 18, fontWeight: 900 \}\}>Peppol Inbox<\/h2>/);
 assert.doesNotMatch(dashboard, /Bekijk plannen/);
});

test('Recommand integration verifies recipients before send, gates plan limit, and stores raw responses', () => {
 assert.match(recommandLib, /Buffer\.from\(`\$\{apiKey\}:\$\{apiSecret\}`\)\.toString\("base64"\)/);
 assert.match(recommandLib, /export async function createCompany\(payload: RecommandCompanyPayload\)/);
 assert.match(recommandLib, /enterpriseNumberScheme: normalizeEnterpriseNumberScheme\(payload\.country, payload\.enterpriseNumberScheme\)/);
 assert.match(recommandLib, /isSmpRecipient: false/);
 assert.match(recommandLib, /export async function getCompany\(companyId: string\)/);
 assert.match(recommandLib, /\/companies\/\$\{encodeURIComponent\(companyId\)\}/);
 assert.match(recommandLib, /export async function verifyRecipient\(peppolId: string\)/);
 assert.match(recommandLib, /\/verify/);
 assert.match(recommandLib, /export async function sendDocument\(companyId: string, payload/);
 assert.match(recommandLib, /\/send/);
 assert.match(recommandLib, /export async function getDocumentStatus\(documentId: string\)/);
 assert.match(recommandLib, /\/documents\/\$\{encodeURIComponent\(documentId\)\}/);
 assert.match(recommandRoute, /validateRecommandInvoiceDocument\(document\)/);
 assert.match(recommandRoute, /Verzenden is geblokkeerd: vul de ontbrekende factuurgegevens aan/);
 assert.match(recommandRoute, /recommand_company_id, recommand_verified/);
 assert.match(recommandRoute, /profile\.recommand_company_id/);
 assert.doesNotMatch(recommandRoute, /process\.env\.RECOMMAND_COMPANY_ID/);
 assert.match(recommandRoute, /rpc\("reserve_send_credit"/);
 assert.match(recommandRoute, /sent_via_recommand_at/);
 assert.match(recommandRoute, /Je hebt geen geldig verzendtegoed/);
 assert.match(recommandRoute, /verifyRecipient\(recipient\)/);
 assert.match(recommandRoute, /verifyRecipientSupportsInvoice\(recipient\)/);
 assert.match(recommandRoute, /recipient_not_found/);
 assert.match(recommandRoute, /recommand_raw_response: \{ verify: verify\.raw, verifyDocumentSupport: support\.raw, send: send\.raw, documents: status \}/);
 assert.match(recommandInvoice, /validateRecommandInvoiceData/);
 assert.match(recommandInvoice, /Klant: postcode ontbreekt/);
 assert.doesNotMatch(recommandInvoice, /postalZone: .*\|\|/);
 assert.match(migration0011, /recommand_document_id text/);
 assert.match(migration0011, /recommand_status text/);
 assert.match(migration0011, /recommand_raw_response jsonb/);
 assert.match(migration0011, /verified_recipient boolean not null default false/);
 assert.match(migration0011, /sent_via_recommand_at timestamptz/);
});

test('Recommand webhook logs idempotent events and preserves verification on failed statuses', () => {
 assert.match(recommandWebhookLib, /recommandWebhookEventKey/);
 assert.match(recommandWebhookLib, /eventId, payload\.event_id, payload\.id/);
 assert.match(recommandWebhookLib, /hashRecommandWebhookRawBody\(`\$\{rawBody\}:\$\{companyId\}:\$\{status\}`\)/);
 assert.match(recommandWebhookLib, /Failed\/rejected trekt verificatie niet terug/);
 assert.doesNotMatch(recommandWebhookLib, /recommand_verified\s*=\s*false/);
 assert.match(recommandWebhookRoute, /from\("recommand_webhook_events"\)/);
 assert.match(recommandWebhookRoute, /upsert\(eventRow, \{ onConflict: "event_key", ignoreDuplicates: true \}\)/);
 assert.match(recommandWebhookRoute, /processing_status: "processed"/);
 assert.match(migration0018, /create table if not exists public\.recommand_webhook_events/);
 assert.match(migration0018, /event_key text not null unique/);
 assert.match(migration0018, /raw_body_hash text not null/);
 assert.match(migration0018, /alter table public\.recommand_webhook_events enable row level security/);
});

test('server-only webhook tables revoke anon and authenticated grants', () => {
 assert.match(migration0018, /revoke all on table public\.webhook_events from anon, authenticated/);
 assert.match(migration0018, /revoke all on table public\.recommand_webhook_events from anon, authenticated/);
 assert.match(migration0018, /grant all on table public\.recommand_webhook_events to service_role/);
});

test('billing table grants are least-privilege for app access paths', () => {
 assert.match(migration0020, /revoke all on table public\.payments from anon, authenticated/);
 assert.match(migration0020, /revoke all on table public\.send_credit_purchases from anon, authenticated/);
 assert.match(migration0020, /revoke all on table public\.subscriptions from anon, authenticated/);
 assert.match(migration0020, /grant select on table public\.subscriptions to authenticated/);
 assert.match(migration0020, /create policy "read own subscriptions"/);
 assert.match(dashboardPage, /from\("subscriptions"\)/);
 assert.match(cancelSubscriptionRoute, /from\("subscriptions"\)/);
 assert.match(monitoringAccess, /from\("subscriptions"\)/);
 assert.doesNotMatch(`${dashboardPage}\n${cancelSubscriptionRoute}\n${monitoringAccess}`, /from\("payments"\)|from\("send_credit_purchases"\)/);
});

test('Recommand company registration is send-only, idempotent, persisted and status-refreshable', () => {
 assert.doesNotMatch(migration0014, /recommand_company_id text/);
 assert.doesNotMatch(migration0014, /recommand_verified boolean/);
 assert.doesNotMatch(migration0014, /postal_code text/);
 assert.doesNotMatch(migration0014, /city text/);
 assert.match(migration0014, /add column if not exists recommand_verification_url text/);
 assert.match(migration0014, /add column if not exists recommand_raw_response jsonb/);
 assert.match(recommandCompanyRoute, /auth\.getUser\(\)/);
 assert.match(recommandCompanyRoute, /if \(!user\)/);
 assert.match(recommandCompanyRoute, /postal_code, city, recommand_company_id/);
 assert.match(recommandCompanyRoute, /profile\.recommand_company_id/);
 assert.match(recommandCompanyRoute, /idempotent: true/);
 assert.match(recommandCompanyRoute, /missingRequiredCompanyFields/);
 for (const field of ["bedrijfsnaam", "KvK-nummer", "btw-nummer", "adres", "postcode", "plaats"]) {
  assert.match(recommandCompanyValidation, new RegExp(field));
 }
 assert.match(recommandCompanyRoute, /enterpriseNumberScheme\(profile\.country\)/);
 assert.match(recommandCompanyRoute, /isSmpRecipient: false/);
 assert.match(recommandCompanyRoute, /recommand_company_id: result\.companyId/);
 assert.match(recommandCompanyRoute, /recommand_verification_url: result\.verificationUrl/);
 assert.match(recommandCompanyRoute, /recommand_raw_response: rawResponse/);
 assert.match(recommandCompanyStatusRoute, /getCompany\(profile\.recommand_company_id\)/);
 assert.match(recommandCompanyStatusRoute, /recommand_verified: result\.isVerified/);
 assert.match(recommandCompanyStatusRoute, /getCompany: result\.raw/);
 assert.match(dashboard, /Peppol-verzending activeren/);
 assert.match(dashboard, /Activeer verzenden/);
 assert.match(dashboard, /Ik heb geverifieerd/);
 assert.match(dashboard, /Verzenden actief/);
});

test('Recommand company route blocks each required profile field before provider create', () => {
 for (const required of [
  'company_name?.trim()',
  'kvk_kbo?.trim()',
  'btw_nr?.trim()',
  'address?.trim()',
  'postal_code?.trim()',
  'city?.trim()',
 ]) {
  assert.match(recommandCompanyValidation, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
 }
 const validationBlock = recommandCompanyRoute.match(/const missing = missingRequiredCompanyFields\(profile\);[\s\S]*?if \(missing\.length > 0\)[\s\S]*?\n }/)?.[0] || '';
 assert.match(validationBlock, /400/);
 assert.doesNotMatch(validationBlock, /createCompany\(/);
});

test('Recommand company creation is idempotent before provider create', () => {
 const idempotencyBlock = recommandCompanyRoute.match(/if \(!shouldCreateRecommandCompany\(profile\)\) \{[\s\S]*?\n \}/)?.[0] || '';
 assert.match(idempotencyBlock, /idempotent: true/);
 assert.doesNotMatch(idempotencyBlock, /createCompany\(/);
});

test('Recommand verification webhook verifies raw-body HMAC and rejects invalid signatures before DB writes', () => {
 assert.match(recommandWebhookRoute, /await req\.text\(\)/);
 assert.match(recommandWebhookRoute, /RECOMMAND_WEBHOOK_SECRET/);
 assert.match(recommandWebhookLib, /createHmac\("sha256", secret\)\.update\(rawBody, "utf8"\)\.digest\("hex"\)/);
 assert.match(recommandWebhookLib, /timingSafeEqual\(provided, expected\)/);
 assert.doesNotMatch(recommandWebhookLib, /signatureHeader\s*={2,3}/);
 assert.doesNotMatch(recommandWebhookLib, /providedHex\s*={2,3}\s*expectedHex/);
 const invalidSignatureBlock = recommandWebhookRoute.match(/if \(!verifyRecommandWebhookSignature\(rawBody, signature, secret\)\) \{[\s\S]*?\n  \}/)?.[0] || '';
 assert.match(invalidSignatureBlock, /401/);
 assert.doesNotMatch(invalidSignatureBlock, /from\("user_profiles"\)/);
});

test('Recommand verification webhook marks matching company verified on valid verified event', () => {
 assert.match(recommandWebhookLib, /payload\.eventType !== "company\.verification"/);
 assert.match(recommandWebhookLib, /payload\.companyId\.startsWith\("c_"\)/);
 assert.match(recommandWebhookLib, /payload\.status === "verified"/);
 assert.match(recommandWebhookLib, /updatePayload\.recommand_verified = true/);
 assert.match(recommandWebhookRoute, /from\("user_profiles"\)[\s\S]*\.update\(update\.updatePayload\)[\s\S]*\.eq\("recommand_company_id", update\.companyId\)/);
});

test('dashboard does not silently hide invoices when conversion query fails', () => {
 assert.match(dashboardPage, /error: conversionsError/);
 assert.match(dashboardPage, /conversionsErrorMessage/);
 assert.match(dashboardPage, /Factuurhistorie kon niet worden geladen/);
 assert.match(dashboardPage, /conversionsError=\{conversionsErrorMessage\}/);
 assert.match(dashboard, /conversionsError\?: string \| null/);
 assert.match(dashboard, /\{conversionsError\}/);
});



test('generate API requires an authenticated user before producing UBL', () => {
 assert.match(generateRoute, /if \(!user\) \{/);
 assert.match(generateRoute, /status: 401/);
 assert.match(generateRoute, /Niet ingelogd/);
 assert.doesNotMatch(generateRoute, /if \(user\) \{[\s\S]*from\("conversions"\)\.insert/);
});

test('new invoice flow requires and stores customer email and can send only after company verification', () => {
 assert.match(migration0012, /alter table public\.conversions[\s\S]*add column if not exists customer_email text/i);
 assert.match(ublGenerator, /customerEmail: string/);
 assert.match(ublGenerator, /supplierPostalCode\?: string/);
 assert.match(ublGenerator, /customerPostalCode\?: string/);
 assert.match(ublValidator, /Klant: e-mailadres ontvanger ontbreekt/);
 assert.match(ublValidator, /Klant: e-mailadres ontvanger is ongeldig/);
 assert.match(nieuwPage, /const \[customerEmail, setCustomerEmail\] = useState\(""\)/);
 assert.match(nieuwPage, /const \[customerPostalCode, setCustomerPostalCode\] = useState\(""\)/);
 assert.match(nieuwPage, /const \[supplierPostalCode, setSupplierPostalCode\] = useState\(""\)/);
 assert.match(nieuwPage, /recommandVerified/);
 assert.match(nieuwPage, /dashboard#peppol-verzending/);
 assert.match(nieuwPage, /Verifieer eerst je bedrijf/);
 assert.match(nieuwPage, /Koop verzendbundel/);
 assert.match(nieuwPage, /Je bedrijf is geverifieerd, maar je hebt nog geen verzendtegoed/);
 assert.doesNotMatch(nieuwPage, /Verzenden 25|Verzenden 100/);
 assert.match(nieuwPage, /quantityField\(\"Aantal\", line\)/);
 assert.doesNotMatch(nieuwPage, /Number\(value\).*quantity/);
 assert.match(nieuwPage, /fetch\("\/api\/recommand\/send"/);
 assert.match(nieuwPage, /buildRecommandPayloadFromUbl\(xml\)/);
 assert.match(nieuwPage, /buildInvoicePreviewFromPayload\(payload\.recipient, payload\.document/);
 assert.match(nieuwPage, /body: JSON\.stringify\(\{ conversionId \}\)/);
 assert.doesNotMatch(nieuwPage, /buildRecommandInvoiceDocument\(data\)/);
 assert.doesNotMatch(nieuwPage, /deriveRecommandRecipient\(data\)/);
 assert.match(nieuwPage, /conversionId/);
 assert.match(nieuwPage, /customerEmail/);
 assert.match(generateRoute, /customer_email: invoiceData\.customerEmail\.trim\(\)/);
 assert.match(generateRoute, /conversionId: conversion\.id/);
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
 assert.match(onboardingPage, /address: address\.trim\(\)/);
 assert.match(onboardingPage, /postal_code: postalCode\.trim\(\)/);
 assert.match(onboardingPage, /city: city\.trim\(\)/);
 assert.match(onboardingPage, /Postcode \*/);
 assert.match(onboardingPage, /Plaats \*/);
 assert.doesNotMatch(onboardingPage, /kvk_number:\s*/);
 assert.doesNotMatch(onboardingPage, /kbo_number:\s*/);
 assert.doesNotMatch(onboardingPage, /btw_number:\s*/);
});

test('payments upsert has a real unique constraint for mollie_payment_id', () => {
 assert.match(migration0009, /alter table public\.payments[\s\S]*add constraint payments_mollie_payment_id_key[\s\S]*unique \(mollie_payment_id\)/i);
 assert.match(checkoutRoute, /onConflict: "mollie_payment_id"/);
 assert.match(mollieWebhookRoute, /onConflict: "mollie_payment_id"/);
});
