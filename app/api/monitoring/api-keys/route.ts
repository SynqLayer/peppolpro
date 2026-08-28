import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { assertMonitoringAccess } from "@/lib/monitoring-access";
import { hashApiKey } from "@/lib/api-keys";

function clean(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const access = await assertMonitoringAccess(user.id);
 if (!access.ok) return NextResponse.json({ error: "API & Webhooks zijn alleen beschikbaar met een actief Monitoring-abonnement.", upgradeCta: "Upgrade naar Monitoring", reason: access.entitlement.reason }, { status: 403 });
 const { data, error } = await supabase
 .from("api_keys")
 .select("id, key_hash, created_at, last_used_at, revoked_at")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false });
 if (error) return NextResponse.json({ error: "API-keys ophalen mislukt" }, { status: 500 });
 return NextResponse.json({ keys: data || [] });
}

export async function POST(req: NextRequest) {
 const supabase = await createServerSupabase();
 const admin = createAdminSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const access = await assertMonitoringAccess(user.id);
 if (!access.ok) return NextResponse.json({ error: "API & Webhooks zijn alleen beschikbaar met een actief Monitoring-abonnement.", upgradeCta: "Upgrade naar Monitoring", reason: access.entitlement.reason }, { status: 403 });
 const body = await req.json().catch(() => ({}));
 const label = clean(body.label) || "monitoring-api";
 const rawKey = `ppro_${randomBytes(24).toString("hex")}`;
 const key_hash = hashApiKey(rawKey);
 const { data, error } = await admin
.from("api_keys")
.insert({ user_id: user.id, key_hash })
 .select("id, key_hash, created_at, last_used_at, revoked_at")
 .single();
 if (error) return NextResponse.json({ error: "API-key aanmaken mislukt" }, { status: 500 });
 return NextResponse.json({ key: rawKey, label, record: data });
}


export async function DELETE(req: NextRequest) {
 const supabase = await createServerSupabase();
 const admin = createAdminSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const access = await assertMonitoringAccess(user.id);
 if (!access.ok) return NextResponse.json({ error: "API & Webhooks zijn alleen beschikbaar met een actief Monitoring-abonnement.", upgradeCta: "Upgrade naar Monitoring", reason: access.entitlement.reason }, { status: 403 });
 const body = await req.json().catch(() => ({}));
 const id = clean(body.id);
 if (!id) return NextResponse.json({ error: "API-key-id ontbreekt" }, { status: 400 });
 const { data, error } = await admin
  .from("api_keys")
  .update({ revoked_at: new Date().toISOString() })
  .eq("id", id)
  .eq("user_id", user.id)
  .select("id, key_hash, created_at, last_used_at, revoked_at")
  .single();
 if (error) return NextResponse.json({ error: "API-key intrekken mislukt" }, { status: 500 });
 return NextResponse.json({ revoked: data });
}
