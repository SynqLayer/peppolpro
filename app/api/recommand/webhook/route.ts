import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type RecommandWebhookPayload = {
 eventType?: string;
 companyId?: string;
 status?: string;
 errorMessage?: string;
 [key: string]: unknown;
};

function jsonError(error: string, status: number) {
 return NextResponse.json({ success: false, error }, { status });
}

function getWebhookSecret() {
 const secret = process.env.RECOMMAND_WEBHOOK_SECRET;
 if (!secret) throw new Error("RECOMMAND_WEBHOOK_SECRET ontbreekt");
 return secret;
}

function createAdminClient() {
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
 });
}

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

export function isVerifiedCompanyEvent(payload: RecommandWebhookPayload) {
 return payload.eventType === "company.verification"
  && typeof payload.companyId === "string"
  && payload.companyId.startsWith("c_")
  && payload.status === "verified";
}

export async function POST(req: NextRequest) {
 let rawBody = "";
 try {
  rawBody = await req.text();
  const secret = getWebhookSecret();
  const signature = req.headers.get("X-Signature");
  if (!verifyRecommandWebhookSignature(rawBody, signature, secret)) {
   return jsonError("Ongeldige webhook-signature", 401);
  }

  const payload = JSON.parse(rawBody) as RecommandWebhookPayload;
  if (payload.eventType !== "company.verification") {
   return NextResponse.json({ success: true, ignored: true });
  }
  if (typeof payload.companyId !== "string" || !payload.companyId.startsWith("c_")) {
   return jsonError("Ongeldig Recommand company-id", 400);
  }

  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
   recommand_raw_response: { webhook: payload },
  };
  if (payload.status === "verified") updatePayload.recommand_verified = true;

  const { error } = await admin
   .from("user_profiles")
   .update(updatePayload)
   .eq("recommand_company_id", payload.companyId);

  if (error) return jsonError("Webhook kon profiel niet bijwerken", 500);

  return NextResponse.json({
   success: true,
   verified: payload.status === "verified",
  });
 } catch (error) {
  console.error("Recommand webhook error:", error instanceof Error ? error.message : error);
  return jsonError("Webhook verwerken mislukt", 500);
 }
}
