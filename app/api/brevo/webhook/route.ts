import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-server";

type BrevoEvent = {
 event?: string;
 messageId?: string;
 "message-id"?: string;
 reason?: string;
 subject?: string;
};

function messageId(event: BrevoEvent) {
 return event.messageId || event["message-id"] || null;
}

export async function POST(req: NextRequest) {
 const expected = process.env.BREVO_WEBHOOK_SECRET;
 if (expected && req.headers.get("x-brevo-secret") !== expected) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 const payload = await req.json().catch(() => null);
 const events: BrevoEvent[] = Array.isArray(payload) ? payload : payload ? [payload] : [];
 const admin = createAdminSupabase();
 let updated = 0;

 for (const event of events) {
  const id = messageId(event);
  if (!id) continue;
  const kind = (event.event || "").toLowerCase();
  if (["delivered", "request", "deferred", "hard_bounce", "soft_bounce", "invalid_email", "blocked", "error"].includes(kind)) {
   const patch = kind === "delivered"
    ? { email_status: "delivered", email_delivered_at: new Date().toISOString(), status: "sent", email_error: null }
    : kind === "request" || kind === "deferred"
     ? { email_status: "accepted", email_error: null }
     : { email_status: "failed", email_error: event.reason || kind || "Brevo delivery failed" };
   const { data, error } = await admin
    .from("invoices")
    .update(patch)
    .eq("brevo_message_id", id)
    .select("id");
   if (error) throw error;
   updated += data?.length || 0;
  }
 }

 return NextResponse.json({ ok: true, updated });
}
