import type { RecommandInvoiceLine } from "./recommand-invoice";

export type RecommandParty = {
 vatNumber: string;
 enterpriseNumber: string;
 enterpriseNumberScheme: string;
 name: string;
 street: string;
 city: string;
 postalZone: string;
 country: string;
};

export type RecommandCreditNoteDocument = {
 creditNoteNumber: string;
 issueDate: string;
 buyerReference?: string;
 note?: string;
 invoiceReferences: Array<{ id: string; issueDate?: string }>;
 seller: RecommandParty;
 buyer: RecommandParty;
 lines: RecommandInvoiceLine[];
};

type StringRecord = Record<string, unknown>;

function requireString(obj: StringRecord, key: string, label: string, errors: string[]) {
 if (typeof obj[key] !== "string" || !obj[key].trim()) errors.push(`${label} ontbreekt`);
}

export function validateRecommandCreditNoteDocument(value: unknown): string[] {
 const errors: string[] = [];
 if (!value || typeof value !== "object" || Array.isArray(value)) return ["Documentpayload ontbreekt"];
 const document = value as StringRecord;
 requireString(document, "creditNoteNumber", "Creditfactuurnummer", errors);
 requireString(document, "issueDate", "Creditfactuurdatum", errors);

 if (Array.isArray(document.invoiceReferences) && document.invoiceReferences.length > 0) {
  const reference = document.invoiceReferences[0];
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
   errors.push("Oorspronkelijk factuurnummer ontbreekt");
  } else {
   requireString(reference as StringRecord, "id", "Oorspronkelijk factuurnummer", errors);
  }
 }

 for (const [key, label] of [["seller", "Leverancier"], ["buyer", "Klant"]] as const) {
  const party = document[key];
  if (!party || typeof party !== "object" || Array.isArray(party)) {
   errors.push(`${label}: gegevens ontbreken`);
   continue;
  }
  const partyObj = party as StringRecord;
  requireString(partyObj, "name", `${label}: naam`, errors);
  requireString(partyObj, "street", `${label}: adres`, errors);
  requireString(partyObj, "postalZone", `${label}: postcode`, errors);
  requireString(partyObj, "city", `${label}: plaats`, errors);
  requireString(partyObj, "country", `${label}: land`, errors);
  requireString(partyObj, "vatNumber", `${label}: BTW-nummer`, errors);
 }

 if (!Array.isArray(document.lines) || document.lines.length === 0) {
  errors.push("Minimaal één creditfactuurregel vereist");
 }
 return errors;
}
