import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { assertMonitoringAccess } from "@/lib/monitoring-access";
import { generateMonitoringReportPdf } from "@/lib/monitoring-report-pdf";

export const runtime = "nodejs";

type Params = { params: Promise<{ targetId: string }> };

export async function GET(_req: Request, { params }: Params) {
 const { targetId } = await params;
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const access = await assertMonitoringAccess(user.id);
 if (!access.ok) {
 return NextResponse.json({ error: "Compliancerapporten zijn alleen beschikbaar met een actief Monitoring-abonnement.", reason: access.entitlement.reason }, { status: 403 });
 }
 const profile = access.entitlement.profile;

 const { data: target, error: targetError } = await supabase
 .from("monitoring_targets")
 .select("id, user_id, identifier_type, identifier_value, label, status, last_checked_at, created_at")
 .eq("id", targetId)
 .single();

 if (targetError || !target) return NextResponse.json({ error: "Monitoring target niet gevonden" }, { status: 404 });

 const { data: events, error: eventsError } = await supabase
 .from("monitoring_events")
 .select("event_type, severity, created_at, payload")
 .eq("target_id", targetId)
 .order("created_at", { ascending: false })
 .limit(120);

 if (eventsError) return NextResponse.json({ error: "Monitoring-historie ophalen mislukt" }, { status: 500 });

 const pdf = await generateMonitoringReportPdf({
 companyName: profile?.company_name || user.email || "PeppolPro account",
 target,
 events: events || [],
 });

 return new NextResponse(pdf, {
 status: 200,
 headers: {
 "Content-Type": "application/pdf",
 "Content-Disposition": `attachment; filename="peppolpro-monitoring-${targetId}.pdf"`,
 "Cache-Control": "no-store",
 },
 });
}
