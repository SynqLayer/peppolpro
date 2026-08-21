import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";
import { createCustomer, createPayment } from "@/lib/mollie";
import { getCheckoutProduct, isCreditBundle, isMonitoringPlan } from "@/lib/plans";

function createAdminClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!url || !serviceKey) throw new Error("Supabase service env ontbreekt");
 return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
 try {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { plan } = await req.json();
  const product = getCheckoutProduct(plan);
  if (!product.paid) return NextResponse.json({ error: "Ongeldig plan of bundel" }, { status: 400 });
  if (product.available === false) return NextResponse.json({ error: "Dit product is binnenkort beschikbaar" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://peppolpro.nl";
  const admin = createAdminClient();
  const { data: profile } = await admin
   .from("user_profiles")
   .select("id, email, company_name")
   .eq("id", user.id)
   .maybeSingle();

  if (isCreditBundle(product.id)) {
   const payment = await createPayment({
    amount: product.amount,
    description: product.checkoutDescription,
    redirectUrl: `${baseUrl}/upgrade/success`,
    webhookUrl: `${baseUrl}/api/mollie/webhook`,
    metadata: {
     user_id: user.id,
     plan: product.id,
     bundle_id: product.id,
     purchase_type: "send_credit_bundle",
    },
   });

   if (!payment.id || !payment._links?.checkout?.href) {
    return NextResponse.json({ error: "Checkout kon niet worden aangemaakt" }, { status: 502 });
   }

   await admin.from("payments").upsert({
    user_id: user.id,
    type: "credit_purchase",
    mollie_payment_id: payment.id,
    mollie_customer_id: null,
    amount: parseFloat(product.amount),
    credits: product.credits,
    status: payment.status || "open",
    sequence_type: "oneoff",
    plan: product.id,
    metadata: payment.metadata || { plan: product.id, purchase_type: "send_credit_bundle" },
   }, { onConflict: "mollie_payment_id" });

   return NextResponse.json({ checkoutUrl: payment._links.checkout.href });
  }

  if (!isMonitoringPlan(product.id)) return NextResponse.json({ error: "Ongeldig abonnement" }, { status: 400 });

  const { data: existingSubscription } = await admin
   .from("subscriptions")
   .select("mollie_customer_id")
   .eq("user_id", user.id)
   .maybeSingle();
  let customerId = existingSubscription?.mollie_customer_id || undefined;
  if (!customerId) {
   const customer = await createCustomer({ email: user.email || profile?.email || "unknown@peppolpro.nl", name: profile?.company_name || user.email || null });
   customerId = customer.id;
  }

  const payment = await createPayment({
   amount: product.amount,
   description: product.checkoutDescription,
   redirectUrl: `${baseUrl}/upgrade/success`,
   webhookUrl: `${baseUrl}/api/mollie/webhook`,
   customerId,
   sequenceType: "first",
   metadata: {
    user_id: user.id,
    plan: product.id,
    purchase_type: "monitoring_subscription",
    subscription_flow: "recurring_first_payment",
   },
  });

  if (!payment.id || !payment._links?.checkout?.href) {
   return NextResponse.json({ error: "Checkout kon niet worden aangemaakt" }, { status: 502 });
  }

  await admin.from("payments").upsert({
   user_id: user.id,
   type: "subscription_first",
   mollie_payment_id: payment.id,
   mollie_customer_id: customerId || payment.customerId || null,
   amount: parseFloat(product.amount),
   credits: 0,
   status: payment.status || "open",
   sequence_type: "first",
   plan: product.id,
   metadata: payment.metadata || { plan: product.id },
  }, { onConflict: "mollie_payment_id" });

  await admin.from("subscriptions").upsert({
   user_id: user.id,
   plan: product.id,
   mollie_customer_id: customerId,
   subscription_status: "pending",
   last_payment_id: payment.id,
   updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return NextResponse.json({ checkoutUrl: payment._links.checkout.href });
 } catch (err) {
  console.error("Checkout error:", err);
  return NextResponse.json({ error: "Checkout mislukt" }, { status: 500 });
 }
}
