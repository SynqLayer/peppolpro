import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

function clean(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const { data, error } = await supabase
 .from("account_members")
 .select("id, account_owner_id, member_user_id, invite_email, role, invited_at, accepted_at")
 .or(`account_owner_id.eq.${user.id},member_user_id.eq.${user.id}`)
 .order("invited_at", { ascending: false });
 if (error) return NextResponse.json({ error: "Teamleden ophalen mislukt" }, { status: 500 });
 return NextResponse.json({ members: data || [] });
}

export async function POST(req: NextRequest) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 const body = await req.json().catch(() => ({}));
 const invite_email = clean(body.email).toLowerCase();
 const role = clean(body.role) === "admin" ? "admin" : "viewer";
 if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invite_email)) {
 return NextResponse.json({ error: "Geldig e-mailadres is verplicht" }, { status: 400 });
 }
 const { data, error } = await supabase
 .from("account_members")
 .insert({ account_owner_id: user.id, invite_email, role, status: "pending" })
 .select("id, account_owner_id, member_user_id, invite_email, role, invited_at, accepted_at")
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
 .select("id, account_owner_id, member_user_id, invite_email, role, invited_at, accepted_at")
 .single();
 if (error) return NextResponse.json({ error: "Uitnodiging accepteren mislukt" }, { status: 500 });
 return NextResponse.json({ membership: data });
}
