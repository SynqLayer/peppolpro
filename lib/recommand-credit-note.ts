import type { RecommandInvoiceLine } from "./recommand-invoice";
import { requireString, validateRecommandLines, validateRecommandParty } from "./recommand-validation.ts";

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
 buyerReference: string;
 note?: string;
 invoiceReferences: Array<{ id: string; issueDate?: string }>;
 seller: RecommandParty;
 buyer: RecommandParty;
 lines: RecommandInvoiceLine[];
};

type StringRecord = Record<string, unknown>;

export function validateRecommandCreditNoteDocument(value: unknown): string[] {
 const errors: string[] = [];
 if (!value || typeof value !== "object" || Array.isArray(value)) return ["Documentpayload ontbreekt"];
 const document = value as StringRecord;
 requireString(document, "creditNoteNumber", "Creditfactuurnummer", errors);
 requireString(document, "issueDate", "Creditfactuurdatum", errors);
 requireString(document, "buyerReference", "Klantreferentie", errors);

 if (Array.isArray(document.invoiceReferences) && document.invoiceReferences.length > 0) {
  const reference = document.invoiceReferences[0];
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
   errors.push("Oorspronkelijk factuurnummer ontbreekt");
  } else {
   requireString(reference as StringRecord, "id", "Oorspronkelijk factuurnummer", errors);
  }
 }

 validateRecommandParty(document.seller, "Leverancier", true, errors);
 validateRecommandParty(document.buyer, "Klant", true, errors);
 validateRecommandLines(document.lines, errors);
 return errors;
}
