import type { InvoiceData } from "./ubl-generator";

export interface ValidationResult {
 valid: boolean;
 errors: string[];
}

export function validateInvoiceData(data: InvoiceData): ValidationResult {
 const errors: string[] = [];

 const textFields: Array<[string, string | undefined]> = [
 ["Leverancier: naam", data.supplierName],
 ["Leverancier: adres", data.supplierAddress],
 ["Leverancier: postcode", data.supplierPostalCode],
 ["Leverancier: plaats", data.supplierCity],
 ["Leverancier: land", data.supplierCountry],
 ["Leverancier: BTW-nummer", data.supplierVatNr],
 ["Leverancier: KvK/KBO", data.supplierKvkKbo],
 ["Leverancier: IBAN", data.supplierIban],
 ["Leverancier: Peppol-ID", data.supplierPeppolId],
 ["Klant: naam", data.customerName],
 ["Klant: adres", data.customerAddress],
 ["Klant: postcode", data.customerPostalCode],
 ["Klant: plaats", data.customerCity],
 ["Klant: land", data.customerCountry],
 ["Klant: BTW-nummer", data.customerVatNr],
 ["Klant: KvK/KBO", data.customerKvkKbo],
 ["Klant: Peppol-ID", data.customerPeppolId],
 ["Klant: e-mailadres ontvanger", data.customerEmail],
 ["Klant: referentie", data.buyerReference],
 ["Factuurnummer", data.invoiceNumber],
 ["Factuurdatum", data.invoiceDate],
 ["Vervaldatum", data.dueDate],
 ["Valuta", data.currency],
 ];

 textFields.forEach(([label, value]) => {
 if (typeof value === "string" && /[\u0000-\u001F\u007F]/.test(value)) errors.push(`${label} bevat een ongeldig teken`);
 });

 if (!data.supplierName?.trim()) errors.push("Leverancier: naam ontbreekt");
 if (!data.supplierVatNr?.trim()) errors.push("Leverancier: BTW-nummer ontbreekt");
 if (!data.supplierKvkKbo?.trim()) errors.push("Leverancier: KvK/KBO ontbreekt");
 if (!data.supplierIban?.trim()) errors.push("Leverancier: IBAN ontbreekt");
 if (!data.supplierCountry?.trim()) errors.push("Leverancier: land ontbreekt");

 if (!data.customerName?.trim()) errors.push("Klant: naam ontbreekt");
 if (!data.customerEmail?.trim()) {
 errors.push("Klant: e-mailadres ontvanger ontbreekt");
 } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail.trim())) {
 errors.push("Klant: e-mailadres ontvanger is ongeldig");
 }
 if (!data.customerVatNr?.trim()) errors.push("Klant: BTW-nummer ontbreekt");
 if (!data.customerCountry?.trim()) errors.push("Klant: land ontbreekt");

 if (!data.invoiceNumber?.trim()) errors.push("Factuurnummer ontbreekt");
 if (!data.invoiceDate?.trim()) errors.push("Factuurdatum ontbreekt");
 if (!data.dueDate?.trim()) errors.push("Vervaldatum ontbreekt");
 if ((data.currency || "").trim().toUpperCase() !== "EUR") errors.push("Alleen EUR-facturen worden ondersteund");

 if (!data.lines || data.lines.length === 0) {
 errors.push("Minimaal één factuurregel vereist");
 }

 data.lines?.forEach((line, index) => {
 const row = index + 1;
 if (!line.description?.trim()) errors.push(`Regel ${row}: omschrijving ontbreekt`);
 if (/[\u0000-\u001F\u007F]/.test(line.description || "")) errors.push(`Regel ${row}: omschrijving bevat een ongeldig teken`);
 if (line.quantity <= 0) errors.push(`Regel ${row}: aantal moet > 0 zijn`);
 if (line.unitPrice < 0) errors.push(`Regel ${row}: prijs mag niet negatief zijn`);
 if (![0, 6, 9, 21].includes(line.vatPct)) {
 errors.push(`Regel ${row}: BTW-tarief ${line.vatPct}% is ongebruikelijk, controleer`);
 }
 });

 return { valid: errors.length === 0, errors };
}
