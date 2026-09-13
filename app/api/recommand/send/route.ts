import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createAuthenticatedSupabase, createServerSupabase } from "@/lib/supabase-server";
import { findOutgoingDocument, getDocumentStatus, sendDocument, verifyRecipient, verifyRecipientSupportsCreditNote, verifyRecipientSupportsInvoice } from "@/lib/recommand";
import type { RecommandRawResponse } from "@/lib/recommand";
import { validateRecommandCreditNoteDocument } from "@/lib/recommand-credit-note";
import { validateRecommandInvoiceDocument } from "@/lib/recommand-invoice";
import { buildRecommandPayloadFromUbl } from "@/lib/ubl-to-recommand";
import { validateStoredInvoiceConsistency } from "@/lib/invoice-preview";
import { classifySendException, classifySendResult, type SendOutcomeDisposition } from "@/lib/recommand-send-outcome";
import { isSuperseded, SUPERSEDED_SEND_BLOCKED_MESSAGE } from "@/lib/superseded";

export const maxDuration = 60;

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
 ubl_xml?: string | null;
 total_amount?: number | string | null;
 recommand_document_id?: string | null;
 recommand_status?: string | null;
 recommand_claimed_at?: string | null;
 sent_via_recommand_at?: string | null;
 superseded_by_conversion_id?: string | null;
};

type ClaimRow = TargetRow & {
 claimed?: boolean | null;
 claim_action?: string | null;
 reservation_id: string;
 claim_token: string;
 send_credits: number;
};

type CreditRow = {
 send_credits?: number | null;
 send_credits_expires_at?: string | null;
};

type UblRefundReason = "recommand_pre_send_validation_failed" | "recommand_provider_rejected";

const CONVERSION_TARGET_SELECT = "id, user_id, ubl_xml, total_amount, recommand_document_id, recommand_status, recommand_claimed_at, sent_via_recommand_at, superseded_by_conversion_id";
const INVOICE_TARGET_SELECT = "id, user_id, ubl_xml, total_incl, recommand_document_id, recommand_status, recommand_claimed_at, sent_via_recommand_at";
const PROCESSING_WAIT_ATTEMPTS = 20;
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
  documentId: row.recommand_document_id || null,
  status: row.recommand_status || "sent",
  sentAt: row.sent_via_recommand_at || null,
  remainingCredits,
 });
}

function inProgressSendResponse(remainingCredits?: number | null) {
 return NextResponse.json({
  success: true,
  documentId: null,
  status: "sending",
  sentAt: null,
  remainingCredits,
  message: "Verzending loopt nog. De status wordt zo ververst.",
 }, { status: 202 });
}

function unknownSendOutcomeResponse(remainingCredits?: number | null) {
 const message = "De provideruitkomst is nog onbekend. Er wordt niet opnieuw verzonden totdat reconciliatie de uitkomst bevestigt.";
 return NextResponse.json({
  success: false,
  documentId: null,
  status: "send_outcome_unknown",
  sentAt: null,
  remainingCredits,
  error: message,
  message,
 }, { status: 409 });
}

function hasCompletedSend(row?: TargetRow | null) {
 const sentStatuses = new Set(["sent", "delivered", "as4_received"]);
 return !!row?.sent_via_recommand_at || sentStatuses.has((row?.recommand_status || "").toLowerCase());
}

function isVoidedDuplicate(row?: TargetRow | null) {
 return row?.recommand_status === "duplicate_voided";
}

async function fetchTarget(supabase: Awaited<ReturnType<typeof createServerSupabase>>, table: "conversions" | "invoices", targetId: string, userId: string) {
 if (table === "invoices") {
  const { data, error } = await supabase
   .from("invoices")
   .select(INVOICE_TARGET_SELECT)
   .eq("id", targetId)
   .eq("user_id", userId)
   .single<TargetRow & { total_incl?: number | string | null }>();
  if (error) throw error;
  if (!data) return null;
  return { ...data, total_amount: data.total_incl ?? data.total_amount };
 }

 const { data, error } = await supabase
  .from("conversions")
  .select(CONVERSION_TARGET_SELECT)
  .eq("id", targetId)
  .eq("user_id", userId)
  .single<TargetRow>();
 if (error) throw error;
 if (!data) return null;
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

async function claimTargetForSending(supabase: ReturnType<typeof createAdminSupabase>, table: "conversions" | "invoices", targetId: string, userId: string) {
 const { data, error } = await supabase
  .rpc("claim_recommand_send_with_credit", {
   p_target_table: table,
   p_target_id: targetId,
   p_user_id: userId,
  })
  .maybeSingle<ClaimRow>();
 if (error) throw error;
 if (!data) return null;
 return data;
}

async function releaseSendCredit(supabase: ReturnType<typeof createAdminSupabase>, userId: string, claim: ClaimRow) {
 const { data, error } = await supabase.rpc("release_recommand_reservation", {
  p_user_id: userId, p_reservation_id: claim.reservation_id, p_claim_token: claim.claim_token,
 }).maybeSingle<CreditRow>();
 if (error || !data) throw error || new Error("Creditvrijgave kon niet worden bevestigd");
 return data;
}

async function refundUblGenerationCreditAfterFailure(
 supabase: ReturnType<typeof createAdminSupabase>,
 table: "conversions" | "invoices",
 targetId: string,
 reason: UblRefundReason,
) {
 if (table !== "conversions") return null;
 const { data, error } = await supabase
  .rpc("release_failed_send_ubl_credit", { p_conversion_id: targetId, p_reason: reason })
  .maybeSingle<{ applied: boolean; credits: number }>();
 if (error) throw error;
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

async function getDocumentStatusBestEffort(documentId: string) {
 try {
  return await getDocumentStatus(documentId);
 } catch {
  console.error("Recommand status lookup failed after document submission");
  return null;
 }
}

export async function POST(request: NextRequest) {
 // één herkansing met verse sessie: een onleesbare sessiecookie mag geen 401 worden
 const { supabase, user } = await createAuthenticatedSupabase();
 const admin = createAdminSupabase();
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
 if (isSuperseded(existing)) return jsonError(SUPERSEDED_SEND_BLOCKED_MESSAGE, 409);
 if (hasCompletedSend(existing)) return existingSendResponse(existing);
 const consistency = validateStoredInvoiceConsistency(existing.total_amount, existing.ubl_xml);
 if (!consistency.ok) {
  await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_pre_send_validation_failed");
  return jsonError(consistency.error, 409);
 }

 if (!existing.ubl_xml) {
  await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_pre_send_validation_failed");
  return jsonError("Opgeslagen UBL ontbreekt; genereer het document opnieuw voordat je verzendt.", 409);
 }
 let fromUbl: ReturnType<typeof buildRecommandPayloadFromUbl>;
 try {
  fromUbl = buildRecommandPayloadFromUbl(existing.ubl_xml);
 } catch (error) {
  await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_pre_send_validation_failed");
  const message = error instanceof Error ? error.message : "Verplichte Peppol-identificatie ontbreekt";
  return jsonError(`Verzenden is geblokkeerd: ${message}. Pas de bedrijfsgegevens aan en genereer het document opnieuw.`, 400);
 }
 const recipient = normalizePeppolId(fromUbl.recipient);
 const document = fromUbl.document;
 const documentType = fromUbl.documentType;
 if (!recipient) {
  await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_pre_send_validation_failed");
  return jsonError("Ontvanger-Peppol-ID ontbreekt", 400);
 }
 const documentErrors = documentType === "creditNote"
  ? validateRecommandCreditNoteDocument(document)
  : validateRecommandInvoiceDocument(document);
 if (documentErrors.length > 0) {
  await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_pre_send_validation_failed");
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
 const companyId = profile.recommand_company_id;

 if (existing.recommand_status === "sending" || existing.recommand_status === "send_outcome_unknown") {
  const hasUnknownOutcome = existing.recommand_status === "send_outcome_unknown";
  const documentNumber = fromUbl.documentType === "creditNote"
   ? fromUbl.document.creditNoteNumber
   : fromUbl.document.invoiceNumber;
  const recovered = await findOutgoingDocument(companyId, documentType, documentNumber, recipient);
  if (!recovered.checked) {
   return hasUnknownOutcome ? unknownSendOutcomeResponse() : inProgressSendResponse();
  }
  if (recovered.documentId) {
   const recoveredAt = recovered.createdAt || new Date().toISOString();
   const { error: recoveryError } = await admin.from(targetTable).update({
    recommand_document_id: recovered.documentId,
    recommand_status: "sent",
    recommand_claimed_at: null,
    sent_via_recommand_at: recoveredAt,
   }).eq("id", targetId).eq("user_id", user.id);
   if (recoveryError) return hasUnknownOutcome ? unknownSendOutcomeResponse() : inProgressSendResponse();
   return existingSendResponse({
    ...existing,
    recommand_document_id: recovered.documentId,
    recommand_status: "sent",
    recommand_claimed_at: null,
    sent_via_recommand_at: recoveredAt,
   });
  }
  if (hasUnknownOutcome) return unknownSendOutcomeResponse();
 }

 const claim = await claimTargetForSending(admin, targetTable, targetId, user.id);
 if (claim?.claim_action === "no_credit") return jsonError("Je hebt geen geldig verzendtegoed. Koop een verzendbundel om via Peppol te verzenden.", 402, { upgradeUrl: "/upgrade", remainingCredits: 0 });
 if (claim?.claim_action === "duplicate_document") return jsonError("Dit document is al verzonden. Open het oorspronkelijke document voor de afleverstatus.", 409);
 if (claim?.claim_action === "manual_reconciliation") return unknownSendOutcomeResponse();
 if (!claim?.claimed) {
  const completed = await waitForCompletedSend(supabase, targetTable, targetId, user.id);
  if (completed) return existingSendResponse(completed);
  return inProgressSendResponse();
 }

 // Claim and reservation are committed together; a pre-submission retry reuses
 // the reservation. Once submission starts, automatic reclaims are forbidden.
 const reserved = { send_credits: claim.send_credits };

 let releasedCredit: CreditRow | null = null;
 let creditReleased = false;
 const releaseAfterFailure = async () => {
  if (!creditReleased) {
   releasedCredit = await releaseSendCredit(admin, user.id, claim);
   creditReleased = true;
  }
  return releasedCredit;
 };

 let sendAttempted = false;
 let sendOutcome: SendOutcomeDisposition | null = null;
 let lastSendRaw: RecommandRawResponse | null = null;
 let acceptedDocumentId: string | null | undefined;
 let acceptedAt: string | null = null;

 const reconcileUnknownSendOutcome = async () => {
  const documentNumber = fromUbl.documentType === "creditNote"
   ? fromUbl.document.creditNoteNumber
   : fromUbl.document.invoiceNumber;
  const recovered = await findOutgoingDocument(companyId, documentType, documentNumber, recipient);
  if (recovered.checked && recovered.documentId) {
   const recoveredAt = recovered.createdAt || new Date().toISOString();
   const { error: recoveryError } = await admin.from(targetTable).update({
    recommand_document_id: recovered.documentId,
    recommand_status: "sent",
    recommand_claimed_at: null,
    sent_via_recommand_at: recoveredAt,
   }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at).eq("recommand_status", "sending").is("recommand_document_id", null).is("sent_via_recommand_at", null);
   if (!recoveryError) {
    return existingSendResponse({
     ...existing,
     recommand_document_id: recovered.documentId,
     recommand_status: "sent",
     recommand_claimed_at: null,
     sent_via_recommand_at: recoveredAt,
    }, reserved.send_credits);
   }
  }
  const { error: unknownUpdateError } = await admin.from(targetTable).update({
   recommand_status: "send_outcome_unknown",
   recommand_raw_response: lastSendRaw
    ? { error: "provider_outcome_unknown", send: lastSendRaw }
    : { error: "provider_outcome_unknown" },
  }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at).eq("recommand_status", "sending").is("recommand_document_id", null).is("sent_via_recommand_at", null);
  if (unknownUpdateError) console.error("Recommand unknown-outcome update failed");
  return unknownSendOutcomeResponse(reserved.send_credits);
 };

 try {
  const verify = await verifyRecipient(recipient);
  if (!verify.isValid) {
    await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_pre_send_validation_failed");
    const released = await releaseAfterFailure();
   const { error: updateError } = await admin.from(targetTable).update({
    verified_recipient: false,
    recommand_status: "recipient_not_found",
    recommand_claimed_at: null,
   recommand_raw_response: { verify: verify.raw },
   }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at);
   if (updateError) throw updateError;
   return jsonError("Ontvanger is niet gevonden op het Peppol-netwerk. Verzenden is geblokkeerd.", 422, { remainingCredits: released?.send_credits });
  }

  const support = documentType === "creditNote"
   ? await verifyRecipientSupportsCreditNote(recipient)
   : await verifyRecipientSupportsInvoice(recipient);
  if (!support.isValid) {
   await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_pre_send_validation_failed");
   const released = await releaseAfterFailure();
   const { error: updateError } = await admin.from(targetTable).update({
    verified_recipient: true,
    recommand_status: "invoice_not_supported",
    recommand_claimed_at: null,
   recommand_raw_response: { verify: verify.raw, verifyDocumentSupport: support.raw },
   }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at);
   if (updateError) throw updateError;
   return jsonError("Ontvanger ondersteunt dit Peppol-documenttype niet. Verzenden is geblokkeerd.", 422, { remainingCredits: released?.send_credits });
  }

  const { data: canSubmit, error: submitError } = await admin.rpc("begin_recommand_submission", {
   p_user_id: user.id, p_reservation_id: claim.reservation_id, p_claim_token: claim.claim_token,
  });
  if (submitError || canSubmit !== true) return unknownSendOutcomeResponse(reserved.send_credits);
  const payload = { recipient, documentType, document };
  const send = await sendDocument(companyId, payload, () => { sendAttempted = true; });
  lastSendRaw = send.raw;
  sendOutcome = classifySendResult(send);

   if (send.raw.status >= 400 && send.raw.status <= 599) {
    await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_provider_rejected");
   }

  if (sendOutcome === "provider_outcome_unknown") {
   return reconcileUnknownSendOutcome();
  }

  if (sendOutcome === "safe_to_release") {
   const { error: updateError } = await admin.from(targetTable).update({
    verified_recipient: true,
    recommand_document_id: null,
    recommand_status: "send_failed",
    recommand_claimed_at: null,
    recommand_raw_response: { verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw },
    sent_via_recommand_at: null,
   }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at);
   if (updateError) throw updateError;
   const released = await releaseAfterFailure();
   return jsonError("Recommand heeft het document niet geaccepteerd. Controleer de factuurgegevens en probeer opnieuw.", 502, { remainingCredits: released?.send_credits });
  }

  if (!send.documentId) {
   sendOutcome = "provider_outcome_unknown";
   return reconcileUnknownSendOutcome();
  }
  acceptedDocumentId = send.documentId;
  acceptedAt = new Date().toISOString();
  const status = await getDocumentStatusBestEffort(acceptedDocumentId);
  const recommandStatus = hasAs4Receipt(status?.body) ? "as4_received" : "sent";
  const sentAt = acceptedAt;

  const { error: updateError } = await admin.from(targetTable).update({
   verified_recipient: true,
   recommand_document_id: acceptedDocumentId,
   recommand_status: recommandStatus,
   recommand_claimed_at: null,
   recommand_raw_response: { verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status },
   sent_via_recommand_at: sentAt,
  }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at);
  if (updateError) throw updateError;

  return NextResponse.json({ success: true, documentId: acceptedDocumentId, status: recommandStatus, sentAt, remainingCredits: reserved.send_credits });
 } catch (error) {
  const sendException = sendOutcome || classifySendException({ sendAttempted });
  if (sendException === "provider_outcome_unknown") {
   return reconcileUnknownSendOutcome();
  }
  if (sendException === "provider_accepted") {
   const { error: acceptedUpdateError } = await admin.from(targetTable).update({
    recommand_document_id: acceptedDocumentId,
    recommand_status: "sent",
    recommand_claimed_at: null,
    sent_via_recommand_at: acceptedAt,
   }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at);
   if (acceptedUpdateError) console.error("Recommand accepted-send recovery update failed");
   return NextResponse.json({
    success: true,
    documentId: acceptedDocumentId || null,
    status: "sending",
    sentAt: acceptedAt,
    remainingCredits: reserved.send_credits,
    message: "Recommand heeft het document geaccepteerd. De afleverstatus wordt later bijgewerkt; verzend niet opnieuw.",
   }, { status: 202 });
  }
  const released = await releaseAfterFailure();
  await refundUblGenerationCreditAfterFailure(admin, targetTable, targetId, "recommand_provider_rejected");
  const { error: updateError } = await admin.from(targetTable).update({
   recommand_status: "send_failed",
   recommand_claimed_at: null,
  recommand_raw_response: { error: error instanceof Error ? error.message : "Onbekende Recommand-fout" },
  }).eq("id", targetId).eq("user_id", user.id).eq("recommand_claimed_at", claim.recommand_claimed_at);
  if (updateError) console.error("Recommand failure update error:", updateError);
  return jsonError("Recommand verzenden is mislukt. Probeer het later opnieuw.", 502, { remainingCredits: released?.send_credits });
 }
}
