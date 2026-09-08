import { NextRequest, NextResponse } from "next/server";
import { lookupDutchAddress, validateVatNumber } from "@/lib/address-validation";
import { validateCompanyProfile, normalizeCountry, normalizePostalCode } from "@/lib/profile-validation";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";

type ProfilePayload = {
 companyName?: string;
 country?: string;
 kvkKbo?: string;
 vatNumber?: string;
 address?: string;
 postalCode?: string;
 city?: string;
 houseNumber?: string;
 manualAddress?: boolean;
 completeOnboarding?: boolean;
};

export async function POST(req: NextRequest) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const body = await req.json().catch(() => ({})) as ProfilePayload;
 const country = normalizeCountry(body.country);
 let address = body.address?.trim() || "";
 let city = body.city?.trim() || "";
 let postalCode = normalizePostalCode(body.postalCode, country);
 let addressVerified = false;
 let addressSource = "manual";

 if (country === "NL" && !body.manualAddress) {
  const pdok = await lookupDutchAddress(postalCode, body.houseNumber || "");
  if (!pdok) return NextResponse.json({ error: "Adres kon niet worden gevalideerd via PDOK. Gebruik handmatige invoer als dit adres klopt." }, { status: 400 });
  address = pdok.address;
  city = pdok.city;
  postalCode = pdok.postalCode;
  addressVerified = true;
  addressSource = "pdok";
 } else {
  addressVerified = true;
 }

 const validation = validateCompanyProfile({
  companyName: body.companyName,
  country,
  kvkKbo: body.kvkKbo,
  vatNumber: body.vatNumber,
  address,
  postalCode,
  city,
  addressVerified,
 });
 if (!validation.valid) return NextResponse.json({ error: validation.errors.join(", "), errors: validation.errors }, { status: 400 });

 const vatCheck = body.vatNumber ? await validateVatNumber(body.vatNumber) : { checked: false, valid: false, warning: null };
 const admin = createAdminSupabase();
 const updatePayload: Record<string, string | boolean | null> = {
  company_name: body.companyName?.trim() || null,
  country,
  kvk_kbo: body.kvkKbo?.trim() || null,
  btw_nr: body.vatNumber?.trim().toUpperCase() || null,
  address,
  postal_code: postalCode,
  city,
  address_verified: addressVerified,
  address_validation_source: addressSource,
  vat_validation_status: vatCheck.checked ? (vatCheck.valid ? "valid" : "invalid") : "unchecked",
  vat_validated_at: vatCheck.checked ? new Date().toISOString() : null,
 };
 if (body.completeOnboarding !== false) updatePayload.onboarding_complete = true;

 const { error } = await admin
  .from("user_profiles")
  .update(updatePayload)
  .eq("id", user.id);
 if (error) return NextResponse.json({ error: error.message }, { status: 500 });

 return NextResponse.json({
  ok: true,
  warning: vatCheck.warning || null,
  profile: { address, postalCode, city, country, addressVerified, addressSource },
 });
}
