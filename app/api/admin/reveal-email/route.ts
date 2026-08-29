import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "../../../../lib/supabase-server";

type RevealTarget = "user_profile" | "contact_message";

async function requireAdmin() {
 const sessionSupabase = await createServerSupabase();
 const { data: { user } } = await sessionSupabase.auth.getUser();
 if (!user) return null;

 const { data: profile } = await sessionSupabase
  .from("user_profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single();

 return profile?.is_admin === true ? user : null;
}

export async function POST(request: NextRequest) {
 const user = await requireAdmin();
 if (!user) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const body = (await request.json().catch(() => null)) as { target?: RevealTarget; id?: string } | null;
 if (!body?.id || (body.target !== "user_profile" && body.target !== "contact_message")) {
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
 }

 const admin = createAdminSupabase();
 const table = body.target === "user_profile" ? "user_profiles" : "contact_messages";
 const { data, error } = await admin
  .from(table)
  .select("email")
  .eq("id", body.id)
  .single();

 if (error) {
  return NextResponse.json({ error: "Email not found" }, { status: 404 });
 }

 await admin.from("scan_logs").insert({
  user_id: user.id,
  action: "admin_reveal_email",
  meta: {
   target: body.target,
   target_id: body.id,
   requested_at: new Date().toISOString(),
  },
 });

 return NextResponse.json({ email: data?.email || "" });
}
