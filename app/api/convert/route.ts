import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "../../../lib/supabase-server";
import { parseInvoicePDF, describeInvoiceParserError, InvoiceParserError, validateParsedInvoiceForConversion } from "../../../lib/invoice-parser";
import { conversionDraftExpiresAt, parsedInvoiceToDraft, publicDraftPayload } from "../../../lib/conversion-drafts";

export const maxDuration = 60;

export async function GET() {
 try {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
   .from("conversion_drafts")
   .select("id, filename, invoice_data, assumptions, expires_at, updated_at")
   .eq("user_id", user.id)
   .eq("status", "draft")
   .gt("expires_at", new Date().toISOString())
   .order("updated_at", { ascending: false })
   .limit(20);

  if (error) return NextResponse.json({ error: "Concepten ophalen mislukt" }, { status: 500 });
  return NextResponse.json({ drafts: (data || []).map(publicDraftPayload) });
 } catch (err) {
  const msg = err instanceof Error ? err.message : "Onbekende fout";
  return NextResponse.json({ error: msg }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const admin = createAdminSupabase();

  const formData = await request.formData();
  const file = formData.get("pdf") as File;
  if (!file || file.type !== "application/pdf") {
   return NextResponse.json({ error: "Upload een geldig PDF-bestand" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
   return NextResponse.json({ error: "Bestand mag maximaal 10MB zijn" }, { status: 400 });
  }

  const filename = file.name;
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const failedParseMeta = (extra: Record<string, unknown>) => ({
   filename,
   fileSize: file.size,
   mimeType: file.type,
   ...extra,
  });

  // Parse with Gemini before creating a conversion row or debiting credit.
  // Failed parse attempts are logged with bounded metadata only, never the PDF or raw parser response.
  let parsed;
  try {
   parsed = await parseInvoicePDF(base64);
  } catch (parseError: unknown) {
   const parserDetails = describeInvoiceParserError(parseError);
   console.error("Convert parser error", { ...parserDetails, filename });
   await admin.from("scan_logs").insert({
    user_id: user.id,
    action: "convert_parse_failed",
    meta: failedParseMeta({
     stage: "parse",
     kind: parserDetails.kind || parserDetails.name,
     message: parserDetails.message,
    }),
   });
   if (parseError instanceof InvoiceParserError) {
    if (parseError.kind === "service_unavailable") {
     return NextResponse.json({ error: "De factuurherkenning is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
    }
    if (parseError.kind === "unexpected_response") {
     return NextResponse.json({ error: "De factuurherkenning gaf een onverwacht antwoord. Probeer een andere PDF of neem contact op zodat we kunnen meekijken." }, { status: 422 });
    }
    return NextResponse.json({ error: "Deze PDF kon niet goed worden gelezen. Upload een tekst-PDF of probeer een duidelijkere factuur." }, { status: 422 });
   }
   return NextResponse.json({ error: "De factuurherkenning is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  }

  const parsedValidation = validateParsedInvoiceForConversion(parsed);
  if (!parsedValidation.valid && parsedValidation.reasons.includes("unsupported_currency")) {
   console.error("Convert parser returned unsupported currency", {
    filename,
    reasons: parsedValidation.reasons,
    currency: parsed.invoice?.currency ?? null,
   });
   await admin.from("scan_logs").insert({
    user_id: user.id,
    action: "convert_parse_failed",
    meta: failedParseMeta({
     stage: "validation",
     reasons: parsedValidation.reasons,
     currency: parsed.invoice?.currency ?? null,
    }),
   });
   return NextResponse.json({ error: "We kunnen op dit moment alleen EUR-facturen omzetten. Pas de factuur aan of vul de gegevens handmatig in via Nieuwe factuur." }, { status: 422 });
  }

  const draft = parsedInvoiceToDraft(parsed);
  const { data: created, error } = await admin
   .from("conversion_drafts")
   .insert({
    user_id: user.id,
    filename,
    invoice_data: draft.invoiceData,
    assumptions: draft.assumptions,
    status: "draft",
    expires_at: conversionDraftExpiresAt(),
   })
   .select("id, filename, invoice_data, assumptions, expires_at")
   .single();

  if (error || !created) {
   await admin.from("scan_logs").insert({
    user_id: user.id,
    action: "convert_draft_storage_failed",
    meta: failedParseMeta({ stage: "draft_storage", reason: error?.message || "unknown" }),
   });
   return NextResponse.json({ error: "Concept kon niet worden opgeslagen" }, { status: 500 });
  }

  await admin.from("scan_logs").insert({
   user_id: user.id,
   action: "convert_draft_created",
   meta: { draft_id: created.id, filename, assumptions: draft.assumptions, validationReasons: parsedValidation.reasons },
  });

  return NextResponse.json({ success: true, draft: publicDraftPayload(created), assumptions: draft.assumptions });
 } catch (err: unknown) {
  const msg = err instanceof Error ? err.message : "Onbekende fout";
  return NextResponse.json({ error: msg }, { status: 500 });
 }
}
