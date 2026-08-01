import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getPlan, isMonitoringPlan } from "@/lib/plans";

const identifierTypes = new Set(["kvk", "btw", "peppol_id", "company_name"]);

function clean(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
 try {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("plan")
 .eq("id", user.id)
 .single();

 const plan = getPlan(profile?.plan);
 if (!isMonitoringPlan(plan.id)) {
 return NextResponse.json({ error: "Monitoring is alleen beschikbaar met een Monitoring-plan.", upgradeCta: "Upgrade naar Monitoring" }, { status: 403 });
 }

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
 .eq("user_id", user.id);
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
 .insert({ user_id: user.id, identifier_type, identifier_value, label, status: "active" })
 .select("id, identifier_type, identifier_value, label, status, last_checked_at, created_at")
 .single();

 if (error) return NextResponse.json({ error: "Target kon niet worden toegevoegd" }, { status: 500 });
 return NextResponse.json({ target: data });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Onbekende fout";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
