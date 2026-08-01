import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cancelSubscription, createSubscription, getPayment, getSubscription, MolliePayment } from "@/lib/mollie";
import { getPlan, isMonitoringPlan } from "@/lib/plans";

const GRACE_DAYS = 7;

function createAdminClient() {
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function addMonths(date: Date, months: number) {
 const copy = new Date(date);
 copy.setMonth(copy.getMonth() + months);
 return copy;
}

function addDays(date: Date, days: number) {
 const copy = new Date(date);
 copy.setDate(copy.getDate() + days);
 return copy;
}

function paymentType(payment: MolliePayment) {
 if (payment.status === "refunded") return "refund";
 if (payment.status === "charged_back") return "chargeback";
 if (payment.subscriptionId) return "subscription_renewal";
 return "subscription_first";
}

async function setFree(supabase: ReturnType<typeof createAdminClient>, userId: string, subscriptionStatus: "canceled" | "suspended" | "expired") {
 await supabase.from("user_profiles").update({ plan: "free" }).eq("id", userId);
 await supabase.from("subscriptions").update({ subscription_status: subscriptionStatus, updated_at: new Date().toISOString() }).eq("user_id", userId);
}

async function cancelKnownSubscription(supabase: ReturnType<typeof createAdminClient>, userId: string) {
 const { data: sub } = await supabase
 .from("subscriptions")
 .select("mollie_customer_id, mollie_subscription_id")
 .eq("user_id", userId)
 .maybeSingle();
 if (sub?.mollie_customer_id && sub?.mollie_subscription_id) {
 try { await cancelSubscription(sub.mollie_customer_id, sub.mollie_subscription_id); } catch (err) { console.error("Mollie subscription cancel error:", err); }
 }
}

async function ensureRecurringSubscription({
 supabase,
 payment,
 userId,
 plan,
 baseUrl,
}: {
 supabase: ReturnType<typeof createAdminClient>;
 payment: MolliePayment;
 userId: string;
 plan: string;
 baseUrl: string;
}) {
 const planConfig = getPlan(plan);
 const customerId = payment.customerId;
 if (!customerId || !isMonitoringPlan(planConfig.id)) return null;
 const { data: existing } = await supabase
 .from("subscriptions")
 .select("mollie_subscription_id, current_period_end")
 .eq("user_id", userId)
 .maybeSingle();
 if (existing?.mollie_subscription_id) return existing.mollie_subscription_id as string;
 const firstPeriodEnd = addMonths(new Date(), 1);
 const subscription = await createSubscription({
 customerId,
 amount: planConfig.amount,
 description: planConfig.checkoutDescription,
 webhookUrl: `${baseUrl}/api/mollie/webhook`,
 mandateId: payment.mandateId,
 startDate: firstPeriodEnd.toISOString().slice(0, 10),
 metadata: { user_id: userId, plan: planConfig.id },
 });
 await supabase.from("subscriptions").upsert({
 user_id: userId,
 plan: planConfig.id,
 mollie_customer_id: customerId,
 mollie_subscription_id: subscription.id,
 mollie_mandate_id: payment.mandateId || subscription.mandateId || null,
 current_period_start: new Date().toISOString(),
 current_period_end: firstPeriodEnd.toISOString(),
 subscription_status: subscription.status === "active" ? "active" : "active",
 last_payment_id: payment.id,
 last_webhook_status: payment.status,
 updated_at: new Date().toISOString(),
 }, { onConflict: "user_id" });
 return subscription.id;
}

export async function POST(req: NextRequest) {
 try {
 const body = await req.formData();
 const paymentId = body.get("id") as string | null;
 if (!paymentId) return NextResponse.json({ ok: false }, { status: 400 });

 const payment = await getPayment(paymentId);
 const supabase = createAdminClient();
 const { data: existingPayment } = await supabase
 .from("payments")
 .select("status, mollie_subscription_id")
 .eq("mollie_payment_id", paymentId)
 .maybeSingle();
 const { user_id: metadataUserId, plan: metadataPlan } = payment.metadata || {};
 const userId = metadataUserId;
 const planConfig = getPlan(metadataPlan);
 if (!userId || !planConfig.paid) return NextResponse.json({ ok: false }, { status: 400 });

 await supabase.from("payments").upsert({
 user_id: userId,
 type: paymentType(payment),
 mollie_payment_id: payment.id,
 mollie_customer_id: payment.customerId || null,
 mollie_subscription_id: payment.subscriptionId || existingPayment?.mollie_subscription_id || null,
 mollie_mandate_id: payment.mandateId || null,
 amount: payment.amount?.value ? parseFloat(payment.amount.value) : parseFloat(planConfig.amount),
 credits: 0,
 status: payment.status,
 sequence_type: payment.sequenceType || (payment.subscriptionId ? "recurring" : "first"),
 plan: planConfig.id,
 metadata: payment.metadata || null,
 }, { onConflict: "mollie_payment_id" });

 if (existingPayment?.status === payment.status && existingPayment?.mollie_subscription_id && payment.status === "paid") {
 return NextResponse.json({ ok: true, duplicate: true });
 }

 if (payment.status === "refunded" || payment.status === "charged_back") {
 await cancelKnownSubscription(supabase, userId);
 await setFree(supabase, userId, "canceled");
 return NextResponse.json({ ok: true });
 }

 if (payment.subscriptionId && payment.customerId) {
 try {
 const subscription = await getSubscription(payment.customerId, payment.subscriptionId);
 if (subscription.status === "canceled" || subscription.status === "suspended") {
 await setFree(supabase, userId, subscription.status);
 return NextResponse.json({ ok: true });
 }
 } catch (err) {
 console.error("Mollie subscription lookup error:", err);
 }
 }

 if (payment.status === "paid") {
 await supabase.from("user_profiles").update({ plan: planConfig.id }).eq("id", userId);
 if (!isMonitoringPlan(planConfig.id)) return NextResponse.json({ ok: true });
 const subscriptionId = payment.subscriptionId || await ensureRecurringSubscription({ supabase, payment, userId, plan: planConfig.id, baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://peppolpro.nl" });
 const periodEnd = addMonths(new Date(), 1).toISOString();
 await supabase.from("subscriptions").upsert({
 user_id: userId,
 plan: planConfig.id,
 mollie_customer_id: payment.customerId || null,
 mollie_subscription_id: subscriptionId || payment.subscriptionId || null,
 mollie_mandate_id: payment.mandateId || null,
 current_period_start: new Date().toISOString(),
 current_period_end: periodEnd,
 subscription_status: "active",
 last_payment_id: payment.id,
 last_webhook_status: payment.status,
 updated_at: new Date().toISOString(),
 }, { onConflict: "user_id" });
 return NextResponse.json({ ok: true });
 }

 if (payment.subscriptionId && ["failed", "expired"].includes(payment.status)) {
 await supabase.from("subscriptions").update({
 subscription_status: "active",
 current_period_end: addDays(new Date(), GRACE_DAYS).toISOString(),
 last_payment_id: payment.id,
 last_webhook_status: payment.status,
 updated_at: new Date().toISOString(),
 }).eq("user_id", userId);
 return NextResponse.json({ ok: true });
 }

 return NextResponse.json({ ok: true });
 } catch (err) {
 console.error("Mollie webhook error:", err);
 return NextResponse.json({ error: "Webhook fout" }, { status: 500 });
 }
}
