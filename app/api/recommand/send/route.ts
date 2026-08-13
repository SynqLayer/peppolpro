import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getDocumentStatus, sendDocument, verifyRecipient, verifyRecipientSupportsInvoice } from "@/lib/recommand";

type InvoicePayload = {
 invoiceNumber?: string;
 issueDate?: string;
 dueDate?: string;
 buyer?: Record<string, unknown>;
 seller?: Record<string, unknown>;
 paymentMeans?: Array<Record<string, unknown>>;
 lines?: Array<Record<string, unknown>>;
 [key: string]: unknown;
};

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
 return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

function normalizePeppolId(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

function isInvoicePayload(value: unknown): value is InvoicePayload {
 return !!value && typeof value === "object" && !Array.isArray(value);
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

 const input = isInvoicePayload(body) ? body : {};
 const conversionId = typeof input.conversionId === "string" ? input.conversionId : null;
 const invoiceId = typeof input.invoiceId === "string" ? input.invoiceId : null;
 const recipient = normalizePeppolId(input.recipient || input.peppolId || input.peppolAddress);
 const document = isInvoicePayload(input.document) ? input.document : null;
 const companyId = process.env.RECOMMAND_COMPANY_ID;

 if (!companyId) return jsonError("Recommand company is niet geconfigureerd", 500);
 if (!recipient) return jsonError("Ontvanger-Peppol-ID ontbreekt", 400);
 if (!document) return jsonError("Documentpayload ontbreekt", 400);

 const targetTable = conversionId ? "conversions" : invoiceId ? "invoices" : null;
 const targetId = conversionId || invoiceId;
 if (!targetTable || !targetId) return jsonError("conversionId of invoiceId is verplicht", 400);

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

 const payload = {
 recipient,
 documentType: "invoice",
 document,
 };
 const send = await sendDocument(companyId, payload);
 const status = send.documentId ? await getDocumentStatus(send.documentId) : null;

 await supabase.from(targetTable).update({
 verified_recipient: true,
 recommand_document_id: send.documentId,
 recommand_status: send.success ? "sent" : "send_failed",
 recommand_raw_response: { verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status },
 sent_via_recommand_at: send.success ? new Date().toISOString() : null,
 }).eq("id", targetId).eq("user_id", user.id);

 if (!send.success) {
 return jsonError("Recommand heeft het document niet geaccepteerd", 502, { verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status });
 }

 return NextResponse.json({ success: true, documentId: send.documentId, verify: verify.raw, verifyDocumentSupport: support.raw, send: send.raw, documents: status });
}
