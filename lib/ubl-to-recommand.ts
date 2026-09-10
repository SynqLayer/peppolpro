import type { RecommandInvoiceDocument } from "./recommand-invoice";
import type { RecommandCreditNoteDocument } from "./recommand-credit-note";
import { payableAmountFromUbl } from "./ubl-amounts.ts";

export type RecommandInvoicePayloadFromUbl = {
 recipient: string;
 documentType: "invoice";
 document: RecommandInvoiceDocument;
 currency: string;
 payableAmount: number | null;
};

export type RecommandCreditNotePayloadFromUbl = {
 recipient: string;
 documentType: "creditNote";
 document: RecommandCreditNoteDocument;
 currency: string;
 payableAmount: number | null;
};

export type RecommandPayloadFromUbl = RecommandInvoicePayloadFromUbl | RecommandCreditNotePayloadFromUbl;

function decodeXml(value: string) {
 return value
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, "&")
  .trim();
}

function firstTag(xml: string, tag: string) {
 const match = xml.match(new RegExp(`<(?:[A-Za-z0-9_-]+:)?${tag}\\b(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${tag}>`, "i"));
 return match ? decodeXml(match[1]) : "";
}

function section(xml: string, tag: string) {
 const match = xml.match(new RegExp(`<(?:[A-Za-z0-9_-]+:)?${tag}\\b(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${tag}>`, "i"));
 return match?.[1] || "";
}

function sections(xml: string, tag: string) {
 return [...xml.matchAll(new RegExp(`<(?:[A-Za-z0-9_-]+:)?${tag}\\b(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${tag}>`, "gi"))].map((match) => match[1]);
}

function endpoint(xml: string) {
 const match = xml.match(/<(?:[A-Za-z0-9_-]+:)?EndpointID\b\s+[^>]*schemeID=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?EndpointID>/i);
 return match ? `${match[1]}:${decodeXml(match[2])}` : "";
}

function fixedDecimal(value: string) {
 const number = Number(value);
 return Number.isFinite(number) ? number.toFixed(2) : value;
}

function party(sectionXml: string) {
 const partyXml = section(sectionXml, "Party");
 const postal = section(partyXml, "PostalAddress");
 return {
  vatNumber: firstTag(section(partyXml, "PartyTaxScheme"), "CompanyID"),
  name: firstTag(partyXml, "RegistrationName") || firstTag(section(partyXml, "PartyName"), "Name"),
  street: firstTag(postal, "StreetName"),
  city: firstTag(postal, "CityName"),
  postalZone: firstTag(postal, "PostalZone"),
  country: firstTag(section(postal, "Country"), "IdentificationCode"),
 };
}

function linesFromUbl(ublXml: string, lineTag: "InvoiceLine" | "CreditNoteLine", quantityTag: "InvoicedQuantity" | "CreditedQuantity") {
 return sections(ublXml, lineTag).map((lineXml) => {
  const item = section(lineXml, "Item");
  const tax = section(item, "ClassifiedTaxCategory");
  return {
   name: firstTag(item, "Name") || firstTag(item, "Description"),
   description: firstTag(item, "Description") || firstTag(item, "Name"),
   quantity: firstTag(lineXml, quantityTag),
   netPriceAmount: firstTag(section(lineXml, "Price"), "PriceAmount"),
   vat: {
    category: firstTag(tax, "ID"),
    percentage: fixedDecimal(firstTag(tax, "Percent")),
   },
  };
 });
}

export function buildRecommandPayloadFromUbl(ublXml: string): RecommandPayloadFromUbl {
 const supplierSection = section(ublXml, "AccountingSupplierParty");
 const customerSection = section(ublXml, "AccountingCustomerParty");
 const customerParty = section(customerSection, "Party");
 const recipient = endpoint(customerParty);
 const currency = firstTag(ublXml, "DocumentCurrencyCode") || "EUR";
 const payableAmount = payableAmountFromUbl(ublXml);
 const common = {
  issueDate: firstTag(ublXml, "IssueDate"),
  seller: party(supplierSection),
  buyer: party(customerSection),
 };
 const isCreditNote = /<(?:[A-Za-z0-9_-]+:)?CreditNote\b/i.test(ublXml)
  && !/<(?:[A-Za-z0-9_-]+:)?Invoice\b/i.test(ublXml);

 if (isCreditNote) {
  const invoiceReference = section(section(ublXml, "BillingReference"), "InvoiceDocumentReference");
  const originalInvoiceId = firstTag(invoiceReference, "ID");
  const originalIssueDate = firstTag(invoiceReference, "IssueDate");
  const document: RecommandCreditNoteDocument = {
   creditNoteNumber: firstTag(ublXml, "ID"),
   issueDate: common.issueDate,
   note: "Creditfactuur verzonden via PeppolPro.",
   invoiceReferences: originalInvoiceId ? [{
    id: originalInvoiceId,
    ...(originalIssueDate ? { issueDate: originalIssueDate } : {}),
   }] : [],
   seller: common.seller,
   buyer: common.buyer,
   lines: linesFromUbl(ublXml, "CreditNoteLine", "CreditedQuantity"),
  };
  return { recipient, documentType: "creditNote", document, currency, payableAmount };
 }

 const document: RecommandInvoiceDocument = {
  invoiceNumber: firstTag(ublXml, "ID"),
  issueDate: common.issueDate,
  dueDate: firstTag(ublXml, "DueDate"),
  note: "Factuur verzonden via PeppolPro.",
  seller: common.seller,
  buyer: common.buyer,
  paymentMeans: [{ iban: firstTag(section(ublXml, "PayeeFinancialAccount"), "ID") }],
  lines: linesFromUbl(ublXml, "InvoiceLine", "InvoicedQuantity"),
 };
 return { recipient, documentType: "invoice", document, currency, payableAmount };
}
