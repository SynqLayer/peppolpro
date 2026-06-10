import { InvoiceData } from "./ubl-generator";

export interface ValidationResult {
 valid: boolean;
 errors: string[];
}

export function validateInvoiceData(data: InvoiceData): ValidationResult {
 const errors: string[] = [];

 if (!data.supplierName?.trim()) errors.push("Leverancier: naam ontbreekt");
 if (!data.supplierVatNr?.trim()) errors.push("Leverancier: BTW-nummer ontbreekt");
 if (!data.supplierKvkKbo?.trim()) errors.push("Leverancier: KvK/KBO ontbreekt");
 if (!data.supplierIban?.trim()) errors.push("Leverancier: IBAN ontbreekt");
 if (!data.supplierCountry?.trim()) errors.push("Leverancier: land ontbreekt");

 if (!data.customerName?.trim()) errors.push("Klant: naam ontbreekt");
 if (!data.customerVatNr?.trim()) errors.push("Klant: BTW-nummer ontbreekt");
 if (!data.customerCountry?.trim()) errors.push("Klant: land ontbreekt");

 if (!data.invoiceNumber?.trim()) errors.push("Factuurnummer ontbreekt");
 if (!data.invoiceDate?.trim()) errors.push("Factuurdatum ontbreekt");
 if (!data.dueDate?.trim()) errors.push("Vervaldatum ontbreekt");

 if (!data.lines || data.lines.length === 0) {
 errors.push("Minimaal één factuurregel vereist");
 }

 data.lines?.forEach((line, index) => {
 const row = index + 1;
 if (!line.description?.trim()) errors.push(`Regel ${row}: omschrijving ontbreekt`);
 if (line.quantity <= 0) errors.push(`Regel ${row}: aantal moet > 0 zijn`);
 if (line.unitPrice < 0) errors.push(`Regel ${row}: prijs mag niet negatief zijn`);
 if (![0, 6, 9, 21].includes(line.vatPct)) {
 errors.push(`Regel ${row}: BTW-tarief ${line.vatPct}% is ongebruikelijk, controleer`);
 }
 });

 return { valid: errors.length === 0, errors };
}
