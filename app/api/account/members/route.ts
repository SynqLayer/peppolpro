import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { assertMonitoringAccess } from "@/lib/monitoring-access";

function clean(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

const memberColumns = "id, account_owner_id, member_user_id, invite_email, role, invited_at, accepted_at";

export async function GET() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const access = await assertMonitoringAccess(user.id);
 if (!access.ok) return NextResponse.json({ error: "Team is alleen beschikbaar met een actief Monitoring-abonnement.", upgradeCta: "Upgrade naar Monitoring", reason: access.entitlement.reason }, { status: 403 });
 const admin = createAdminSupabase();
 const { data, error } = await admin
 .from("account_members")
 .select(memberColumns)
 .or(`account_owner_id.eq.${access.entitlement.accountOwnerId},member_user_id.eq.${user.id}`)
 .order("invited_at", { ascending: false });
 if (error) return NextResponse.json({ error: "Teamleden ophalen mislukt" }, { status: 500 });
 return NextResponse.json({ members: data || [] });
}

export async function POST(req: NextRequest) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const access = await assertMonitoringAccess(user.id);
 if (!access.ok) return NextResponse.json({ error: "Team is alleen beschikbaar met een actief Monitoring-abonnement.", upgradeCta: "Upgrade naar Monitoring", reason: access.entitlement.reason }, { status: 403 });
 if (access.entitlement.accountOwnerId !== user.id) return NextResponse.json({ error: "Alleen de accounteigenaar kan teamleden uitnodigen" }, { status: 403 });
 const body = await req.json().catch(() => ({}));
 const invite_email = clean(body.email).toLowerCase();
 const role = clean(body.role) === "admin" ? "admin" : "viewer";
 if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invite_email)) {
 return NextResponse.json({ error: "Geldig e-mailadres is verplicht" }, { status: 400 });
 }
 const admin = createAdminSupabase();
 const { data, error } = await admin
 .from("account_members")
 .insert({ account_owner_id: user.id, invite_email, role, status: "pending" })
 .select(memberColumns)
 .single();
 if (error) return NextResponse.json({ error: "Uitnodiging kon niet worden vastgelegd" }, { status: 500 });
 return NextResponse.json({ invite: data });
}

export async function PATCH(req: NextRequest) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const body = await req.json().catch(() => ({}));
 const id = clean(body.id);
 if (!id) return NextResponse.json({ error: "Invite-id ontbreekt" }, { status: 400 });
 const { data, error } = await supabase
 .from("account_members")
 .update({ member_user_id: user.id, accepted_at: new Date().toISOString(), status: "accepted" })
 .eq("id", id)
 .is("accepted_at", null)
 .select(memberColumns)
 .single();
 if (error) return NextResponse.json({ error: "Uitnodiging accepteren mislukt" }, { status: 500 });
 return NextResponse.json({ membership: data });
}
