export type AddressInput = {
 address?: string | null;
 postalCode?: string | null;
 city?: string | null;
 country?: string | null;
};

export type CompanyProfileInput = AddressInput & {
 companyName?: string | null;
 kvkKbo?: string | null;
 vatNumber?: string | null;
};

export function normalizeCountry(country?: string | null) {
 const value = (country || "NL").trim().toUpperCase();
 return value || "NL";
}

export function normalizePostalCode(postalCode?: string | null, country = "NL") {
 const value = (postalCode || "").trim().toUpperCase().replace(/\s+/g, "");
 if (country === "NL" && /^\d{4}[A-Z]{2}$/.test(value)) return `${value.slice(0, 4)} ${value.slice(4)}`;
 return value;
}

export function validatePostalCode(postalCode?: string | null, country = "NL") {
 const normalizedCountry = normalizeCountry(country);
 const normalized = normalizePostalCode(postalCode, normalizedCountry);
 if (normalizedCountry === "NL") return /^\d{4}\s[A-Z]{2}$/.test(normalized);
 if (normalizedCountry === "BE") return /^\d{4}$/.test(normalized);
 return normalized.length >= 2 && normalized.length <= 16;
}

export function validateKvkKbo(value?: string | null, country = "NL") {
 const normalizedCountry = normalizeCountry(country);
 const compact = (value || "").replace(/\D/g, "");
 if (normalizedCountry === "NL") return /^\d{8}$/.test(compact);
 if (normalizedCountry === "BE") return /^\d{10}$/.test(compact);
 return compact.length >= 4 && compact.length <= 20;
}

export function splitVatNumber(value?: string | null) {
 const compact = (value || "").trim().toUpperCase().replace(/[\s.]/g, "");
 const match = compact.match(/^([A-Z]{2})([A-Z0-9]+)$/);
 return match ? { countryCode: match[1], vatNumber: match[2], compact } : null;
}

export function validateCompanyProfile(input: CompanyProfileInput) {
 const errors: string[] = [];
 const country = normalizeCountry(input.country);
 const postalCode = normalizePostalCode(input.postalCode, country);
 if (!input.companyName?.trim()) errors.push("Bedrijfsnaam is verplicht");
 if (!validateKvkKbo(input.kvkKbo, country)) errors.push(country === "BE" ? "KBO-nummer heeft geen geldig formaat" : "KvK-nummer heeft geen geldig formaat");
 if (!splitVatNumber(input.vatNumber)) errors.push("BTW-nummer heeft geen geldig formaat");
 if (!input.address?.trim()) errors.push("Adres is verplicht");
 if (!validatePostalCode(postalCode, country)) errors.push("Postcode heeft geen geldig formaat");
 if (!input.city?.trim()) errors.push("Plaats is verplicht");
 return { valid: errors.length === 0, errors, country, postalCode };
}
