import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createPayment } from "@/lib/mollie";

const PLANS = {
 compleet: { amount: "9.00", credits: 0, label: "PeppolPro Compleet €9/mnd" },
 pro: { amount: "19.00", credits: 0, label: "PeppolPro Pro €19/mnd" },
 accountant: { amount: "49.00", credits: 0, label: "PeppolPro Accountant €49/mnd" },
 credits3: { amount: "3.95", credits: 3, label: "3 Peppol-verzendingen" },
 credits10: { amount: "9.95", credits: 10, label: "10 Peppol-verzendingen" },
};

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const { plan } = await req.json();
 const planConfig = PLANS[plan as keyof typeof PLANS];
 if (!planConfig) return NextResponse.json({ error: "Ongeldig plan" }, { status: 400 });

 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://peppolpro.nl";
 const payment = await createPayment({
 amount: planConfig.amount,
 description: planConfig.label,
 redirectUrl: `${baseUrl}/dashboard?betaald=1`,
 webhookUrl: `${baseUrl}/api/webhooks/mollie`,
 metadata: {
 user_id: user.id,
 plan,
 credits: String(planConfig.credits),
 },
 });

 if (!payment.id || !payment._links?.checkout?.href) {
 return NextResponse.json({ error: "Checkout kon niet worden aangemaakt" }, { status: 502 });
 }

 await supabase.from("payments").insert({
 user_id: user.id,
 type: planConfig.credits > 0 ? "credit_purchase" : "subscription",
 mollie_payment_id: payment.id,
 amount: parseFloat(planConfig.amount),
 credits: planConfig.credits,
 status: "open",
 });

 return NextResponse.json({ checkoutUrl: payment._links.checkout.href });
 } catch (err) {
 console.error("Checkout error:", err);
 return NextResponse.json({ error: "Checkout mislukt" }, { status: 500 });
 }
}
