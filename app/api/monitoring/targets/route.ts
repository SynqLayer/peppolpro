import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { assertMonitoringAccess } from "@/lib/monitoring-access";

const identifierTypes = new Set(["kvk", "btw", "peppol_id", "company_name"]);

function clean(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const access = await assertMonitoringAccess(user.id);
 if (!access.ok) {
 return NextResponse.json({ error: "Monitoring is alleen beschikbaar met een actief Monitoring-abonnement.", upgradeCta: "Upgrade naar Monitoring", reason: access.entitlement.reason }, { status: 403 });
 }
 const plan = access.entitlement.plan;

 const body = await req.json();
 const identifier_type = clean(body.identifier_type);
 const identifier_value = clean(body.identifier_value);
 const label = clean(body.label) || null;

 if (!identifierTypes.has(identifier_type)) {
 return NextResponse.json({ error: "identifier_type moet kvk, btw, peppol_id of company_name zijn" }, { status: 400 });
 }
 if (!identifier_value || identifier_value.length > 160) {
 return NextResponse.json({ error: "identifier_value is verplicht en mag maximaal 160 tekens zijn" }, { status: 400 });
 }

 if (typeof plan.maxTargets === "number") {
 const { count, error: countError } = await supabase
 .from("monitoring_targets")
 .select("id", { count: "exact", head: true })
 .eq("user_id", access.entitlement.accountOwnerId);
 if (countError) return NextResponse.json({ error: "Kon targets niet tellen" }, { status: 500 });
 if ((count || 0) >= plan.maxTargets) {
 return NextResponse.json({
 error: `Je Monitoring-plan ondersteunt maximaal ${plan.maxTargets} targets. Upgrade naar Monitoring Accountant voor onbeperkte targets.`,
 upgradeCta: "Upgrade naar Monitoring Accountant",
 }, { status: 403 });
 }
 }

 const { data, error } = await supabase
 .from("monitoring_targets")
 .insert({ user_id: access.entitlement.accountOwnerId, identifier_type, identifier_value, label })
 .select("id, identifier_type, identifier_value, label, status, last_checked_at, created_at")
 .single();

 if (error) return NextResponse.json({ error: "Target kon niet worden toegevoegd" }, { status: 500 });
 return NextResponse.json({ target: data });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Onbekende fout";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
