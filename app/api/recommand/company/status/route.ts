import { NextResponse } from "next/server";
import { getCompany } from "@/lib/recommand";
import { createServerSupabase } from "@/lib/supabase-server";

type ProfileRow = {
 recommand_company_id?: string | null;
 recommand_verification_url?: string | null;
 recommand_raw_response?: Record<string, unknown> | null;
};

function jsonError(error: string, status: number, extra: Record<string, unknown> = {}) {
 return NextResponse.json({ success: false, error, ...extra }, { status });
}

export async function GET() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return jsonError("Niet ingelogd", 401);

 const { data: profile, error: profileError } = await supabase
 .from("user_profiles")
 .select("recommand_company_id, recommand_verification_url, recommand_raw_response")
 .eq("id", user.id)
 .single<ProfileRow>();

 if (profileError || !profile) return jsonError("Bedrijfsprofiel niet gevonden", 404);
 if (!profile.recommand_company_id) return jsonError("Recommand company is nog niet aangemaakt", 400);

 const result = await getCompany(profile.recommand_company_id);
 const rawResponse = {
 ...(profile.recommand_raw_response || {}),
 getCompany: result.raw,
 };

 await supabase.from("user_profiles").update({
 recommand_verified: result.isVerified,
 recommand_raw_response: rawResponse,
 }).eq("id", user.id);

 if (!result.success) {
 return jsonError("Recommand company-status ophalen mislukt", 502, { raw: result.raw });
 }

 return NextResponse.json({
 success: true,
 companyId: result.companyId,
 isVerified: result.isVerified,
 verificationUrl: profile.recommand_verification_url || result.verificationUrl,
 raw: result.raw,
 });
}
