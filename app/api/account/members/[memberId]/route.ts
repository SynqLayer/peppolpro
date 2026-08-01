import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

type Params = { params: Promise<{ memberId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
 const { memberId } = await params;
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
 if (!memberId) return NextResponse.json({ error: "Teamlid-id ontbreekt" }, { status: 400 });

 const { data: member, error: lookupError } = await supabase
 .from("account_members")
 .select("id, account_owner_id, member_user_id")
 .eq("id", memberId)
 .single();

 if (lookupError || !member) return NextResponse.json({ error: "Teamlid niet gevonden" }, { status: 404 });
 const isOwner = member.account_owner_id === user.id;
 const isSelf = member.member_user_id === user.id;
 if (!isOwner && !isSelf) return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });

 const { error: deleteError } = await supabase
 .from("account_members")
 .delete()
 .eq("id", memberId);

 if (deleteError) return NextResponse.json({ error: "Teamlid verwijderen mislukt" }, { status: 500 });
 return NextResponse.json({ ok: true, accessRevoked: true });
}
