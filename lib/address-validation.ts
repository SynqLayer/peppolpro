import { createAdminSupabase } from "@/lib/supabase-server";
import { normalizePostalCode, splitVatNumber } from "@/lib/profile-validation";

export type AddressLookupResult = {
 address: string;
 street: string;
 houseNumber: string;
 postalCode: string;
 city: string;
 country: "NL";
 source: "pdok";
};

function addressKey(postalCode: string, houseNumber: string) {
 return `${postalCode.replace(/\s+/g, "").toUpperCase()}:${houseNumber.trim().toUpperCase()}`;
}

export async function lookupDutchAddress(postalCodeInput: string, houseNumberInput: string): Promise<AddressLookupResult | null> {
 const postalCode = normalizePostalCode(postalCodeInput, "NL");
 const houseNumber = houseNumberInput.trim();
 if (!/^\d{4}\s[A-Z]{2}$/.test(postalCode) || !houseNumber) return null;

 const admin = createAdminSupabase();
 const key = addressKey(postalCode, houseNumber);
 const { data: cached } = await admin
  .from("address_lookup_cache")
  .select("street, house_number, postal_code, city")
  .eq("lookup_key", key)
  .maybeSingle();
 if (cached?.street && cached.city) {
  return {
   address: `${cached.street} ${cached.house_number || houseNumber}`.trim(),
   street: cached.street,
   houseNumber: cached.house_number || houseNumber,
   postalCode: cached.postal_code || postalCode,
   city: cached.city,
   country: "NL",
   source: "pdok",
  };
 }

 const params = new URLSearchParams({
  q: `postcode:${postalCode.replace(/\s+/g, "")} huisnummer:${houseNumber}`,
  rows: "1",
  fl: "straatnaam,huisnummer,huisletter,huisnummertoevoeging,postcode,woonplaatsnaam",
 });
 const res = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?${params.toString()}`, {
  headers: { Accept: "application/json" },
 });
 if (!res.ok) return null;
 const json = await res.json() as { response?: { docs?: Array<Record<string, string | number | undefined>> } };
 const doc = json.response?.docs?.[0];
 const street = String(doc?.straatnaam || "").trim();
 const city = String(doc?.woonplaatsnaam || "").trim();
 const pdokPostalCode = normalizePostalCode(String(doc?.postcode || postalCode), "NL");
 const numberParts = [doc?.huisnummer, doc?.huisletter, doc?.huisnummertoevoeging]
  .filter((part) => part !== undefined && part !== null && String(part).trim())
  .map(String);
 const resolvedHouseNumber = numberParts.join("") || houseNumber;
 if (!street || !city) return null;

 await admin.from("address_lookup_cache").upsert({
  lookup_key: key,
  street,
  house_number: resolvedHouseNumber,
  postal_code: pdokPostalCode,
  city,
  country: "NL",
  raw: doc || null,
  updated_at: new Date().toISOString(),
 }, { onConflict: "lookup_key" });

 return {
  address: `${street} ${resolvedHouseNumber}`.trim(),
  street,
  houseNumber: resolvedHouseNumber,
  postalCode: pdokPostalCode,
  city,
  country: "NL",
  source: "pdok",
 };
}

export async function validateVatNumber(value: string) {
 const parsed = splitVatNumber(value);
 if (!parsed) return { checked: false, valid: false, warning: "BTW-nummer heeft geen geldig formaat" };
 try {
  const res = await fetch("https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number", {
   method: "POST",
   headers: { "Content-Type": "application/json", Accept: "application/json" },
   body: JSON.stringify({ countryCode: parsed.countryCode, vatNumber: parsed.vatNumber }),
  });
  if (!res.ok) return { checked: false, valid: false, warning: "BTW-nummer kon niet via VIES worden gecontroleerd" };
  const data = await res.json() as { valid?: boolean };
  return {
   checked: true,
   valid: data.valid === true,
   warning: data.valid === true ? null : "BTW-nummer is niet geldig volgens VIES",
  };
 } catch {
  return { checked: false, valid: false, warning: "BTW-nummer kon niet via VIES worden gecontroleerd" };
 }
}
