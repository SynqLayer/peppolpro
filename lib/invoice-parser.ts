import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const DEFAULT_INVOICE_PARSER_MODEL = "gemini-2.5-flash";
export const INVOICE_PARSER_MODEL = process.env.GEMINI_MODEL || DEFAULT_INVOICE_PARSER_MODEL;

export type InvoiceParserErrorKind = "unreadable_pdf" | "unexpected_response" | "service_unavailable";

export class InvoiceParserError extends Error {
 kind: InvoiceParserErrorKind;
 responsePreview?: string;
 causeMessage?: string;

 constructor(kind: InvoiceParserErrorKind, message: string, options: { responsePreview?: string; cause?: unknown } = {}) {
  super(message);
  this.name = "InvoiceParserError";
  this.kind = kind;
  this.responsePreview = options.responsePreview;
  this.causeMessage = options.cause instanceof Error ? options.cause.message : options.cause ? String(options.cause) : undefined;
 }
}

function isGeminiModelUnavailableError(error: unknown) {
 const message = error instanceof Error ? error.message : String(error);
 return /model|not found|not supported|not available|not recognized|unknown|404/i.test(message);
}

function isGeminiTemporaryError(error: unknown) {
 const message = error instanceof Error ? error.message : String(error);
 const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : undefined;
 return status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || /quota|rate limit|resource exhausted|temporar|timeout|unavailable|overloaded/i.test(message);
}

function responsePreview(text: string) {
 return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

const invoiceResponseSchema = {
 type: SchemaType.OBJECT,
 properties: {
  seller: {
   type: SchemaType.OBJECT,
   properties: {
    name: { type: SchemaType.STRING, nullable: true },
    address: { type: SchemaType.STRING, nullable: true },
    postal_code: { type: SchemaType.STRING, nullable: true },
    city: { type: SchemaType.STRING, nullable: true },
    country: { type: SchemaType.STRING, nullable: true },
    kvk_number: { type: SchemaType.STRING, nullable: true },
    btw_number: { type: SchemaType.STRING, nullable: true },
    iban: { type: SchemaType.STRING, nullable: true },
    email: { type: SchemaType.STRING, nullable: true },
    phone: { type: SchemaType.STRING, nullable: true },
   },
  },
  buyer: {
   type: SchemaType.OBJECT,
   properties: {
    name: { type: SchemaType.STRING, nullable: true },
    address: { type: SchemaType.STRING, nullable: true },
    postal_code: { type: SchemaType.STRING, nullable: true },
    city: { type: SchemaType.STRING, nullable: true },
    country: { type: SchemaType.STRING, nullable: true },
    btw_number: { type: SchemaType.STRING, nullable: true },
   },
  },
  invoice: {
   type: SchemaType.OBJECT,
   properties: {
    number: { type: SchemaType.STRING, nullable: true },
    date: { type: SchemaType.STRING, nullable: true },
    due_date: { type: SchemaType.STRING, nullable: true },
    currency: { type: SchemaType.STRING },
    payment_terms: { type: SchemaType.STRING, nullable: true },
    reference: { type: SchemaType.STRING, nullable: true },
   },
  },
  lines: {
   type: SchemaType.ARRAY,
   items: {
    type: SchemaType.OBJECT,
    properties: {
     description: { type: SchemaType.STRING },
     quantity: { type: SchemaType.NUMBER },
     unit_price: { type: SchemaType.NUMBER },
     vat_rate: { type: SchemaType.NUMBER },
     vat_amount: { type: SchemaType.NUMBER },
     line_total: { type: SchemaType.NUMBER },
    },
   },
  },
  totals: {
   type: SchemaType.OBJECT,
   properties: {
    subtotal: { type: SchemaType.NUMBER },
    total_vat: { type: SchemaType.NUMBER },
    total: { type: SchemaType.NUMBER },
   },
  },
},
 required: ["seller", "buyer", "invoice", "lines", "totals"],
};

const PARSE_PROMPT = `Je bent een AI die PDF-facturen analyseert. Extraheer ALLE velden.
Geef het resultaat als ALLEEN valid JSON, geen tekst ervoor of erna.

{
 "seller": {
 "name": "Bedrijfsnaam leverancier",
 "address": "Straat + nummer",
 "postal_code": "1234AB",
 "city": "Stad",
 "country": "NL",
 "kvk_number": "12345678",
 "btw_number": "NL123456789B01",
 "iban": "NL00BANK0123456789",
 "email": "email@bedrijf.nl",
 "phone": "+316****5678"
 },
 "buyer": {
 "name": "Bedrijfsnaam klant",
 "address": "Straat + nummer",
 "postal_code": "1234AB",
 "city": "Stad",
 "country": "BE",
 "btw_number": "BE0123456789"
 },
 "invoice": {
 "number": "2026-001",
 "date": "2026-04-07",
 "due_date": "2026-05-07",
 "currency": "EUR",
 "payment_terms": "30 dagen",
 "reference": "PO-12345"
 },
 "lines": [
 {
 "description": "Omschrijving",
 "quantity": 1,
 "unit_price": 100.00,
 "vat_rate": 21,
 "vat_amount": 21.00,
 "line_total": 121.00
 }
 ],
 "totals": {
 "subtotal": 100.00,
 "total_vat": 21.00,
 "total": 121.00
 }
}

REGELS:
- BTW-nummers exact overnemen
- Bedragen als getallen
- Niet-gevonden velden: null
- Datum: YYYY-MM-DD
- Land: ISO 3166-1 alpha-2
- ALLEEN valid JSON teruggeven;`;

export interface ParsedInvoice {
 seller: {
 name: string | null;
 address: string | null;
 postal_code: string | null;
 city: string | null;
 country: string | null;
 kvk_number: string | null;
 btw_number: string | null;
 iban: string | null;
 email: string | null;
 phone: string | null;
 };
 buyer: {
 name: string | null;
 address: string | null;
 postal_code: string | null;
 city: string | null;
 country: string | null;
 btw_number: string | null;
 kvk_number?: string | null;
 peppol_id?: string | null;
 email?: string | null;
 };
 invoice: {
 number: string | null;
 date: string | null;
 due_date: string | null;
 currency: string;
 payment_terms: string | null;
 reference: string | null;
 };
 lines: Array<{
 description: string;
 quantity: number;
 unit_price: number;
 vat_rate: number;
 vat_amount: number;
 line_total: number;
 }>;
 totals: {
 subtotal: number;
 total_vat: number;
 total: number;
 };
 assumptions?: Array<{
 field?: string | null;
 label?: string | null;
 reason?: string | null;
 value?: string | null;
 }>;
}

export function extractFirstJsonValue(text: string) {
 const start = text.search(/[\[{]/);
 if (start === -1) {
  throw new InvoiceParserError("unexpected_response", "Gemini gaf geen JSON-object terug.", { responsePreview: responsePreview(text) });
 }
 const opener = text[start];
 const closer = opener === "{" ? "}" : "]";
 let depth = 0;
 let inString = false;
 let escaped = false;
 for (let index = start; index < text.length; index += 1) {
  const char = text[index];
  if (inString) {
   if (escaped) {
    escaped = false;
   } else if (char === "\\") {
    escaped = true;
   } else if (char === "\"") {
    inString = false;
   }
   continue;
  }
  if (char === "\"") {
   inString = true;
  } else if (char === opener) {
   depth += 1;
  } else if (char === closer) {
   depth -= 1;
   if (depth === 0) return text.slice(start, index + 1);
  }
 }
 throw new InvoiceParserError("unexpected_response", "Gemini gaf onvolledige JSON terug.", { responsePreview: responsePreview(text) });
}

export function parseGeminiInvoiceJson(text: string): ParsedInvoice {
 const jsonText = extractFirstJsonValue(text);
 try {
  return JSON.parse(jsonText) as ParsedInvoice;
 } catch (error) {
  throw new InvoiceParserError("unexpected_response", "Gemini gaf ongeldige JSON terug.", { responsePreview: responsePreview(text), cause: error });
 }
}

export interface ParsedInvoiceValidationResult {
 valid: boolean;
 reasons: string[];
}

export function validateParsedInvoiceForConversion(parsed: ParsedInvoice): ParsedInvoiceValidationResult {
 const reasons: string[] = [];
 const invoiceNumber = parsed.invoice?.number?.trim();
 const customerName = parsed.buyer?.name?.trim();
 const currency = parsed.invoice?.currency?.trim().toUpperCase();
 const total = Number(parsed.totals?.total);
 const lines = Array.isArray(parsed.lines) ? parsed.lines : [];

 if (!invoiceNumber) reasons.push("missing_invoice_number");
 if (!customerName) reasons.push("missing_customer_name");
 if (lines.length === 0) reasons.push("missing_invoice_lines");
 if (!Number.isFinite(total) || total <= 0) reasons.push("missing_or_zero_total");
 if (currency !== "EUR") reasons.push("unsupported_currency");

 return { valid: reasons.length === 0, reasons };
}

export function parsedInvoiceAssumptions(parsed: ParsedInvoice) {
 const assumptions: string[] = [];
 if (!parsed.invoice?.date?.trim()) assumptions.push("invoice_date_defaulted_to_today");
 if (!parsed.invoice?.due_date?.trim()) assumptions.push("due_date_defaulted");
 return assumptions;
}

export function describeInvoiceParserError(error: unknown) {
 if (error instanceof InvoiceParserError) {
  return {
   name: error.name,
   kind: error.kind,
   message: error.message,
   cause: error.causeMessage,
   responsePreview: error.responsePreview,
  };
 }
 if (error instanceof Error) {
  return { name: error.name, message: error.message };
 }
 return { name: "UnknownError", message: String(error) };
}

export async function parseInvoicePDF(pdfBase64: string): Promise<ParsedInvoice> {
 const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
 const model = genAI.getGenerativeModel({
  model: INVOICE_PARSER_MODEL,
  generationConfig: {
   responseMimeType: "application/json",
   responseSchema: invoiceResponseSchema as never,
  },
 });

 try {
  const result = await model.generateContent([
  { text: PARSE_PROMPT },
  {
  inlineData: {
  mimeType: "application/pdf",
  data: pdfBase64,
  },
  },
  ]);

  const text = result.response.text();
  return parseGeminiInvoiceJson(text);
 } catch (error) {
  if (error instanceof InvoiceParserError) throw error;
  if (isGeminiModelUnavailableError(error)) {
   throw new InvoiceParserError("service_unavailable", `Gemini factuurparser-model niet beschikbaar: ${INVOICE_PARSER_MODEL}. Controleer GEMINI_API_KEY en configureer een ondersteund stabiel Gemini-model.`, { cause: error });
  }
  if (isGeminiTemporaryError(error)) {
   throw new InvoiceParserError("service_unavailable", "Gemini factuurparser tijdelijk niet beschikbaar.", { cause: error });
  }
  throw new InvoiceParserError("unreadable_pdf", "PDF kon niet door Gemini worden gelezen.", { cause: error });
 }
}
