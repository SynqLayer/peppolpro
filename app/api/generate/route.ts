import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { generateUBL, InvoiceData } from "@/lib/ubl-generator";
import { validateInvoiceData } from "@/lib/ubl-validator";
import { parseUblSummary, summarizeInvoiceData } from "@/lib/ubl-summary";

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 const invoiceData = await req.json() as InvoiceData;

 const { valid, errors } = validateInvoiceData(invoiceData);
 if (!valid) {
 return NextResponse.json({ error: "Validatiefout", errors }, { status: 400 });
 }

 const xml = generateUBL(invoiceData);
 const summary = parseUblSummary(xml);
 const fallbackSummary = summarizeInvoiceData(invoiceData);

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
 ubl_xml: xml,
 customer_name: summary.customerName || fallbackSummary.customerName,
 total_amount: summary.totalAmount ?? fallbackSummary.totalAmount,
 invoice_number: summary.invoiceNumber || fallbackSummary.invoiceNumber,
 currency: summary.currency || fallbackSummary.currency,
 });
 }

 return NextResponse.json({ xml });
 } catch (err) {
 console.error("Generate error:", err);
 return NextResponse.json({ error: "Generatie mislukt" }, { status: 500 });
 }
}
