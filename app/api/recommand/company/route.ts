import { NextResponse } from "next/server";
import { createCompany } from "@/lib/recommand";
import { createServerSupabase } from "@/lib/supabase-server";

type ProfileRow = {
 id: string;
 company_name?: string | null;
 country?: string | null;
 kvk_kbo?: string | null;
 btw_nr?: string | null;
 address?: string | null;
 postal_code?: string | null;
 city?: string | null;
 recommand_company_id?: string | null;
 recommand_verified?: boolean | null;
 recommand_verification_url?: string | null;
 recommand_raw_response?: Record<string, unknown> | null;
};

function jsonError(error: string, status: number, extra: Record<string, unknown> = {}) {
 return NextResponse.json({ success: false, error, ...extra }, { status });
}

function missingRequiredFields(profile: ProfileRow) {
 const missing: string[] = [];
 if (!profile.company_name?.trim()) missing.push("bedrijfsnaam");
 if (!profile.kvk_kbo?.trim()) missing.push(profile.country === "BE" ? "KBO-nummer" : "KvK-nummer");
 if (!profile.btw_nr?.trim()) missing.push("btw-nummer");
 if (!profile.address?.trim()) missing.push("adres");
 if (!profile.postal_code?.trim()) missing.push("postcode");
 if (!profile.city?.trim()) missing.push("plaats");
 return missing;
}

function enterpriseNumberScheme(country?: string | null) {
 const normalized = (country || "NL").toUpperCase();
 return normalized === "BE" ? "0208" : "0106";
}

export async function POST() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return jsonError("Niet ingelogd", 401);

 const { data: profile, error: profileError } = await supabase
 .from("user_profiles")
 .select("id, company_name, country, kvk_kbo, btw_nr, address, postal_code, city, recommand_company_id, recommand_verified, recommand_verification_url, recommand_raw_response")
 .eq("id", user.id)
 .single<ProfileRow>();

 if (profileError || !profile) return jsonError("Bedrijfsprofiel niet gevonden", 404);

 if (profile.recommand_company_id) {
 return NextResponse.json({
 success: true,
 companyId: profile.recommand_company_id,
 isVerified: profile.recommand_verified === true,
 verificationUrl: profile.recommand_verification_url || null,
 idempotent: true,
 raw: profile.recommand_raw_response || null,
 });
 }

 const missing = missingRequiredFields(profile);
 if (missing.length > 0) {
 return jsonError(`Bedrijfsgegevens onvolledig: ${missing.join(", ")} ontbreekt. Vul deze gegevens eerst aan in onboarding.`, 400, { missing });
 }

 const result = await createCompany({
 name: profile.company_name!.trim(),
 address: profile.address!.trim(),
 postalCode: profile.postal_code!.trim(),
 city: profile.city!.trim(),
 country: (profile.country || "NL").toUpperCase(),
 enterpriseNumberScheme: enterpriseNumberScheme(profile.country),
 enterpriseNumber: profile.kvk_kbo!.trim(),
 vatNumber: profile.btw_nr!.trim(),
 isSmpRecipient: false,
 });

 const rawResponse = { createCompany: result.raw };
 if (result.companyId) {
 await supabase.from("user_profiles").update({
 recommand_company_id: result.companyId,
 recommand_verified: result.isVerified,
 recommand_verification_url: result.verificationUrl,
 recommand_raw_response: rawResponse,
 }).eq("id", user.id);
 }

 if (!result.success) {
 return jsonError("Recommand company aanmaken mislukt", 502, { raw: result.raw });
 }

 return NextResponse.json({
 success: true,
 companyId: result.companyId,
 isVerified: result.isVerified,
 verificationUrl: result.verificationUrl,
 raw: result.raw,
 });
}
