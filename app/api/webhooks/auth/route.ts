import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/brevo";

export async function POST(req: NextRequest) {
 try {
 const payload = await req.json();
 const { type, record } = payload;
 if (type !== "INSERT" || !record?.email) return NextResponse.json({ ok: true });

 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");

 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 serviceKey,
 { auth: { persistSession: false } }
 );

 await supabase.from("user_profiles").upsert({
 id: record.id,
 email: record.email,
 plan: "free",
 credits: 3,
 onboarding_complete: false,
 }, { onConflict: "id" });

 await sendWelcomeEmail(record.email, record.email.split("@")[0]);

 return NextResponse.json({ ok: true });
 } catch (err) {
 console.error("Auth webhook error:", err);
 return NextResponse.json({ error: "fout" }, { status: 500 });
 }
}
