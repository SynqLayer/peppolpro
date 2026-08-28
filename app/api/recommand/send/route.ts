import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { getDocumentStatus, sendDocument, verifyRecipient, verifyRecipientSupportsInvoice } from "@/lib/recommand";
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
 recommand_company_id?: string | null;
 recommand_verified?: boolean | null;
};

type TargetRow = {
 id: string;
 user_id: string;
 recommand_document_id?: string | null;
 recommand_status?: string | null;
 sent_via_recommand_at?: string | null;
};

type CreditRow = {
 send_credits?: number | null;
 send_credits_expires_at?: string | null;
};

const TARGET_SELECT = "id, user_id, recommand_document_id, recommand_status, sent_via_recommand_at";
const PROCESSING_WAIT_ATTEMPTS = 30;
const PROCESSING_WAIT_MS = 1000;

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
 return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

function normalizePeppolId(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
 return !!value && typeof value === "object" && !Array.isArray(value);
}

function sleep(ms: number) {
 return new Promise((resolve) => setTimeout(resolve, ms));
}

function existingSendResponse(row: TargetRow, remainingCredits?: number | null) {
 return NextResponse.json({
  success: true,
  idempotent: true,
  documentId: row.recommand_document_id,
  status: row.recommand_status || "sent",
  sentAt: row.sent_via_recommand_at,
  remainingCredits,
 });
}

function hasCompletedSend(row?: TargetRow | null) {
 return !!row?.recommand_document_id || !!row?.sent_via_recommand_at;
}

function isVoidedDuplicate(row?: TargetRow | null) {
 return row?.recommand_status === "duplicate_voided";
}

async function fetchTarget(supabase: Awaited<ReturnType<typeof createServerSupabase>>, table: "conversions" | "invoices", targetId: string, userId: string) {
 const { data, error } = await supabase
  .from(table)
  .select(TARGET_SELECT)
  .eq("id", targetId)
  .eq("user_id", userId)
  .single<TargetRow>();
 if (error || !data) return null;
 return data;
}

async function waitForCompletedSend(supabase: Awaited<ReturnType<typeof createServerSupabase>>, table: "conversions" | "invoices", targetId: string, userId: string) {
 for (let attempt = 0; attempt < PROCESSING_WAIT_ATTEMPTS; attempt += 1) {
  await sleep(PROCESSING_WAIT_MS);
  const latest = await fetchTarget(supabase, table, targetId, userId);
  if (hasCompletedSend(latest)) return latest;
 }
 return null;
}

async function claimTargetForSending(supabase: Awaited<ReturnType<typeof createServerSupabase>>, table: "conversions" | "invoices", targetId: string, userId: string) {
 const { data, error } = await supabase
  .from(table)
  .update({ recommand_status: "sending" })
  .eq("id", targetId)
  .eq("user_id", userId)
  .is("recommand_document_id", null)
  .is("sent_via_recommand_at", null)
  .or("recommand_status.is.null,and(recommand_status.neq.sending,recommand_status.neq.duplicate_voided)")
  .select(TARGET_SELECT)
  .maybeSingle<TargetRow>();
 if (error || !data) return null;
 return data;
}

async function resetSendingClaim(supabase: Awaited<ReturnType<typeof createServerSupabase>>, table: "conversions" | "invoices", targetId: string, userId: string) {
 await supabase
  .from(table)
  .update({ recommand_status: null })
  .eq("id", targetId)
  .eq("user_id", userId)
  .eq("recommand_status", "sending")
  .is("recommand_document_id", null)
  .is("sent_via_recommand_at", null);
}

async function reserveSendCredit(supabase: ReturnType<typeof createAdminSupabase>, userId: string) {
 const { data, error } = await supabase
  .rpc("reserve_send_credit", { p_user_id: userId })
  .maybeSingle<CreditRow>();
 if (error || !data) return null;
 return data;
}

async function releaseSendCredit(supabase: ReturnType<typeof createAdminSupabase>, userId: string) {
 const { data } = await supabase
  .rpc("release_send_credit", { p_user_id: userId })
  .maybeSingle<CreditRow>();
 return data || null;
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
 const admin = createAdminSupabase();
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
 const targetTable = conversionId ? "conversions" : invoiceId ? "invoices" : null;
 const targetId = conversionId || invoiceId;
 if (!targetTable || !targetId) return jsonError("conversionId of invoiceId is verplicht", 400);

 const existing = await fetchTarget(supabase, targetTable, targetId, user.id);
 if (!existing) return jsonError("Factuur niet gevonden", 404);
 if (isVoidedDuplicate(existing)) return jsonError("Deze factuur is gemarkeerd als dubbel/voided en kan niet via Peppol worden verzonden.", 409);
 if (hasCompletedSend(existing)) return existingSendResponse(existing);

 const recipient = normalizePeppolId(input.recipient || input.peppolId || input.peppolAddress);
 const document = input.document;
 if (!recipient) return jsonError("Ontvanger-Peppol-ID ontbreekt", 400);
 const documentErrors = validateRecommandInvoiceDocument(document);
 if (documentErrors.length > 0) {
  return jsonError("Verzenden is geblokkeerd: vul de ontbrekende factuurgegevens aan en probeer opnieuw.", 400, { errors: documentErrors });
 }

 const { data: profile, error: profileError } = await supabase
  .from("user_profiles")
  .select("recommand_company_id, recommand_verified")
  .eq("id", user.id)
  .single<ProfileRow>();

 if (profileError || !profile) return jsonError("Bedrijfsprofiel niet gevonden", 404);
 if (profile.recommand_verified !== true || !profile.recommand_company_id) {
  return jsonError("Verifieer eerst je bedrijf voordat je via Peppol verzendt.", 403, { upgradeUrl: "/dashboard#peppol-verzending" });
 }

 const claim = await claimTargetForSending(supabase, targetTable, targetId, user.id);
 if (!claim) {
  const completed = await waitForCompletedSend(supabase, targetTable, targetId, user.id);
  if (completed) return existingSendResponse(completed);
  return jsonError("Deze factuur wordt al verzonden. Probeer het zo opnieuw.", 409);
 }

 const reserved = await reserveSendCredit(admin, user.id);
 if (!reserved) {
  await resetSendingClaim(supabase, targetTable, targetId, user.id);
  return jsonError("Je hebt geen geldig verzendtegoed. Koop een verzendbundel om via Peppol te verzenden.", 402, { upgradeUrl: "/upgrade", sendCredits: 0 });
 }

 const releaseAfterFailure = async () => releaseSendCredit(admin, user.id);

 try {
  const verify = await verifyRecipient(recipient);
  if (!verify.isValid) {
   const released = await releaseAfterFailure();
   await supabase.from(targetTable).update({
    verified_recipient: false,
    recommand_status: "recipient_not_found",
    recommand_raw_response: { verify: verify.raw },
   }).eq("id", targetId).eq("user_id", user.id);
   return jsonError("Ontvanger is niet gevonden op het Peppol-netwerk. Verzenden is geblokkeerd.", 422, { verify: verify.raw, remainingCredits: released?.send_credits });
  }

  const support = await verifyRecipientSupportsInvoice(recipient);
  if (!support.isValid) {
   const released = await releaseAfterFailure();
   await supabase.from(targetTable).update({
    verified_recipient: true,
    recommand_status: "invoice_not_supported",
    recommand_raw_response: { verify: verify.raw, verifyDocumentSupport: support.raw },
   }).eq("id", targetId).eq("user_id", user.id);
   return jsonError("Ontvanger ondersteunt dit Peppol factuurdocumenttype niet. Verzenden is geblokkeerd.", 422, { verify: verify.raw, verifyDocumentSupport: support.raw, remainingCredits: released?.send_credits });
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
   const released = await releaseAfterFailure();
   return jsonError("Recommand heeft het document niet geaccepteerd. Controleer de factuurgegevens en probeer opnieuw.", 502, { verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status, remainingCredits: released?.send_credits });
  }

  return NextResponse.json({ success: true, documentId: send.documentId, status: recommandStatus, remainingCredits: reserved.send_credits, verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status });
 } catch (error) {
  const released = await releaseAfterFailure();
  await supabase.from(targetTable).update({
   recommand_status: "send_failed",
   recommand_raw_response: { error: error instanceof Error ? error.message : "Onbekende Recommand-fout" },
  }).eq("id", targetId).eq("user_id", user.id);
  return jsonError("Recommand verzenden is mislukt. Probeer het later opnieuw.", 502, { remainingCredits: released?.send_credits });
 }
}
