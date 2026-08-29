import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { validateParsedInvoiceForConversion } from "@/lib/conversion-drafts";
import { generateUBL, InvoiceData } from "@/lib/ubl-generator";
import { parseUblSummary, summarizeInvoiceData } from "@/lib/ubl-summary";

export async function POST(req: NextRequest) {
 try {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const draftId = typeof body.draftId === "string" ? body.draftId : "";
  const invoiceData = body.invoiceData as InvoiceData;
  if (!draftId || !invoiceData) {
   return NextResponse.json({ error: "Concept of factuurgegevens ontbreken" }, { status: 400 });
  }

  const validation = validateParsedInvoiceForConversion(invoiceData);
  if (!validation.valid) {
   return NextResponse.json({ error: "Validatiefout", errors: validation.errors }, { status: 400 });
  }

  const xml = generateUBL(invoiceData);
  const summary = parseUblSummary(xml);
  const fallbackSummary = summarizeInvoiceData(invoiceData);
  const admin = createAdminSupabase();

  const { data: draftForLog } = await admin
   .from("conversion_drafts")
   .select("assumptions")
   .eq("id", draftId)
   .eq("user_id", user.id)
   .maybeSingle<{ assumptions: unknown }>();
  const draftAssumptions = Array.isArray(draftForLog?.assumptions) ? draftForLog.assumptions : [];

  const { data: result, error } = await admin.rpc("confirm_conversion_draft", {
   p_user_id: user.id,
   p_draft_id: draftId,
   p_filename: `peppolpro-${invoiceData.invoiceNumber}.xml`,
   p_ubl_xml: xml,
   p_customer_name: summary.customerName || fallbackSummary.customerName,
   p_customer_email: invoiceData.customerEmail.trim(),
   p_total_amount: summary.totalAmount ?? fallbackSummary.totalAmount,
   p_invoice_number: summary.invoiceNumber || fallbackSummary.invoiceNumber,
   p_currency: summary.currency || fallbackSummary.currency,
  });

  if (error) {
   const msg = error.message || "Bevestigen mislukt";
   if (msg.includes("conversion_draft_not_found")) return NextResponse.json({ error: "Concept niet gevonden" }, { status: 404 });
   if (msg.includes("conversion_draft_expired")) return NextResponse.json({ error: "Concept is verlopen. Upload de PDF opnieuw." }, { status: 410 });
   if (msg.includes("insufficient_credits")) return NextResponse.json({ error: "Geen gratis UBL-generaties meer. Bekijk de prijzen om verder te gaan.", upgradeUrl: "/prijzen" }, { status: 402 });
   return NextResponse.json({ error: "Bevestigen mislukt" }, { status: 500 });
  }

  const row = Array.isArray(result) ? result[0] : result;
  if (!row?.conversion_id) return NextResponse.json({ error: "Bevestigen mislukt" }, { status: 500 });

  let responseXml = xml;
  if (row.already_confirmed === true) {
   const { data: existingConversion, error: existingError } = await admin
    .from("conversions")
    .select("ubl_xml, total_amount, currency")
    .eq("id", row.conversion_id)
    .eq("user_id", user.id)
    .single();
   if (existingError || !existingConversion?.ubl_xml) {
    return NextResponse.json({ error: "Bestaande conversie kon niet worden opgehaald" }, { status: 500 });
   }
   responseXml = existingConversion.ubl_xml;
  }

  if (row.already_confirmed !== true) {
   await admin.from("scan_logs").insert({
    user_id: user.id,
    action: "convert_success",
    meta: { conversion_id: row.conversion_id, draft_id: draftId, total: summary.totalAmount ?? fallbackSummary.totalAmount, assumptions: draftAssumptions },
   });
  }

  return NextResponse.json({
   success: true,
   conversionId: row.conversion_id,
   alreadyConfirmed: row.already_confirmed === true,
   creditUsed: row.credit_used === true,
   xml: responseXml,
   totalAmount: summary.totalAmount ?? fallbackSummary.totalAmount,
   currency: summary.currency || fallbackSummary.currency,
  });
 } catch (err) {
  console.error("Confirm conversion draft error:", err);
  return NextResponse.json({ error: "Bevestigen mislukt" }, { status: 500 });
 }
}
