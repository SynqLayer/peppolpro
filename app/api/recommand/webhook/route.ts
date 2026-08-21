import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
 buildRecommandWebhookUpdate,
 hashRecommandWebhookRawBody,
 recommandWebhookEventKey,
 type RecommandWebhookPayload,
 verifyRecommandWebhookSignature,
} from "@/lib/recommand-webhook";

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
  const update = buildRecommandWebhookUpdate(payload);
  if (!update.success) return jsonError(update.error, 400);

  const admin = createAdminClient();
  const eventKey = recommandWebhookEventKey(payload, rawBody);
  const rawBodyHash = hashRecommandWebhookRawBody(rawBody);
  const eventRow = {
   event_key: eventKey,
   event_type: typeof payload.eventType === "string" ? payload.eventType : null,
   company_id: typeof payload.companyId === "string" ? payload.companyId : null,
   status: typeof payload.status === "string" ? payload.status : null,
   raw_body_hash: rawBodyHash,
   payload,
   processing_status: "processed",
   processed_at: new Date().toISOString(),
  };

  const { error: logError } = await admin
   .from("recommand_webhook_events")
   .upsert(eventRow, { onConflict: "event_key", ignoreDuplicates: true });
  if (logError) return jsonError("Webhook event-log kon niet worden opgeslagen", 500);

  if (update.ignored) return NextResponse.json({ success: true, ignored: true, eventKey });

  const { error } = await admin
   .from("user_profiles")
   .update(update.updatePayload)
   .eq("recommand_company_id", update.companyId);

  if (error) {
   await admin
    .from("recommand_webhook_events")
    .update({ processing_status: "failed", error_message: "Webhook kon profiel niet bijwerken" })
    .eq("event_key", eventKey);
   return jsonError("Webhook kon profiel niet bijwerken", 500);
  }

  return NextResponse.json({
   success: true,
   verified: update.verified,
   eventKey,
  });
 } catch (error) {
  console.error("Recommand webhook error:", error instanceof Error ? error.message : error);
  return jsonError("Webhook verwerken mislukt", 500);
 }
}
