import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPlan } from "@/lib/plans";
import { dispatchMonitoringWebhook } from "@/lib/monitoring-webhooks";

const DIRECTORY_URL = "https://directory.peppol.eu/search/1.0/json";
const DAY_MS = 24 * 60 * 60 * 1000;

type MonitoringTargetRow = {
 id: string;
 user_id: string;
 identifier_type: string | null;
 identifier_value: string | null;
 label: string | null;
 status: string | null;
 last_checked_at: string | null;
};

type ProfileRow = { id: string; plan: string | null };

function createServiceClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new Error("Supabase service env ontbreekt");
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function authorized(req: NextRequest) {
 const secret = process.env.CRON_SECRET;
 if (!secret) return false;
 const header = req.headers.get("authorization") || "";
 return header === `Bearer ${secret}`;
}

function directoryQuery(target: MonitoringTargetRow) {
 const raw = (target.identifier_value || "").trim();
 if (target.identifier_type === "kvk") return raw.replace(/\D/g, "") || raw;
 return raw;
}

function shouldCheck(lastCheckedAt: string | null, frequency: "weekly" | "daily") {
 if (!lastCheckedAt) return true;
 const elapsed = Date.now() - new Date(lastCheckedAt).getTime();
 return elapsed >= (frequency === "daily" ? DAY_MS : 7 * DAY_MS);
}

async function checkDirectory(target: MonitoringTargetRow) {
 const query = directoryQuery(target);
 const url = new URL(DIRECTORY_URL);
 url.searchParams.set("q", query);
 const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
 const text = await res.text();
 let json: unknown = null;
 try { json = JSON.parse(text); } catch {}
 if (!res.ok) {
 return { status: "error", event_type: "check_error", severity: "warning", payload: { httpStatus: res.status, query } };
 }
 const matches = Array.isArray(json) ? json.length : Array.isArray((json as { matches?: unknown[] })?.matches) ? ((json as { matches: unknown[] }).matches.length) : 0;
 return {
 status: "active",
 event_type: matches > 0 ? "found" : "not_found",
 severity: matches > 0 ? "info" : "warning",
 payload: { query, matches },
 };
}

export async function POST(req: NextRequest) {
 if (!authorized(req)) return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
 try {
 const supabase = createServiceClient();
 const { data: targets, error: targetError } = await supabase
 .from("monitoring_targets")
 .select("id, user_id, identifier_type, identifier_value, label, status, last_checked_at")
 .eq("status", "active");
 if (targetError) return NextResponse.json({ error: "Targets ophalen mislukt" }, { status: 500 });

 const userIds = Array.from(new Set((targets || []).map((target: MonitoringTargetRow) => target.user_id)));
 const { data: profiles, error: profileError } = await supabase
 .from("user_profiles")
 .select("id, plan")
 .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
 if (profileError) return NextResponse.json({ error: "Profielen ophalen mislukt" }, { status: 500 });

 const profileById = new Map((profiles || []).map((profile: ProfileRow) => [profile.id, profile]));
 const { data: webhookConfigs } = await supabase
 .from("monitoring_webhook_configs")
 .select("user_id, webhook_url, revoked_at")
 .is("revoked_at", null)
 .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
 const webhookByUserId = new Map((webhookConfigs || []).map((config: { user_id: string; webhook_url: string | null }) => [config.user_id, config]));
 let checked = 0;
 let skipped = 0;
 let failed = 0;

 for (const target of (targets || []) as MonitoringTargetRow[]) {
 const plan = getPlan(profileById.get(target.user_id)?.plan);
 if (!plan.checkFrequency || !shouldCheck(target.last_checked_at, plan.checkFrequency)) {
 skipped += 1;
 continue;
 }
 try {
 const result = await checkDirectory(target);
 const { data: eventRecord } = await supabase.from("monitoring_events").insert({
 target_id: target.id,
 user_id: target.user_id,
 event_type: result.event_type,
 severity: result.severity,
 payload: result.payload,
 }).select("id, target_id, user_id, event_type, severity, payload, created_at").single();
 await dispatchMonitoringWebhook(webhookByUserId.get(target.user_id) || null, eventRecord || {
 target_id: target.id,
 user_id: target.user_id,
 event_type: result.event_type,
 severity: result.severity,
 payload: result.payload,
 created_at: new Date().toISOString(),
 });
 await supabase.from("monitoring_targets").update({ status: result.status, last_checked_at: new Date().toISOString() }).eq("id", target.id);
 checked += 1;
 } catch (err) {
 failed += 1;
 const { data: eventRecord } = await supabase.from("monitoring_events").insert({
 target_id: target.id,
 user_id: target.user_id,
 event_type: "check_error",
 severity: "critical",
 payload: { message: err instanceof Error ? err.message : "Onbekende fout" },
 }).select("id, target_id, user_id, event_type, severity, payload, created_at").single();
 await dispatchMonitoringWebhook(webhookByUserId.get(target.user_id) || null, eventRecord || {
 target_id: target.id,
 user_id: target.user_id,
 event_type: "check_error",
 severity: "critical",
 payload: { message: err instanceof Error ? err.message : "Onbekende fout" },
 created_at: new Date().toISOString(),
 });
 }
 }
 return NextResponse.json({ checked, skipped, failed, total: targets?.length || 0 });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Onbekende fout";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
