import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
 try {
  const text = await request.text();
  if (text.length > 12_000) return NextResponse.json({ error: "Bericht is te lang" }, { status: 413 });
  const input = JSON.parse(text);
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const message = typeof input?.message === "string" ? input.message.trim() : "";
  const company = typeof input?.company === "string" ? input.company.trim() : "";
  if (!name || name.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254 || !message || message.length > 8000 || company.length > 160) {
   return NextResponse.json({ error: "Vul een naam, geldig e-mailadres en bericht in." }, { status: 400 });
  }
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return NextResponse.json({ error: "Contact is tijdelijk niet beschikbaar." }, { status: 503 });
  // Vercel overwrites this trusted header. Outside Vercel all requests share a budget.
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
  const subject = createHmac("sha256", secret).update(`${new Date().toISOString().slice(0,10)}:${ip}`).digest("hex");
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc("claim_request_budget", { p_kind: "contact", p_subject: subject });
  if (error || !data) return NextResponse.json({ error: "Contact is tijdelijk niet beschikbaar." }, { status: 503 });
  if (data !== "allowed") return NextResponse.json({ error: "Te veel berichten. Probeer het later opnieuw." }, { status: 429 });
  const { error: insertError } = await admin.from("contact_messages").insert({ name, email, message: company ? `Bedrijf: ${company}\n\n${message}` : message });
  if (insertError) return NextResponse.json({ error: "Het bericht kon niet worden opgeslagen." }, { status: 503 });
  return NextResponse.json({ ok: true });
 } catch {
  return NextResponse.json({ error: "Het bericht kon niet worden verwerkt." }, { status: 400 });
 }
}
