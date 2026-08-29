import type { ParsedInvoice } from "./invoice-parser";
import type { InvoiceData, InvoiceLine } from "./ubl-generator";
import { validateInvoiceData } from "./ubl-validator.ts";
import type { ValidationResult } from "./ubl-validator";

export type ConversionDraftAssumption = {
 field: string;
 label: string;
 reason: string;
 value: string;
};

export type ConversionDraftPreview = {
 id: string;
 filename: string;
 invoiceData: InvoiceData;
 assumptions: ConversionDraftAssumption[];
 expiresAt: string;
};

export const CONVERSION_DRAFT_RETENTION_DAYS = 14;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function cleanText(value: unknown): string {
 return String(value ?? "").replace(CONTROL_CHARS, "").trim();
}

function cleanCountry(value: unknown, fallback = "NL") {
 const text = cleanText(value).toUpperCase();
 return text || fallback;
}

function cleanCurrency(value: unknown) {
 return cleanText(value).toUpperCase() || "EUR";
}

function cleanNumber(value: unknown, fallback = 0) {
 const n = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
 return Number.isFinite(n) ? n : fallback;
}

function cleanDate(value: unknown) {
 const text = cleanText(value);
 return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function assumption(field: string, label: string, reason: string, value: string): ConversionDraftAssumption {
 return { field, label, reason, value };
}

export function conversionDraftExpiresAt(now = new Date()) {
 return new Date(now.getTime() + CONVERSION_DRAFT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function parsedInvoiceToDraft(parsed: ParsedInvoice, now = new Date()): { invoiceData: InvoiceData; assumptions: ConversionDraftAssumption[] } {
 const assumptions: ConversionDraftAssumption[] = [];
 const today = now.toISOString().slice(0, 10);
 const invoiceDate = cleanDate(parsed.invoice?.date) || today;
 const dueDate = cleanDate(parsed.invoice?.due_date) || invoiceDate;
 const currency = cleanCurrency(parsed.invoice?.currency);
 const invoiceNumber = cleanText(parsed.invoice?.number);
 const customerEmail = cleanText(parsed.buyer?.email);

 if (!cleanDate(parsed.invoice?.date)) assumptions.push(assumption("invoiceDate", "Factuurdatum", "Niet betrouwbaar gelezen; ingevuld met vandaag.", invoiceDate));
 if (!cleanDate(parsed.invoice?.due_date)) assumptions.push(assumption("dueDate", "Vervaldatum", "Niet betrouwbaar gelezen; ingevuld met factuurdatum.", dueDate));
 if (!cleanText(parsed.invoice?.number)) assumptions.push(assumption("invoiceNumber", "Factuurnummer", "Niet gelezen; vul dit zelf aan.", invoiceNumber));
 if (!cleanText(parsed.invoice?.currency)) assumptions.push(assumption("currency", "Valuta", "Niet gelezen; ingevuld met EUR.", currency));
 if (!customerEmail) assumptions.push(assumption("customerEmail", "E-mailadres ontvanger", "Niet gelezen; vul dit zelf aan.", ""));

 const lines = Array.isArray(parsed.lines) ? parsed.lines.map((line, index): InvoiceLine => ({
  id: String(index + 1),
  description: cleanText(line?.description),
  quantity: Math.max(0, cleanNumber(line?.quantity, 0)),
  unitPrice: Math.max(0, cleanNumber(line?.unit_price, 0)),
  vatPct: cleanNumber(line?.vat_rate, 21),
 })) : [];
 if (lines.length === 0) assumptions.push(assumption("lines", "Factuurregels", "Geen regels betrouwbaar gelezen; voeg minimaal één regel toe.", ""));

 const invoiceData: InvoiceData = {
  supplierName: cleanText(parsed.seller?.name),
  supplierAddress: cleanText(parsed.seller?.address),
  supplierPostalCode: cleanText(parsed.seller?.postal_code),
  supplierCity: cleanText(parsed.seller?.city),
  supplierCountry: cleanCountry(parsed.seller?.country),
  supplierVatNr: cleanText(parsed.seller?.btw_number),
  supplierKvkKbo: cleanText(parsed.seller?.kvk_number),
  supplierIban: cleanText(parsed.seller?.iban),
  customerName: cleanText(parsed.buyer?.name),
  customerAddress: cleanText(parsed.buyer?.address),
  customerPostalCode: cleanText(parsed.buyer?.postal_code),
  customerCity: cleanText(parsed.buyer?.city),
  customerCountry: cleanCountry(parsed.buyer?.country),
  customerVatNr: cleanText(parsed.buyer?.btw_number),
  customerKvkKbo: cleanText(parsed.buyer?.kvk_number),
  customerPeppolId: cleanText(parsed.buyer?.peppol_id),
  customerEmail,
  buyerReference: cleanText(parsed.invoice?.reference),
  invoiceNumber,
  invoiceDate,
  dueDate,
  currency,
  lines,
 };

 for (const item of parsed.assumptions || []) {
  const field = cleanText(item?.field);
  if (field) assumptions.push(assumption(field, cleanText(item?.label) || field, cleanText(item?.reason) || "Parser-aanname.", cleanText(item?.value)));
 }
 return { invoiceData, assumptions };
}

export function validateParsedInvoiceForConversion(data: InvoiceData): ValidationResult {
 return validateInvoiceData(data);
}

export function publicDraftPayload(draft: { id: string; filename: string | null; invoice_data: unknown; assumptions: unknown; expires_at: string | null; }): ConversionDraftPreview {
 return {
  id: draft.id,
  filename: draft.filename || "factuur.pdf",
  invoiceData: draft.invoice_data as InvoiceData,
  assumptions: Array.isArray(draft.assumptions) ? draft.assumptions as ConversionDraftAssumption[] : [],
  expiresAt: draft.expires_at || "",
 };
}
