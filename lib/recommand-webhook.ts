import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type RecommandWebhookPayload = {
 id?: string;
 eventId?: string;
 event_id?: string;
 eventType?: string;
 companyId?: string;
 status?: string;
 errorMessage?: string;
 [key: string]: unknown;
};

export function verifyRecommandWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string) {
 if (!signatureHeader?.startsWith("sha256=")) return false;
 const providedHex = signatureHeader.slice("sha256=".length);
 if (!/^[a-f0-9]{64}$/i.test(providedHex)) return false;
 const expectedHex = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
 const provided = Buffer.from(providedHex, "hex");
 const expected = Buffer.from(expectedHex, "hex");
 if (provided.length !== expected.length) return false;
 return timingSafeEqual(provided, expected);
}

export function hashRecommandWebhookRawBody(rawBody: string) {
 return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

function providerEventId(payload: RecommandWebhookPayload) {
 for (const candidate of [payload.eventId, payload.event_id, payload.id]) {
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
 }
 return null;
}

export function recommandWebhookEventKey(payload: RecommandWebhookPayload, rawBody: string) {
 const explicitId = providerEventId(payload);
 if (explicitId) return `recommand:${explicitId}`;
 const companyId = typeof payload.companyId === "string" ? payload.companyId : "unknown_company";
 const status = typeof payload.status === "string" ? payload.status : "unknown_status";
 return `recommand:${hashRecommandWebhookRawBody(`${rawBody}:${companyId}:${status}`)}`;
}

export function buildRecommandWebhookUpdate(payload: RecommandWebhookPayload) {
 if (payload.eventType !== "company.verification") {
  return { success: true as const, ignored: true as const };
 }
 if (typeof payload.companyId !== "string" || !payload.companyId.startsWith("c_")) {
  return { success: false as const, error: "Ongeldig Recommand company-id" };
 }
 const updatePayload: Record<string, unknown> = {
  recommand_raw_response: { webhook: payload },
 };
 // Bewust beleid: alleen een latere verified-call zet true. Failed/rejected trekt verificatie niet terug.
 if (payload.status === "verified") updatePayload.recommand_verified = true;
 return {
  success: true as const,
  ignored: false as const,
  companyId: payload.companyId,
  verified: payload.status === "verified",
  updatePayload,
 };
}
