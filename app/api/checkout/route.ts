import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createPayment } from "@/lib/mollie";
import { getPlan } from "@/lib/plans";

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const { plan } = await req.json();
 const planConfig = getPlan(plan);
 if (!planConfig.paid) return NextResponse.json({ error: "Ongeldig plan" }, { status: 400 });

 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://peppolpro.nl";
 const payment = await createPayment({
 amount: planConfig.amount,
 description: planConfig.checkoutDescription,
 redirectUrl: `${baseUrl}/upgrade/success`,
 webhookUrl: `${baseUrl}/api/mollie/webhook`,
 metadata: {
 user_id: user.id,
 plan: planConfig.id,
 },
 });

 if (!payment.id || !payment._links?.checkout?.href) {
 return NextResponse.json({ error: "Checkout kon niet worden aangemaakt" }, { status: 502 });
 }

 await supabase.from("payments").insert({
 user_id: user.id,
 type: "subscription",
 mollie_payment_id: payment.id,
 amount: parseFloat(planConfig.amount),
 credits: 0,
 status: "open",
 });

 return NextResponse.json({ checkoutUrl: payment._links.checkout.href });
 } catch (err) {
 console.error("Checkout error:", err);
 return NextResponse.json({ error: "Checkout mislukt" }, { status: 500 });
 }
}
