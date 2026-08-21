import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureCreditInvoice, ensurePaymentInvoice } from "@/lib/billing";
import { cancelSubscription, createSubscription, getPayment, getSubscription, MolliePayment, MollieSubscription } from "@/lib/mollie";
import { getCreditBundle, getPlan } from "@/lib/plans";

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

function periodEndFromSubscription(subscription?: MollieSubscription | null) {
 if (subscription?.nextPaymentDate) return new Date(subscription.nextPaymentDate).toISOString();
 return addMonths(new Date(), 1).toISOString();
}

function paymentType(payment: MolliePayment) {
 if (payment.status === "refunded") return "refund";
 if (payment.status === "charged_back") return "chargeback";
 if (payment.subscriptionId) return "subscription_renewal";
 return "subscription_first";
}

async function setFree(supabase: ReturnType<typeof createAdminClient>, userId: string, subscriptionStatus: "canceled" | "suspended" | "expired") {
 await supabase.from("user_profiles").update({ plan: "free" }).eq("id", userId);
 await supabase.from("subscriptions").update({ subscription_status: subscriptionStatus, cancel_at_period_end: false, updated_at: new Date().toISOString() }).eq("user_id", userId);
}

async function markWebhook(supabase: ReturnType<typeof createAdminClient>, eventKey: string, status: "processed" | "failed", errorMessage?: string) {
 await supabase.from("webhook_events").update({ status, error_message: errorMessage || null, processed_at: new Date().toISOString() }).eq("event_key", eventKey);
}

async function startWebhook(supabase: ReturnType<typeof createAdminClient>, payment: MolliePayment) {
 const eventKey = `${payment.id}:${payment.status}`;
 const { data, error } = await supabase
  .from("webhook_events")
  .insert({ event_key: eventKey, mollie_payment_id: payment.id, payment_status: payment.status, status: "processing" })
  .select("event_key")
  .maybeSingle();
 if (error?.code === "23505") return { eventKey, duplicate: true };
 if (error) throw error;
 if (!data) return { eventKey, duplicate: true };
 return { eventKey, duplicate: false };
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
 if (!customerId || !planConfig.paid || !planConfig.recurring) return null;
 const { data: existing } = await supabase
  .from("subscriptions")
  .select("id, mollie_subscription_id, current_period_end")
  .eq("user_id", userId)
  .maybeSingle();
 if (existing?.mollie_subscription_id) return existing;
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
 const { data: row, error } = await supabase.from("subscriptions").upsert({
  user_id: userId,
  plan: planConfig.id,
  mollie_customer_id: customerId,
  mollie_subscription_id: subscription.id,
  mollie_mandate_id: payment.mandateId || subscription.mandateId || null,
  current_period_start: new Date().toISOString(),
  current_period_end: periodEndFromSubscription(subscription),
  subscription_status: subscription.status === "canceled" || subscription.status === "suspended" ? subscription.status : "active",
  cancel_at_period_end: false,
  last_payment_id: payment.id,
  last_webhook_status: payment.status,
  updated_at: new Date().toISOString(),
 }, { onConflict: "user_id" }).select("id, user_id, plan, mollie_subscription_id").single();
 if (error) throw error;
 return row;
}

async function grantSendCredits({ supabase, userId, bundleId, payment, paymentRow }: {
 supabase: ReturnType<typeof createAdminClient>;
 userId: string;
 bundleId: string;
 payment: MolliePayment;
 paymentRow: { id: string; user_id: string; amount: number | string | null; mollie_payment_id?: string | null; plan?: string | null; status?: string | null };
}) {
 const bundle = getCreditBundle(bundleId);
 if (!bundle || payment.status !== "paid") return null;
 const { data: profile } = await supabase
  .from("user_profiles")
  .select("send_credits_expires_at")
  .eq("id", userId)
  .maybeSingle();
 const now = new Date();
 const currentExpiry = profile?.send_credits_expires_at ? new Date(profile.send_credits_expires_at) : null;
 const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
 const expiresAt = addMonths(start, bundle.validMonths).toISOString();
 const { error: grantError } = await supabase.rpc("grant_send_credit_bundle", {
  p_user_id: userId,
  p_bundle_id: bundle.id,
  p_credits: bundle.credits,
  p_amount: Number(payment.amount?.value || bundle.amount),
  p_payment_id: payment.id,
  p_expires_at: expiresAt,
 });
 if (grantError) throw grantError;
 await ensurePaymentInvoice({ supabase, payment, paymentRow, subscription: null });
 return { credits: bundle.credits, expiresAt };
}

export async function POST(req: NextRequest) {
 const supabase = createAdminClient();
 let eventKey: string | null = null;
 let paymentId: string | null = null;
 try {
  const body = await req.formData();
  paymentId = body.get("id") as string | null;
  if (!paymentId) return NextResponse.json({ ok: false }, { status: 400 });

  const payment = await getPayment(paymentId);
  const event = await startWebhook(supabase, payment);
  eventKey = event.eventKey;
  if (event.duplicate) return NextResponse.json({ ok: true, duplicate: true });

  const { data: existingPayment } = await supabase
   .from("payments")
   .select("id, status, mollie_subscription_id")
   .eq("mollie_payment_id", paymentId)
   .maybeSingle();
  const { user_id: metadataUserId, plan: metadataPlan, bundle_id: metadataBundleId, purchase_type: purchaseType } = payment.metadata || {};
  const userId = metadataUserId;
  const bundle = getCreditBundle(metadataBundleId || metadataPlan);
  const planConfig = getPlan(metadataPlan);
  if (!userId || (!bundle && !planConfig.paid)) {
   await markWebhook(supabase, eventKey, "failed", "Ontbrekende user_id of betaald product in Mollie metadata");
   return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { data: paymentRow, error: paymentError } = await supabase.from("payments").upsert({
   user_id: userId,
   type: bundle ? "credit_purchase" : paymentType(payment),
   mollie_payment_id: payment.id,
   mollie_customer_id: payment.customerId || null,
   mollie_subscription_id: payment.subscriptionId || existingPayment?.mollie_subscription_id || null,
   mollie_mandate_id: payment.mandateId || null,
   amount: payment.amount?.value ? parseFloat(payment.amount.value) : parseFloat(bundle?.amount || planConfig.amount),
   credits: bundle?.credits || 0,
   status: payment.status,
   sequence_type: bundle ? "oneoff" : payment.sequenceType || (payment.subscriptionId ? "recurring" : "first"),
   plan: bundle?.id || planConfig.id,
   metadata: payment.metadata || null,
  }, { onConflict: "mollie_payment_id" }).select("id, user_id, amount, mollie_payment_id, mollie_subscription_id, plan, status").single();
  if (paymentError) throw paymentError;

  if (bundle) {
   if (payment.status === "paid") {
    await grantSendCredits({ supabase, userId, bundleId: bundle.id, payment, paymentRow });
   } else if (payment.status === "refunded" || payment.status === "charged_back") {
    await ensureCreditInvoice({ supabase, payment, paymentRow, subscription: null });
   }
   await markWebhook(supabase, eventKey, "processed");
   return NextResponse.json({ ok: true, purchase_type: purchaseType || "send_credit_bundle" });
  }

  if (payment.status === "refunded" || payment.status === "charged_back") {
   const { data: subscription } = await supabase.from("subscriptions").select("id, user_id, plan").eq("user_id", userId).maybeSingle();
   await ensureCreditInvoice({ supabase, payment, paymentRow, subscription });
   await cancelKnownSubscription(supabase, userId);
   await setFree(supabase, userId, "canceled");
   await markWebhook(supabase, eventKey, "processed");
   return NextResponse.json({ ok: true });
  }

  let mollieSubscription: MollieSubscription | null = null;
  if (payment.subscriptionId && payment.customerId) {
   try {
    mollieSubscription = await getSubscription(payment.customerId, payment.subscriptionId);
    if (mollieSubscription.status === "canceled" || mollieSubscription.status === "suspended") {
     const { data: localSub } = await supabase.from("subscriptions").select("cancel_at_period_end").eq("user_id", userId).maybeSingle();
     if (mollieSubscription.status === "canceled" && localSub?.cancel_at_period_end) {
      await supabase.from("subscriptions").update({ last_payment_id: payment.id, last_webhook_status: payment.status, updated_at: new Date().toISOString() }).eq("user_id", userId);
     } else {
      await setFree(supabase, userId, mollieSubscription.status);
     }
     await markWebhook(supabase, eventKey, "processed");
     return NextResponse.json({ ok: true });
    }
   } catch (err) {
    console.error("Mollie subscription lookup error:", err);
   }
  }

  if (payment.status === "paid") {
   await supabase.from("user_profiles").update({ plan: planConfig.id }).eq("id", userId);
   const ensured = payment.subscriptionId
    ? null
    : await ensureRecurringSubscription({ supabase, payment, userId, plan: planConfig.id, baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://peppolpro.nl" });
   const periodEnd = periodEndFromSubscription(mollieSubscription);
   const { data: subscription, error: subError } = await supabase.from("subscriptions").upsert({
    user_id: userId,
    plan: planConfig.id,
    mollie_customer_id: payment.customerId || null,
    mollie_subscription_id: payment.subscriptionId || ensured?.mollie_subscription_id || null,
    mollie_mandate_id: payment.mandateId || mollieSubscription?.mandateId || null,
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd,
    subscription_status: "active",
    cancel_at_period_end: false,
    last_payment_id: payment.id,
    last_webhook_status: payment.status,
    updated_at: new Date().toISOString(),
   }, { onConflict: "user_id" }).select("id, user_id, plan, mollie_subscription_id").single();
   if (subError) throw subError;
   await ensurePaymentInvoice({ supabase, payment, paymentRow, subscription });
   await markWebhook(supabase, eventKey, "processed");
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
   await markWebhook(supabase, eventKey, "processed");
   return NextResponse.json({ ok: true });
  }

  await markWebhook(supabase, eventKey, "processed");
  return NextResponse.json({ ok: true });
 } catch (err) {
  const message = err instanceof Error ? err.message : "Onbekende webhook fout";
  console.error("Mollie webhook error:", err);
  if (eventKey) {
   await markWebhook(supabase, eventKey, "failed", message);
  } else if (paymentId) {
   await supabase.from("webhook_events").upsert({ event_key: `${paymentId}:failed_preprocess`, mollie_payment_id: paymentId, status: "failed", error_message: message, processed_at: new Date().toISOString() }, { onConflict: "event_key" });
  }
  return NextResponse.json({ error: "Webhook fout" }, { status: 500 });
 }
}
