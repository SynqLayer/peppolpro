import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { generateUBL, InvoiceData } from "@/lib/ubl-generator";
import { validateInvoiceData } from "@/lib/ubl-validator";

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 const invoiceData = await req.json() as InvoiceData;

 const { valid, errors } = validateInvoiceData(invoiceData);
 if (!valid) {
 return NextResponse.json({ error: "Validatiefout", errors }, { status: 400 });
 }

 if (user) {
 const { data: profile } = await supabase
 .from("user_profiles")
 .select("credits, plan")
 .eq("id", user.id)
 .single();

 if (profile?.plan === "free" && (profile?.credits ?? 0) <= 0) {
 return NextResponse.json(
 { error: "Geen credits meer. Upgrade naar Compleet voor onbeperkt gebruik." },
 { status: 402 }
 );
 }

 if (profile?.plan === "free") {
 await supabase.rpc("use_credit", { p_user_id: user.id });
 }

 await supabase.from("conversions").insert({
 user_id: user.id,
 filename: `peppolpro-${invoiceData.invoiceNumber}.xml`,
 status: "done",
 ubl_xml: null,
 });
 }

 const xml = generateUBL(invoiceData);
 return NextResponse.json({ xml });
 } catch (err) {
 console.error("Generate error:", err);
 return NextResponse.json({ error: "Generatie mislukt" }, { status: 500 });
 }
}
