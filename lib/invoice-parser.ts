import { GoogleGenerativeAI } from "@google/generative-ai";

export const INVOICE_PARSER_MODEL = "gemini-2.5-flash";

function isGeminiModelUnavailableError(error: unknown) {
 const message = error instanceof Error ? error.message : String(error);
 return /model|not found|not supported|not available|not recognized|unknown|404/i.test(message);
}

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
 "phone": "+31612345678"
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
}

export async function parseInvoicePDF(pdfBase64: string): Promise<ParsedInvoice> {
 const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
 const model = genAI.getGenerativeModel({ model: INVOICE_PARSER_MODEL });

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
 const cleaned = text.replace(/`json\n?/g, "").replace(/```\n?/g, "").trim();
 return JSON.parse(cleaned) as ParsedInvoice;
 } catch (error) {
 if (isGeminiModelUnavailableError(error)) {
 throw new Error(`Gemini factuurparser-model niet beschikbaar: ${INVOICE_PARSER_MODEL}. Controleer GEMINI_API_KEY en configureer een ondersteund stabiel Gemini-model.`);
 }
 throw error;
 }
}
