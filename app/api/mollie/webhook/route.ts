import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPayment } from "@/lib/mollie";
import { getPlan } from "@/lib/plans";

function createAdminClient() {
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!serviceKey) {
 throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
 }

 return createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 serviceKey,
 { auth: { persistSession: false } }
 );
}

export async function POST(req: NextRequest) {
 try {
 const body = await req.formData();
 const paymentId = body.get("id") as string | null;
 if (!paymentId) return NextResponse.json({ ok: false }, { status: 400 });

 const payment = await getPayment(paymentId);
 const supabase = createAdminClient();

 await supabase
 .from("payments")
 .update({ status: payment.status })
 .eq("mollie_payment_id", paymentId);

 if (payment.status !== "paid") return NextResponse.json({ ok: true });

 const { user_id: userId, plan } = payment.metadata || {};
 const planConfig = getPlan(plan);
 if (!userId || !planConfig.paid) {
 return NextResponse.json({ ok: false }, { status: 400 });
 }

 await supabase
 .from("user_profiles")
 .update({ plan: planConfig.id })
 .eq("id", userId);

 return NextResponse.json({ ok: true });
 } catch (err) {
 console.error("Mollie webhook error:", err);
 return NextResponse.json({ error: "Webhook fout" }, { status: 500 });
 }
}

