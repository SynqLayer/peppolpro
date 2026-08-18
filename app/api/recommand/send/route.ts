import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getDocumentStatus, sendDocument, verifyRecipient, verifyRecipientSupportsInvoice } from "@/lib/recommand";
import { getPlan } from "@/lib/plans";
import { validateRecommandInvoiceDocument } from "@/lib/recommand-invoice";

type InvoicePayload = {
 conversionId?: string;
 invoiceId?: string;
 recipient?: unknown;
 peppolId?: unknown;
 peppolAddress?: unknown;
 document?: unknown;
 [key: string]: unknown;
};

type ProfileRow = {
 plan?: string | null;
 recommand_company_id?: string | null;
 recommand_verified?: boolean | null;
};

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
 return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

function normalizePeppolId(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
 return !!value && typeof value === "object" && !Array.isArray(value);
}

function currentMonthStartIso() {
 const now = new Date();
 return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function hasAs4Receipt(value: unknown): boolean {
 if (!value) return false;
 if (typeof value === "string") return value.includes("eb:SignalMessage") || value.includes("eb:Receipt");
 if (Array.isArray(value)) return value.some(hasAs4Receipt);
 if (typeof value === "object") {
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) => {
   if (key === "receivedPeppolSignalMessage" && nested) return true;
   return hasAs4Receipt(nested);
  });
 }
 return false;
}

export async function POST(request: NextRequest) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return jsonError("Niet ingelogd", 401);

 let body: unknown;
 try {
  body = await request.json();
 } catch {
  return jsonError("Ongeldige JSON-body", 400);
 }

 const input = isObject(body) ? body as InvoicePayload : {};
 const conversionId = typeof input.conversionId === "string" ? input.conversionId : null;
 const invoiceId = typeof input.invoiceId === "string" ? input.invoiceId : null;
 const recipient = normalizePeppolId(input.recipient || input.peppolId || input.peppolAddress);
 const document = input.document;

 if (!recipient) return jsonError("Ontvanger-Peppol-ID ontbreekt", 400);
 const documentErrors = validateRecommandInvoiceDocument(document);
 if (documentErrors.length > 0) {
  return jsonError("Verzenden is geblokkeerd: vul de ontbrekende factuurgegevens aan en probeer opnieuw.", 400, { errors: documentErrors });
 }

 const targetTable = conversionId ? "conversions" : invoiceId ? "invoices" : null;
 const targetId = conversionId || invoiceId;
 if (!targetTable || !targetId) return jsonError("conversionId of invoiceId is verplicht", 400);

 const { data: profile, error: profileError } = await supabase
  .from("user_profiles")
  .select("plan, recommand_company_id, recommand_verified")
  .eq("id", user.id)
  .single<ProfileRow>();

 if (profileError || !profile) return jsonError("Bedrijfsprofiel niet gevonden", 404);
 if (profile.recommand_verified !== true || !profile.recommand_company_id) {
  return jsonError("Verifieer eerst je bedrijf voordat je via Peppol verzendt.", 403, { upgradeUrl: "/dashboard#peppol-verzending" });
 }

 const plan = getPlan(profile.plan);
 const limit = plan.includedSends || 0;
 if (limit <= 0) {
  return jsonError("Je huidige plan bevat geen Peppol-verzendingen. Kies een verzendbundel om te verzenden.", 402, { upgradeUrl: "/upgrade" });
 }

 const { count: sendsThisMonth, error: countError } = await supabase
  .from("conversions")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id)
  .gte("sent_via_recommand_at", currentMonthStartIso());

 if (countError) return jsonError("Verzendlimiet kon niet worden gecontroleerd", 500);
 if ((sendsThisMonth || 0) >= limit) {
  return jsonError(`Je hebt deze maand de limiet van ${limit} Peppol-verzendingen bereikt. Upgrade je plan om verder te verzenden.`, 402, { upgradeUrl: "/upgrade", sendsThisMonth: sendsThisMonth || 0, limit });
 }

 const { data: existing, error: existingError } = await supabase
  .from(targetTable)
  .select("id, user_id")
  .eq("id", targetId)
  .eq("user_id", user.id)
  .single();

 if (existingError || !existing) return jsonError("Factuur niet gevonden", 404);

 const verify = await verifyRecipient(recipient);
 if (!verify.isValid) {
  await supabase.from(targetTable).update({
   verified_recipient: false,
   recommand_status: "recipient_not_found",
   recommand_raw_response: { verify: verify.raw },
  }).eq("id", targetId).eq("user_id", user.id);
  return jsonError("Ontvanger is niet gevonden op het Peppol-netwerk. Verzenden is geblokkeerd.", 422, { verify: verify.raw });
 }

 const support = await verifyRecipientSupportsInvoice(recipient);
 if (!support.isValid) {
  await supabase.from(targetTable).update({
   verified_recipient: true,
   recommand_status: "invoice_not_supported",
   recommand_raw_response: { verify: verify.raw, verifyDocumentSupport: support.raw },
  }).eq("id", targetId).eq("user_id", user.id);
  return jsonError("Ontvanger ondersteunt dit Peppol factuurdocumenttype niet. Verzenden is geblokkeerd.", 422, { verify: verify.raw, verifyDocumentSupport: support.raw });
 }

 const payload = { recipient, documentType: "invoice", document };
 const send = await sendDocument(profile.recommand_company_id, payload);
 const status = send.documentId ? await getDocumentStatus(send.documentId) : null;
 const recommandStatus = send.success ? (hasAs4Receipt(status?.body) ? "as4_received" : "sent") : "send_failed";

 await supabase.from(targetTable).update({
  verified_recipient: true,
  recommand_document_id: send.documentId,
  recommand_status: recommandStatus,
  recommand_raw_response: { verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status },
  sent_via_recommand_at: send.success ? new Date().toISOString() : null,
 }).eq("id", targetId).eq("user_id", user.id);

 if (!send.success) {
  return jsonError("Recommand heeft het document niet geaccepteerd. Controleer de factuurgegevens en probeer opnieuw.", 502, { verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status });
 }

 return NextResponse.json({ success: true, documentId: send.documentId, status: recommandStatus, verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status });
}
