import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { generateUBL, InvoiceData } from "@/lib/ubl-generator";
import { validateInvoiceData } from "@/lib/ubl-validator";
import { parseUblSummary, summarizeInvoiceData } from "@/lib/ubl-summary";
import { documentCreditExhaustedBody } from "@/lib/document-credit";

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
 return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 }
 const invoiceData = await req.json() as InvoiceData;
 const documentType = invoiceData.documentType || "invoice";
 if (documentType !== "invoice" && documentType !== "creditNote") {
 return NextResponse.json({ error: "Ongeldig documenttype" }, { status: 400 });
 }
 invoiceData.documentType = documentType;

 const { valid, errors } = validateInvoiceData(invoiceData);
 if (!valid) {
 return NextResponse.json({ error: "Validatiefout", errors }, { status: 400 });
 }

 const xml = generateUBL(invoiceData);
 const summary = parseUblSummary(xml);
 const fallbackSummary = summarizeInvoiceData(invoiceData);
 const admin = createAdminSupabase();
 const canonicalDocumentType = documentType === "creditNote" ? "CreditNote" : "Invoice";
 const documentNumber = summary.invoiceNumber || fallbackSummary.invoiceNumber || invoiceData.invoiceNumber;
 const { data: creationResult, error: creationError } = await admin.rpc("create_generated_conversion", {
  p_user_id: user.id,
  p_filename: `peppolpro-${invoiceData.invoiceNumber}.xml`,
  p_ubl_xml: xml,
  p_customer_name: summary.customerName || fallbackSummary.customerName,
  p_customer_email: invoiceData.customerEmail.trim(),
  p_total_amount: summary.totalAmount ?? fallbackSummary.totalAmount,
  p_invoice_number: documentNumber,
  p_currency: summary.currency || fallbackSummary.currency,
  p_document_type: canonicalDocumentType,
 });
 if (creationError) {
  if (creationError.message?.includes("insufficient_credits")) {
   return NextResponse.json(documentCreditExhaustedBody(), { status: 402 });
  }
  console.error("Atomic document generation failed", { userId: user.id, documentType: canonicalDocumentType, error: creationError.message });
  return NextResponse.json({ error: "Factuur kon niet worden opgeslagen" }, { status: 500 });
 }
 const creation = Array.isArray(creationResult) ? creationResult[0] : creationResult;
 if (!creation?.conversion_id) return NextResponse.json({ error: "Factuur kon niet worden opgeslagen" }, { status: 500 });

 return NextResponse.json({ xml, conversionId: creation.conversion_id, totalAmount: summary.totalAmount ?? fallbackSummary.totalAmount, currency: summary.currency || fallbackSummary.currency });
 } catch (err) {
 console.error("Generate error:", err);
 return NextResponse.json({ error: "Generatie mislukt" }, { status: 500 });
 }
}
