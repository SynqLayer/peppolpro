export type IdentifierWithScheme = {
 scheme: string;
 value: string;
};

const RECOMMAND_ENTERPRISE_SCHEME_EXCLUSIONS = new Set(["0092", "0103", "0181", "0182"]);

export function normalizeIdentifier(value: string | null | undefined) {
 return (value || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function identifierWithScheme(value: string | null | undefined): IdentifierWithScheme | null {
 const normalized = normalizeIdentifier(value);
 if (!normalized) return null;
 const prefixed = normalized.match(/^(\d{4}):(.*)$/);
 if (prefixed) return prefixed[2] ? { scheme: prefixed[1], value: prefixed[2] } : null;
 if (/^BE\d{10}$/.test(normalized)) return { scheme: "9925", value: normalized };
 if (/^NL[A-Z0-9]+$/.test(normalized)) return { scheme: "9944", value: normalized };
 if (/^\d{20}$/.test(normalized)) return { scheme: "0190", value: normalized };
 if (/^\d{10}$/.test(normalized)) return { scheme: "0208", value: normalized };
 if (/^\d{8}$/.test(normalized)) return { scheme: "0106", value: normalized };
 return null;
}

export function isRecommandEnterpriseNumberScheme(value: unknown): value is string {
 if (typeof value !== "string" || !/^\d{4}$/.test(value)) return false;
 const numeric = Number(value);
 return numeric >= 2 && numeric <= 240 && !RECOMMAND_ENTERPRISE_SCHEME_EXCLUSIONS.has(value);
}
