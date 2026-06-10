import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPayment } from "@/lib/mollie";

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
 if (payment.status !== "paid") return NextResponse.json({ ok: true });

 const supabase = createAdminClient();
 const { user_id: userId, plan, credits } = payment.metadata || {};
 if (!userId) return NextResponse.json({ ok: false }, { status: 400 });

 await supabase
 .from("payments")
 .update({ status: "paid" })
 .eq("mollie_payment_id", paymentId);

 const creditsNum = parseInt(credits || "0", 10);
 if (creditsNum > 0) {
 await supabase.rpc("increment_credits", { p_user_id: userId, amount: creditsNum });
 } else if (plan) {
 await supabase
 .from("user_profiles")
 .update({ plan, credits: 999 })
 .eq("id", userId);
 }

 return NextResponse.json({ ok: true });
 } catch (err) {
 console.error("Mollie webhook error:", err);
 return NextResponse.json({ error: "Webhook fout" }, { status: 500 });
 }
}
