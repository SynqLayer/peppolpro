import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ParsedInvoice, parseInvoicePDF } from "../../../lib/invoice-parser";
import { generateUBL, InvoiceData } from "../../../lib/ubl-generator";
import { parseUblSummary } from "../../../lib/ubl-summary";

export const maxDuration = 60;

function parsedToInvoiceData(parsed: ParsedInvoice): InvoiceData {
 return {
 supplierName: parsed.seller.name || "",
 supplierAddress: parsed.seller.address || "",
 supplierCity: parsed.seller.city || "",
 supplierCountry: parsed.seller.country || "NL",
 supplierVatNr: parsed.seller.btw_number || "",
 supplierKvkKbo: parsed.seller.kvk_number || "",
 supplierIban: parsed.seller.iban || "",
 customerName: parsed.buyer.name || "",
 customerAddress: parsed.buyer.address || "",
 customerCity: parsed.buyer.city || "",
 customerCountry: parsed.buyer.country || "NL",
 customerVatNr: parsed.buyer.btw_number || "",
 buyerReference: parsed.invoice.reference || undefined,
 invoiceNumber: parsed.invoice.number || "factuur",
 invoiceDate: parsed.invoice.date || new Date().toISOString().slice(0, 10),
 dueDate: parsed.invoice.due_date || parsed.invoice.date || new Date().toISOString().slice(0, 10),
 currency: parsed.invoice.currency || "EUR",
 lines: parsed.lines.map((line, index) => ({
 id: String(index + 1),
 description: line.description,
 quantity: line.quantity,
 unitPrice: line.unit_price,
 vatPct: line.vat_rate,
 })),
 };
}

export async function POST(request: NextRequest) {
 try {
 const cookieStore = await cookies();
 const supabase = createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
 getAll() { return cookieStore.getAll(); },
 setAll(cookiesToSet) {
 try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
 },
 },
 }
 );

 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 // Check credits
 const { data: profile } = await supabase
 .from("user_profiles")
 .select("credits, plan")
 .eq("id", user.id)
 .single();

 if (!profile || profile.credits <= 0) {
 return NextResponse.json({ error: "Geen credits meer. Upgrade je plan of koop losse credits." }, { status: 403 });
 }

 // Get PDF from form data
 const formData = await request.formData();
 const file = formData.get("pdf") as File;
 if (!file || file.type !== "application/pdf") {
 return NextResponse.json({ error: "Upload een geldig PDF-bestand" }, { status: 400 });
 }
 if (file.size > 10 * 1024 * 1024) {
 return NextResponse.json({ error: "Bestand mag maximaal 10MB zijn" }, { status: 400 });
 }

 const filename = file.name;

 // Create conversion record
 const { data: conversion, error: convError } = await supabase
 .from("conversions")
 .insert({ user_id: user.id, filename, status: "processing" })
 .select("id")
 .single();

 if (convError || !conversion) {
 return NextResponse.json({ error: "Kan conversie niet aanmaken" }, { status: 500 });
 }

 // Upload PDF to storage
 const arrayBuffer = await file.arrayBuffer();
 const base64 = Buffer.from(arrayBuffer).toString("base64");

 await supabase.storage
 .from("invoices")
 .upload(`${user.id}/${conversion.id}.pdf`, Buffer.from(arrayBuffer), {
 contentType: "application/pdf",
 upsert: true,
 });

 // Parse with Gemini
 let parsed;
 try {
 parsed = await parseInvoicePDF(base64);
 } catch (parseError: unknown) {
 await supabase
  .from("conversions")
  .update({ status: "failed" })
  .eq("id", conversion.id);
 return NextResponse.json({ error: "Kon de factuur niet lezen. Probeer een ander bestand." }, { status: 422 });
 }

 // Generate UBL
 const invoiceData = parsedToInvoiceData(parsed);
 const ublXml = generateUBL(invoiceData);
 const summary = parseUblSummary(ublXml);

 // Use credit
 await supabase.rpc("use_credit", { p_user_id: user.id });

 // Update conversion record
 await supabase
 .from("conversions")
 .update({
 status: "success",
 ubl_xml: ublXml,
 customer_name: summary.customerName || parsed.buyer.name || null,
 total_amount: summary.totalAmount ?? parsed.totals.total ?? null,
 invoice_number: summary.invoiceNumber || parsed.invoice.number || null,
 currency: summary.currency || parsed.invoice.currency || "EUR",
 })
 .eq("id", conversion.id);

 // Log
 await supabase.from("scan_logs").insert({
 user_id: user.id,
 action: "convert_success",
 meta: { conversion_id: conversion.id, filename, total: parsed.totals.total },
 });

 return NextResponse.json({
 success: true,
 conversion_id: conversion.id,
 parsed,
 ubl_xml: ublXml,
 });
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : "Onbekende fout";
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}
