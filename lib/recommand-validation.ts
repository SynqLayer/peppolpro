import { isRecommandEnterpriseNumberScheme } from "./enterprise-number-scheme.ts";

type StringRecord = Record<string, unknown>;

export function requireString(obj: StringRecord, key: string, label: string, errors: string[]) {
 if (typeof obj[key] !== "string" || !obj[key].trim()) errors.push(`${label} ontbreekt`);
}

export function validateRecommandParty(value: unknown, label: string, requireEnterprise: boolean, errors: string[]) {
 if (!value || typeof value !== "object" || Array.isArray(value)) {
  errors.push(`${label}: gegevens ontbreken`);
  return;
 }
 const party = value as StringRecord;
 for (const [key, field] of [
  ["name", "naam"],
  ["street", "adres"],
  ["postalZone", "postcode"],
  ["city", "plaats"],
  ["country", "land"],
  ["vatNumber", "BTW-nummer"],
 ] as const) requireString(party, key, `${label}: ${field}`, errors);
 if (!requireEnterprise) return;
 requireString(party, "enterpriseNumber", `${label}: ondernemingsnummer`, errors);
 const scheme = party.enterpriseNumberScheme;
 if (typeof scheme !== "string" || !scheme.trim()) {
  errors.push(`${label}: ondernemingsnummerschema ontbreekt`);
 } else if (!isRecommandEnterpriseNumberScheme(scheme.trim())) {
  errors.push(`${label}: ondernemingsnummerschema wordt niet door Recommand ondersteund`);
 }
}

function validNumericString(value: unknown, allowZero: boolean) {
 if (typeof value !== "string" || !value.trim()) return false;
 const numeric = Number(value);
 return Number.isFinite(numeric) && (allowZero ? numeric >= 0 : numeric > 0);
}

export function validateRecommandLines(value: unknown, errors: string[]) {
 if (!Array.isArray(value) || value.length === 0) {
  errors.push("Minimaal één factuurregel vereist");
  return;
 }
 value.forEach((raw, index) => {
  const label = `Regel ${index + 1}`;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
   errors.push(`${label}: gegevens ontbreken`);
   return;
  }
  const line = raw as StringRecord;
  requireString(line, "name", `${label}: naam`, errors);
  requireString(line, "description", `${label}: omschrijving`, errors);
  if (typeof line.quantity !== "string" || !line.quantity.trim()) errors.push(`${label}: aantal ontbreekt`);
  else if (!validNumericString(line.quantity, false)) errors.push(`${label}: aantal moet groter dan nul zijn`);
  if (typeof line.netPriceAmount !== "string" || !line.netPriceAmount.trim()) errors.push(`${label}: prijs ontbreekt`);
  else if (!validNumericString(line.netPriceAmount, true)) errors.push(`${label}: prijs is ongeldig`);
  if (!line.vat || typeof line.vat !== "object" || Array.isArray(line.vat)) {
   errors.push(`${label}: BTW-gegevens ontbreken`);
   return;
  }
  const vat = line.vat as StringRecord;
  requireString(vat, "category", `${label}: BTW-categorie`, errors);
  if (typeof vat.percentage !== "string" || !vat.percentage.trim()) errors.push(`${label}: BTW-percentage ontbreekt`);
  else if (!validNumericString(vat.percentage, true)) errors.push(`${label}: BTW-percentage is ongeldig`);
 });
}
