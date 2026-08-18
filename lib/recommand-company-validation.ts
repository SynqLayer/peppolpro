export type RecommandCompanyProfile = {
 company_name?: string | null;
 country?: string | null;
 kvk_kbo?: string | null;
 btw_nr?: string | null;
 address?: string | null;
 postal_code?: string | null;
 city?: string | null;
 recommand_company_id?: string | null;
};

export function missingRequiredCompanyFields(profile: RecommandCompanyProfile) {
 const missing: string[] = [];
 if (!profile.company_name?.trim()) missing.push("bedrijfsnaam");
 if (!profile.kvk_kbo?.trim()) missing.push(profile.country === "BE" ? "KBO-nummer" : "KvK-nummer");
 if (!profile.btw_nr?.trim()) missing.push("btw-nummer");
 if (!profile.address?.trim()) missing.push("adres");
 if (!profile.postal_code?.trim()) missing.push("postcode");
 if (!profile.city?.trim()) missing.push("plaats");
 return missing;
}

export function shouldCreateRecommandCompany(profile: RecommandCompanyProfile) {
 return !profile.recommand_company_id;
}

export function enterpriseNumberScheme(country?: string | null) {
 const normalized = (country || "NL").toUpperCase();
 return normalized === "BE" ? "0208" : "0106";
}
