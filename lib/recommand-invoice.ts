import type { InvoiceData } from "./ubl-generator";

export type RecommandInvoiceLine = {
 name: string;
 description: string;
 quantity: string;
 netPriceAmount: string;
 vat: { category?: string; percentage: string };
};

export type RecommandInvoiceDocument = {
 invoiceNumber: string;
 issueDate: string;
 dueDate: string;
 note?: string;
 buyer: {
  vatNumber: string;
  name: string;
  street: string;
  city: string;
  postalZone: string;
  country: string;
 };
 seller?: {
  vatNumber: string;
  name: string;
  street: string;
  city: string;
  postalZone: string;
  country: string;
 };
 paymentMeans: Array<{ iban: string }>;
 lines: RecommandInvoiceLine[];
};

type StringRecord = Record<string, unknown>;

function clean(value: string | undefined | null) {
 return (value || "").trim();
}

function normalizeIdentifier(value: string) {
 return value.trim().toUpperCase().replace(/\s+/g, "");
}

function splitPeppolPrefix(value: string) {
 const match = normalizeIdentifier(value).match(/^(\d{4}):(.*)$/);
 return match ? { scheme: match[1], value: match[2] } : null;
}

export function deriveRecommandRecipient(data: InvoiceData): string {
 const explicit = clean(data.customerPeppolId);
 if (explicit) {
  const prefixed = splitPeppolPrefix(explicit);
  if (prefixed?.scheme && prefixed.value) return `${prefixed.scheme}:${prefixed.value}`;
  throw new Error("Klant: Peppol-ID moet het formaat scheme:nummer hebben, bijvoorbeeld 0208:0674771986");
 }

 const kboOrKvk = normalizeIdentifier(clean(data.customerKvkKbo));
 if (/^\d{10}$/.test(kboOrKvk)) return `0208:${kboOrKvk}`;
 if (/^\d{8}$/.test(kboOrKvk)) return `0106:${kboOrKvk}`;

 const vat = normalizeIdentifier(clean(data.customerVatNr));
 if (/^BE\d{10}$/.test(vat)) return `0208:${vat.slice(2)}`;
 if (/^NL[A-Z0-9]+$/.test(vat)) return `9944:${vat}`;

 throw new Error("Klant: Peppol-ID ontbreekt of kan niet veilig worden afgeleid. Vul een Peppol-ID in zoals 0208:0674771986.");
}

export function validateRecommandInvoiceData(data: InvoiceData): string[] {
 const errors: string[] = [];
 const required: Array<[string, string | undefined]> = [
  ["Leverancier: naam ontbreekt", data.supplierName],
  ["Leverancier: adres ontbreekt", data.supplierAddress],
  ["Leverancier: postcode ontbreekt", data.supplierPostalCode],
  ["Leverancier: plaats ontbreekt", data.supplierCity],
  ["Leverancier: land ontbreekt", data.supplierCountry],
  ["Leverancier: BTW-nummer ontbreekt", data.supplierVatNr],
  ["Leverancier: IBAN ontbreekt", data.supplierIban],
  ["Klant: naam ontbreekt", data.customerName],
  ["Klant: adres ontbreekt", data.customerAddress],
  ["Klant: postcode ontbreekt", data.customerPostalCode],
  ["Klant: plaats ontbreekt", data.customerCity],
  ["Klant: land ontbreekt", data.customerCountry],
  ["Klant: BTW-nummer ontbreekt", data.customerVatNr],
  ["Factuurnummer ontbreekt", data.invoiceNumber],
  ["Factuurdatum ontbreekt", data.invoiceDate],
  ["Vervaldatum ontbreekt", data.dueDate],
 ];

 required.forEach(([message, value]) => {
  if (!clean(value).length) errors.push(message);
 });

 if (!data.lines?.length) errors.push("Minimaal één factuurregel vereist");
 data.lines?.forEach((line, index) => {
  const row = index + 1;
  if (!clean(line.description).length) errors.push(`Regel ${row}: omschrijving ontbreekt`);
  if (line.quantity <= 0) errors.push(`Regel ${row}: aantal moet > 0 zijn`);
  if (line.unitPrice < 0) errors.push(`Regel ${row}: prijs mag niet negatief zijn`);
 });

 try {
  deriveRecommandRecipient(data);
 } catch (error) {
  errors.push(error instanceof Error ? error.message : "Klant: Peppol-ID ontbreekt");
 }

 return errors;
}

export function buildRecommandInvoiceDocument(data: InvoiceData): RecommandInvoiceDocument {
 const errors = validateRecommandInvoiceData(data);
 if (errors.length > 0) {
  throw new Error(errors.join("\n"));
 }

 return {
  invoiceNumber: clean(data.invoiceNumber),
  issueDate: clean(data.invoiceDate),
  dueDate: clean(data.dueDate),
  note: "Factuur verzonden via PeppolPro.",
  seller: {
   vatNumber: normalizeIdentifier(clean(data.supplierVatNr)),
   name: clean(data.supplierName),
   street: clean(data.supplierAddress),
   city: clean(data.supplierCity),
   postalZone: clean(data.supplierPostalCode),
   country: clean(data.supplierCountry).toUpperCase(),
  },
  buyer: {
   vatNumber: normalizeIdentifier(clean(data.customerVatNr)),
   name: clean(data.customerName),
   street: clean(data.customerAddress),
   city: clean(data.customerCity),
   postalZone: clean(data.customerPostalCode),
   country: clean(data.customerCountry).toUpperCase(),
  },
  paymentMeans: [{ iban: clean(data.supplierIban) }],
  lines: data.lines.map((line) => ({
   name: clean(line.description),
   description: clean(line.description),
   quantity: String(line.quantity),
   netPriceAmount: line.unitPrice.toFixed(2),
   vat: {
    category: line.vatPct === 0 ? "Z" : "S",
    percentage: line.vatPct.toFixed(2),
   },
  })),
 };
}

function requireString(obj: StringRecord, key: string, label: string, errors: string[]) {
 if (typeof obj[key] !== "string" || !obj[key].trim()) errors.push(`${label} ontbreekt`);
}

export function validateRecommandInvoiceDocument(value: unknown): string[] {
 const errors: string[] = [];
 if (!value || typeof value !== "object" || Array.isArray(value)) return ["Documentpayload ontbreekt"];
 const document = value as StringRecord;
 requireString(document, "invoiceNumber", "Factuurnummer", errors);
 requireString(document, "issueDate", "Factuurdatum", errors);
 requireString(document, "dueDate", "Vervaldatum", errors);

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

 if (!Array.isArray(document.paymentMeans) || document.paymentMeans.length === 0) {
  errors.push("Leverancier: IBAN ontbreekt");
 }
 if (!Array.isArray(document.lines) || document.lines.length === 0) {
  errors.push("Minimaal één factuurregel vereist");
 }
 return errors;
}
