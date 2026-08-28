import type { RecommandInvoiceDocument } from "./recommand-invoice";

export type RecommandPayloadFromUbl = {
 recipient: string;
 document: RecommandInvoiceDocument;
};

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

export function buildRecommandPayloadFromUbl(ublXml: string): RecommandPayloadFromUbl {
 const supplierSection = section(ublXml, "AccountingSupplierParty");
 const customerSection = section(ublXml, "AccountingCustomerParty");
 const customerParty = section(customerSection, "Party");
 const recipient = endpoint(customerParty);
 const document: RecommandInvoiceDocument = {
  invoiceNumber: firstTag(ublXml, "ID"),
  issueDate: firstTag(ublXml, "IssueDate"),
  dueDate: firstTag(ublXml, "DueDate"),
  note: "Factuur verzonden via PeppolPro.",
  seller: party(supplierSection),
  buyer: party(customerSection),
  paymentMeans: [{ iban: firstTag(section(ublXml, "PayeeFinancialAccount"), "ID") }],
  lines: sections(ublXml, "InvoiceLine").map((lineXml) => {
   const item = section(lineXml, "Item");
   const tax = section(item, "ClassifiedTaxCategory");
   return {
    name: firstTag(item, "Name") || firstTag(item, "Description"),
    description: firstTag(item, "Description") || firstTag(item, "Name"),
    quantity: firstTag(lineXml, "InvoicedQuantity"),
    netPriceAmount: firstTag(section(lineXml, "Price"), "PriceAmount"),
    vat: {
     category: firstTag(tax, "ID"),
     percentage: fixedDecimal(firstTag(tax, "Percent")),
    },
   };
  }),
 };
 return { recipient, document };
}
