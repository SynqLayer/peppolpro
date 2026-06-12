import { InvoiceData } from "./ubl-generator";

export type UblSummary = {
 customerName: string | null;
 invoiceNumber: string | null;
 totalAmount: number | null;
 currency: string;
};

const decodeXml = (value: string) => value
 .replace(/&apos;/g, "'")
 .replace(/&quot;/g, "\"")
 .replace(/&gt;/g, ">")
 .replace(/&lt;/g, "<")
 .replace(/&amp;/g, "&");

const sumInvoiceTotal = (invoiceData: InvoiceData) => {
 const total = invoiceData.lines.reduce((sum, line) => {
 const excl = line.quantity * line.unitPrice;
 return sum + excl + excl * (line.vatPct / 100);
 }, 0);
 return Math.round(total * 100) / 100;
};

export function parseUblSummary(ublXml: string): UblSummary {
 const invoiceNumber = ublXml.match(/<cbc:ID>([^<]+)<\/cbc:ID>/)?.[1] ?? null;
 const customerBlock = ublXml.match(/<cac:AccountingCustomerParty>[\s\S]*?<\/cac:AccountingCustomerParty>/)?.[0] ?? "";
 const customerName = customerBlock.match(/<cac:PartyName>\s*<cbc:Name>([^<]*)<\/cbc:Name>/)?.[1] ?? null;
 const payable = ublXml.match(/<cbc:PayableAmount currencyID="([^"]+)">([0-9]+(?:\.[0-9]+)?)<\/cbc:PayableAmount>/);

 return {
 customerName: customerName ? decodeXml(customerName) : null,
 invoiceNumber: invoiceNumber ? decodeXml(invoiceNumber) : null,
 totalAmount: payable ? Number(payable[2]) : null,
 currency: payable?.[1] || "EUR",
 };
}

export function summarizeInvoiceData(invoiceData: InvoiceData): UblSummary {
 return {
 customerName: invoiceData.customerName || null,
 invoiceNumber: invoiceData.invoiceNumber || null,
 totalAmount: sumInvoiceTotal(invoiceData),
 currency: invoiceData.currency || "EUR",
 };
}
