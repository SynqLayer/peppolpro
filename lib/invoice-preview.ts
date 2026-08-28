import type { RecommandInvoiceDocument, RecommandInvoiceLine } from "./recommand-invoice";
import { payableAmountFromUbl } from "./ubl-amounts.ts";

export type InvoicePreviewVatTotal = {
 percentage: string;
 taxableAmount: string;
 vatAmount: string;
};

export type InvoicePreview = {
 recipient: string;
 invoiceNumber: string;
 issueDate: string;
 dueDate: string;
 currency: string;
 seller: {
  name: string;
  identifier: string;
 };
 buyer: {
  name: string;
  identifier: string;
  country: string;
  peppolId: string;
 };
 lines: Array<{
  description: string;
  quantity: string;
  netPriceAmount: string;
  vatPercentage: string;
  lineNetAmount: string;
 }>;
 totals: {
  subtotal: string;
  vatByRate: InvoicePreviewVatTotal[];
  total: string;
 };
 dueDateWarning: boolean;
};

export type ConsistencyResult =
 | { ok: true }
 | { ok: false; error: string };

export const INVOICE_TOTAL_MISMATCH_MESSAGE = "Verzenden is geblokkeerd: de opgeslagen factuur komt niet overeen met het geregistreerde totaalbedrag. Maak de factuur opnieuw aan en controleer het overzicht voordat je verzendt.";

function toNumber(value: string | number | null | undefined) {
 if (typeof value === "number") return Number.isFinite(value) ? value : 0;
 const parsed = Number(value || 0);
 return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
 return (Math.round(value * 100) / 100).toFixed(2);
}

function normalizePct(value: string | number | null | undefined) {
 const parsed = toNumber(value);
 return parsed.toFixed(2);
}

function lineNetAmount(line: RecommandInvoiceLine) {
 return toNumber(line.quantity) * toNumber(line.netPriceAmount);
}

function identifier(...values: Array<string | null | undefined>) {
 return values.find((value) => Boolean(value?.trim()))?.trim() || "-";
}

export function computeDocumentTotals(document: RecommandInvoiceDocument) {
 const vatByRate = new Map<string, { taxable: number; vat: number }>();
 let subtotal = 0;
 for (const line of document.lines) {
  const lineNet = lineNetAmount(line);
  const pct = normalizePct(line.vat.percentage);
  const lineVat = Math.round(lineNet * (toNumber(pct) / 100) * 100) / 100;
  subtotal += lineNet;
  const current = vatByRate.get(pct) || { taxable: 0, vat: 0 };
  current.taxable += lineNet;
  current.vat += lineVat;
  vatByRate.set(pct, current);
 }
 const vatTotal = [...vatByRate.values()].reduce((sum, item) => sum + item.vat, 0);
 return {
  subtotal: money(subtotal),
  vatByRate: [...vatByRate.entries()].map(([percentage, item]) => ({
   percentage,
   taxableAmount: money(item.taxable),
   vatAmount: money(item.vat),
  })),
  total: money(subtotal + vatTotal),
 };
}

export function buildInvoicePreviewFromPayload(recipient: string, document: RecommandInvoiceDocument, currency = "EUR"): InvoicePreview {
 const totals = computeDocumentTotals(document);
 return {
  recipient,
  invoiceNumber: document.invoiceNumber,
  issueDate: document.issueDate,
  dueDate: document.dueDate,
  currency,
  seller: {
   name: document.seller?.name || "-",
   identifier: identifier(document.seller?.vatNumber),
  },
  buyer: {
   name: document.buyer.name,
   identifier: identifier(document.buyer.vatNumber),
   country: document.buyer.country,
   peppolId: recipient,
  },
  lines: document.lines.map((line) => ({
   description: line.description || line.name,
   quantity: line.quantity,
   netPriceAmount: money(toNumber(line.netPriceAmount)),
   vatPercentage: normalizePct(line.vat.percentage),
   lineNetAmount: money(lineNetAmount(line)),
  })),
  totals,
  dueDateWarning: Boolean(document.issueDate && document.dueDate && new Date(document.dueDate).getTime() <= new Date(document.issueDate).getTime()),
 };
}

export function validateStoredInvoiceConsistency(totalAmount: string | number | null | undefined, ublXml: string | null | undefined): ConsistencyResult {
 if (!ublXml) return { ok: true };
 const payable = payableAmountFromUbl(ublXml);
 if (payable === null || totalAmount === null || totalAmount === undefined) return { ok: true };
 const registeredTotal = Math.round(toNumber(totalAmount) * 100);
 const ublTotal = Math.round(payable * 100);
 if (registeredTotal !== ublTotal) return { ok: false, error: INVOICE_TOTAL_MISMATCH_MESSAGE };
 return { ok: true };
}
