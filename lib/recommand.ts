export const RECOMMAND_BASE_URL = "https://app.recommand.eu/api/v1";

export const PEPPOL_BIS_BILLING_INVOICE_DOCUMENT_TYPE =
 "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1";

type JsonObject = Record<string, unknown>;

export type RecommandRawResponse = {
 ok: boolean;
 status: number;
 statusText: string;
 url: string;
 body: unknown;
};

export type RecommandVerifyResult = {
 success: boolean;
 isValid: boolean;
 raw: RecommandRawResponse;
};

export type RecommandSendResult = {
 success: boolean;
 documentId: string | null;
 raw: RecommandRawResponse;
};

function getCredentials() {
 const apiKey = process.env.RECOMMAND_API_KEY;
 const apiSecret = process.env.RECOMMAND_API_SECRET;
 if (!apiKey || !apiSecret) {
 throw new Error("Recommand API credentials are not configured");
 }
 return { apiKey, apiSecret };
}

function basicAuthHeader() {
 const { apiKey, apiSecret } = getCredentials();
 return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
 const text = await response.text();
 if (!text) return null;
 try {
 return JSON.parse(text);
 } catch {
 return text;
 }
}

async function requestRecommand(path: string, init: RequestInit = {}): Promise<RecommandRawResponse> {
 const url = `${RECOMMAND_BASE_URL}${path}`;
 const response = await fetch(url, {
 ...init,
 headers: {
 Authorization: basicAuthHeader(),
 "Content-Type": "application/json",
 ...(init.headers || {}),
 },
 cache: "no-store",
 });
 const body = await parseResponseBody(response);
 return { ok: response.ok, status: response.status, statusText: response.statusText, url, body };
}

function asObject(value: unknown): JsonObject {
 return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

export async function verifyRecipient(peppolId: string): Promise<RecommandVerifyResult> {
 const raw = await requestRecommand("/verify", {
 method: "POST",
 body: JSON.stringify({ peppolAddress: peppolId }),
 });
 const body = asObject(raw.body);
 return {
 success: raw.ok && body.success !== false,
 isValid: raw.ok && body.isValid === true,
 raw,
 };
}

export async function verifyRecipientSupportsInvoice(peppolId: string): Promise<RecommandVerifyResult> {
 const raw = await requestRecommand("/verify-document-support", {
 method: "POST",
 body: JSON.stringify({
 peppolAddress: peppolId,
 documentType: PEPPOL_BIS_BILLING_INVOICE_DOCUMENT_TYPE,
 }),
 });
 const body = asObject(raw.body);
 return {
 success: raw.ok && body.success !== false,
 isValid: raw.ok && body.isValid === true,
 raw,
 };
}

export async function sendDocument(companyId: string, payload: JsonObject): Promise<RecommandSendResult> {
 const raw = await requestRecommand(`/${encodeURIComponent(companyId)}/send`, {
 method: "POST",
 body: JSON.stringify(payload),
 });
 const body = asObject(raw.body);
 return {
 success: raw.ok && body.success === true,
 documentId: typeof body.id === "string" ? body.id : null,
 raw,
 };
}

export async function getDocumentStatus(documentId: string): Promise<RecommandRawResponse> {
 return requestRecommand(`/documents/${encodeURIComponent(documentId)}`, { method: "GET" });
}
