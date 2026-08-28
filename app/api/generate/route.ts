import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { generateUBL, InvoiceData } from "@/lib/ubl-generator";
import { validateInvoiceData } from "@/lib/ubl-validator";
import { parseUblSummary, summarizeInvoiceData } from "@/lib/ubl-summary";

async function releaseUblCredit(admin: ReturnType<typeof createAdminSupabase>, userId: string) {
 const { data } = await admin.rpc("release_ubl_credit", { p_user_id: userId }).maybeSingle<{ credits: number }>();
 return data || null;
}

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
 return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 }
 const invoiceData = await req.json() as InvoiceData;

 const { valid, errors } = validateInvoiceData(invoiceData);
 if (!valid) {
 return NextResponse.json({ error: "Validatiefout", errors }, { status: 400 });
 }

 const xml = generateUBL(invoiceData);
 const summary = parseUblSummary(xml);
 const fallbackSummary = summarizeInvoiceData(invoiceData);

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("credits, plan")
 .eq("id", user.id)
 .single();

 if (profile?.plan === "free" && (profile?.credits ?? 0) <= 0) {
 return NextResponse.json(
 { error: "Je gratis UBL-generaties zijn op. Neem contact op via info@synqlayer.com, dan kijken we mee." },
 { status: 402 }
 );
 }

 let ublCreditDebited = false;
 const admin = createAdminSupabase();
 if (profile?.plan === "free") {
 const { data: creditUsed, error: creditError } = await admin.rpc("use_credit", { p_user_id: user.id });
 if (creditError || creditUsed !== true) {
 return NextResponse.json(
 { error: "Je gratis UBL-generaties zijn op. Neem contact op via info@synqlayer.com, dan kijken we mee." },
 { status: 402 }
 );
 }
 ublCreditDebited = true;
 }

 const { data: conversion, error: conversionError } = await admin.from("conversions").insert({
  user_id: user.id,
  filename: `peppolpro-${invoiceData.invoiceNumber}.xml`,
  status: "done",
  ubl_xml: xml,
  customer_name: summary.customerName || fallbackSummary.customerName,
  customer_email: invoiceData.customerEmail.trim(),
  total_amount: summary.totalAmount ?? fallbackSummary.totalAmount,
  invoice_number: summary.invoiceNumber || fallbackSummary.invoiceNumber,
  currency: summary.currency || fallbackSummary.currency,
 }).select("id").single();

 if (conversionError || !conversion) {
   if (ublCreditDebited) await releaseUblCredit(admin, user.id);
    return NextResponse.json({ error: "Factuur kon niet worden opgeslagen" }, { status: 500 });
 }

 return NextResponse.json({ xml, conversionId: conversion.id, totalAmount: summary.totalAmount ?? fallbackSummary.totalAmount, currency: summary.currency || fallbackSummary.currency });
 } catch (err) {
 console.error("Generate error:", err);
 return NextResponse.json({ error: "Generatie mislukt" }, { status: 500 });
 }
}
