import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeWebhookUrl } from "@/lib/monitoring-webhooks";

function clean(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const { data, error } = await supabase
 .from("monitoring_webhook_configs")
 .select("id, webhook_url, created_at, updated_at, revoked_at")
 .eq("user_id", user.id)
 .maybeSingle();
 if (error) return NextResponse.json({ error: "Webhook-config ophalen mislukt" }, { status: 500 });
 return NextResponse.json({ config: data });
}

export async function POST(req: NextRequest) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const body = await req.json().catch(() => ({}));
 const rawUrl = clean(body.webhook_url);
 if (!rawUrl) return NextResponse.json({ error: "webhook_url is verplicht" }, { status: 400 });
 let webhook_url: string;
 try {
 webhook_url = normalizeWebhookUrl(rawUrl);
 } catch (err) {
 return NextResponse.json({ error: err instanceof Error ? err.message : "Ongeldige webhook-URL" }, { status: 400 });
 }
 const { data, error } = await supabase
 .from("monitoring_webhook_configs")
 .upsert({ user_id: user.id, webhook_url, updated_at: new Date().toISOString(), revoked_at: null }, { onConflict: "user_id" })
 .select("id, webhook_url, created_at, updated_at, revoked_at")
 .single();
 if (error) return NextResponse.json({ error: "Webhook-config opslaan mislukt" }, { status: 500 });
 return NextResponse.json({ config: data });
}

export async function DELETE() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const { error } = await supabase
 .from("monitoring_webhook_configs")
 .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
 .eq("user_id", user.id);
 if (error) return NextResponse.json({ error: "Webhook-config intrekken mislukt" }, { status: 500 });
 return NextResponse.json({ ok: true });
}
