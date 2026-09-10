import type { RecommandSendResult } from "./recommand";

export type SendOutcomeDisposition = "provider_outcome_unknown" | "provider_accepted" | "safe_to_release";

export type SendExceptionState = {
 sendAttempted: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
 return value !== null && typeof value === "object" && !Array.isArray(value)
  ? value as Record<string, unknown>
  : null;
}

export function classifySendResult(send: RecommandSendResult): SendOutcomeDisposition {
 const body = asRecord(send.raw.body);
 const bodyDocumentId = typeof body?.id === "string" ? body.id.trim() : "";
 const resultDocumentId = send.documentId?.trim() || "";

 if (
  send.raw.status === 200
  && body?.success === true
  && send.success === true
  && bodyDocumentId.length > 0
  && resultDocumentId === bodyDocumentId
 ) {
  return "provider_accepted";
 }

 if (
  (send.raw.status === 400 || send.raw.status === 422)
  && body?.success === false
  && send.success === false
 ) {
  return "safe_to_release";
 }

 return "provider_outcome_unknown";
}

export function classifySendException(state: SendExceptionState): SendOutcomeDisposition {
 return state.sendAttempted ? "provider_outcome_unknown" : "safe_to_release";
}
