export interface InvoiceLine {
 id: string;
 description: string;
 quantity: number;
 unitPrice: number;
 vatPct: number;
}

export interface InvoiceData {
 // Leverancier
 supplierName: string;
 supplierAddress: string;
 supplierPostalCode?: string;
 supplierCity: string;
 supplierCountry: string;
 supplierVatNr: string;
 supplierKvkKbo: string;
 supplierIban: string;
 supplierPeppolId?: string;
 // Klant
 customerName: string;
 customerAddress: string;
 customerPostalCode?: string;
 customerCity: string;
 customerCountry: string;
 customerVatNr: string;
 customerKvkKbo?: string;
 customerPeppolId?: string;
 customerEmail: string;
 buyerReference?: string;
 // Factuur
 documentType?: "invoice" | "creditNote";
 invoiceNumber: string;
 invoiceDate: string;
 dueDate: string;
 originalInvoiceNumber?: string;
 originalInvoiceDate?: string;
 currency: string;
 lines: InvoiceLine[];
}

type Endpoint = { scheme: string; value: string; country: string | null };

const PEPPOL_SCHEME_COUNTRIES: Record<string, string> = {
 "0106": "NL", // Dutch KvK
 "0190": "NL", // Dutch OIN
 "9944": "NL", // Dutch VAT
 "0208": "BE", // Belgian KBO, 10 digits without BE
 "9925": "BE", // Belgian VAT, with BE prefix
};

function cleanIdentifier(value: string | null | undefined): string {
 return (value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function splitPeppolPrefix(value: string) {
 const match = value.match(/^(\d{4}):(.*)$/);
 return match ? { scheme: match[1], value: match[2].trim().toUpperCase().replace(/\s+/g, "") } : null;
}

function inferScheme(value: string, fallbackCountry: string): string {
 const prefixed = splitPeppolPrefix(value);
 if (prefixed?.scheme) return prefixed.scheme;
 const normalized = cleanIdentifier(value);
 if (/^BE\d{10}$/.test(normalized)) return "9925";
 if (/^NL[A-Z0-9]+$/.test(normalized)) return "9944";
 if (/^\d{20}$/.test(normalized)) return "0190";
 if (/^\d{10}$/.test(normalized)) return "0208";
 if (/^\d{8}$/.test(normalized)) return "0106";
 return fallbackCountry?.toUpperCase() === "BE" ? "0208" : "0106";
}

function endpointFrom(value: string, fallbackCountry: string): Endpoint {
 const prefixed = splitPeppolPrefix(value);
 const scheme = inferScheme(value, fallbackCountry);
 const endpointValue = prefixed ? prefixed.value : cleanIdentifier(value);
 return { scheme, value: endpointValue, country: PEPPOL_SCHEME_COUNTRIES[scheme] || null };
}

function firstFilled(...values: Array<string | null | undefined>) {
 return values.find((value) => Boolean(value?.trim())) || "";
}

function escapeXml(s: string | number | null | undefined): string {
 return String(s ?? "")
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;")
 .replace(/'/g, "&apos;");
}

export function generateUBL(d: InvoiceData): string {
 const isCreditNote = d.documentType === "creditNote";
 const lineTotals = d.lines.map((line) => ({
 ...line,
 lineExcl: Math.round(line.quantity * line.unitPrice * 100) / 100,
 lineVat: Math.round(line.quantity * line.unitPrice * (line.vatPct / 100) * 100) / 100,
 }));

 const totalExcl = lineTotals.reduce((sum, line) => sum + line.lineExcl, 0);
 const totalVat = lineTotals.reduce((sum, line) => sum + line.lineVat, 0);
 const totalIncl = Math.round((totalExcl + totalVat) * 100) / 100;

 const vatGroups: Record<number, { taxable: number; tax: number }> = {};
 lineTotals.forEach((line) => {
 if (!vatGroups[line.vatPct]) vatGroups[line.vatPct] = { taxable: 0, tax: 0 };
 vatGroups[line.vatPct].taxable += line.lineExcl;
 vatGroups[line.vatPct].tax += line.lineVat;
 });

 const supplierEndpoint = endpointFrom(firstFilled(d.supplierPeppolId, d.supplierKvkKbo, d.supplierVatNr), d.supplierCountry);
 const customerEndpoint = endpointFrom(firstFilled(d.customerPeppolId, d.customerKvkKbo, d.customerVatNr), d.customerCountry);
 const supCountry = supplierEndpoint.country || d.supplierCountry;
 const cusCountry = customerEndpoint.country || d.customerCountry;

 const taxSubtotals = Object.entries(vatGroups)
 .map(([pct, value]) => `
 <cac:TaxSubtotal>
 <cbc:TaxableAmount currencyID="${escapeXml(d.currency)}">${value.taxable.toFixed(2)}</cbc:TaxableAmount>
 <cbc:TaxAmount currencyID="${escapeXml(d.currency)}">${value.tax.toFixed(2)}</cbc:TaxAmount>
 <cac:TaxCategory>
 <cbc:ID>${Number(pct) === 0 ? "Z" : "S"}</cbc:ID>
 <cbc:Percent>${Number(pct).toFixed(2)}</cbc:Percent>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:TaxCategory>
 </cac:TaxSubtotal>`)
 .join("");

 const documentLines = lineTotals
 .map((line, index) => `
 <cac:${isCreditNote ? "CreditNoteLine" : "InvoiceLine"}>
 <cbc:ID>${index + 1}</cbc:ID>
 <cbc:${isCreditNote ? "CreditedQuantity" : "InvoicedQuantity"} unitCode="C62">${line.quantity}</cbc:${isCreditNote ? "CreditedQuantity" : "InvoicedQuantity"}>
 <cbc:LineExtensionAmount currencyID="${escapeXml(d.currency)}">${line.lineExcl.toFixed(2)}</cbc:LineExtensionAmount>
 <cac:Item>
 <cbc:Description>${escapeXml(line.description)}</cbc:Description>
 <cbc:Name>${escapeXml(line.description)}</cbc:Name>
 <cac:ClassifiedTaxCategory>
 <cbc:ID>${line.vatPct === 0 ? "Z" : "S"}</cbc:ID>
 <cbc:Percent>${line.vatPct.toFixed(2)}</cbc:Percent>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:ClassifiedTaxCategory>
 </cac:Item>
 <cac:Price>
 <cbc:PriceAmount currencyID="${escapeXml(d.currency)}">${line.unitPrice.toFixed(2)}</cbc:PriceAmount>
 </cac:Price>
 </cac:${isCreditNote ? "CreditNoteLine" : "InvoiceLine"}>`)
 .join("");

 return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:${isCreditNote ? "CreditNote" : "Invoice"} xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:${isCreditNote ? "CreditNote" : "Invoice"}-2"
 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
 <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
 <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
 <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
 <cbc:ID>${escapeXml(d.invoiceNumber)}</cbc:ID>
 <cbc:IssueDate>${escapeXml(d.invoiceDate)}</cbc:IssueDate>
 ${isCreditNote ? "" : `<cbc:DueDate>${escapeXml(d.dueDate)}</cbc:DueDate>`}
 <cbc:${isCreditNote ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>${isCreditNote ? "381" : "380"}</cbc:${isCreditNote ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>
 <cbc:DocumentCurrencyCode>${escapeXml(d.currency)}</cbc:DocumentCurrencyCode>
 ${d.buyerReference ? `<cbc:BuyerReference>${escapeXml(d.buyerReference)}</cbc:BuyerReference>` : "<cbc:BuyerReference>N/A</cbc:BuyerReference>"}
 ${isCreditNote && d.originalInvoiceNumber ? `<cac:BillingReference>
 <cac:InvoiceDocumentReference>
 <cbc:ID>${escapeXml(d.originalInvoiceNumber)}</cbc:ID>
 ${d.originalInvoiceDate ? `<cbc:IssueDate>${escapeXml(d.originalInvoiceDate)}</cbc:IssueDate>` : ""}
 </cac:InvoiceDocumentReference>
 </cac:BillingReference>` : ""}
 <cac:AccountingSupplierParty>
 <cac:Party>
 <cbc:EndpointID schemeID="${supplierEndpoint.scheme}">${escapeXml(supplierEndpoint.value)}</cbc:EndpointID>
 <cac:PartyName><cbc:Name>${escapeXml(d.supplierName)}</cbc:Name></cac:PartyName>
 <cac:PostalAddress>
 <cbc:StreetName>${escapeXml(d.supplierAddress)}</cbc:StreetName>
 ${d.supplierPostalCode ? `<cbc:PostalZone>${escapeXml(d.supplierPostalCode)}</cbc:PostalZone>` : ""}
 <cbc:CityName>${escapeXml(d.supplierCity)}</cbc:CityName>
 <cac:Country><cbc:IdentificationCode>${escapeXml(supCountry)}</cbc:IdentificationCode></cac:Country>
 </cac:PostalAddress>
 <cac:PartyTaxScheme>
 <cbc:CompanyID>${escapeXml(d.supplierVatNr)}</cbc:CompanyID>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:PartyTaxScheme>
 <cac:PartyLegalEntity>
 <cbc:RegistrationName>${escapeXml(d.supplierName)}</cbc:RegistrationName>
 <cbc:CompanyID${isCreditNote ? ` schemeID="${inferScheme(d.supplierKvkKbo, d.supplierCountry)}"` : ""}>${escapeXml(d.supplierKvkKbo)}</cbc:CompanyID>
 </cac:PartyLegalEntity>
 </cac:Party>
 </cac:AccountingSupplierParty>
 <cac:AccountingCustomerParty>
 <cac:Party>
 <cbc:EndpointID schemeID="${customerEndpoint.scheme}">${escapeXml(customerEndpoint.value)}</cbc:EndpointID>
 <cac:PartyName><cbc:Name>${escapeXml(d.customerName)}</cbc:Name></cac:PartyName>
 <cac:PostalAddress>
 <cbc:StreetName>${escapeXml(d.customerAddress)}</cbc:StreetName>
 ${d.customerPostalCode ? `<cbc:PostalZone>${escapeXml(d.customerPostalCode)}</cbc:PostalZone>` : ""}
 <cbc:CityName>${escapeXml(d.customerCity)}</cbc:CityName>
 <cac:Country><cbc:IdentificationCode>${escapeXml(cusCountry)}</cbc:IdentificationCode></cac:Country>
 </cac:PostalAddress>
 <cac:PartyTaxScheme>
 <cbc:CompanyID>${escapeXml(d.customerVatNr)}</cbc:CompanyID>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:PartyTaxScheme>
 <cac:PartyLegalEntity>
 <cbc:RegistrationName>${escapeXml(d.customerName)}</cbc:RegistrationName>
 ${d.customerKvkKbo ? `<cbc:CompanyID${isCreditNote ? ` schemeID="${inferScheme(d.customerKvkKbo, d.customerCountry)}"` : ""}>${escapeXml(d.customerKvkKbo)}</cbc:CompanyID>` : ""}
 </cac:PartyLegalEntity>
 </cac:Party>
 </cac:AccountingCustomerParty>
 <cac:PaymentMeans>
 <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
 ${isCreditNote ? "" : `<cbc:PaymentDueDate>${escapeXml(d.dueDate)}</cbc:PaymentDueDate>`}
 <cac:PayeeFinancialAccount>
 <cbc:ID>${escapeXml(d.supplierIban)}</cbc:ID>
 </cac:PayeeFinancialAccount>
 </cac:PaymentMeans>
 <cac:TaxTotal>
 <cbc:TaxAmount currencyID="${escapeXml(d.currency)}">${totalVat.toFixed(2)}</cbc:TaxAmount>
 ${taxSubtotals}
 </cac:TaxTotal>
 <cac:LegalMonetaryTotal>
 <cbc:LineExtensionAmount currencyID="${escapeXml(d.currency)}">${totalExcl.toFixed(2)}</cbc:LineExtensionAmount>
 <cbc:TaxExclusiveAmount currencyID="${escapeXml(d.currency)}">${totalExcl.toFixed(2)}</cbc:TaxExclusiveAmount>
 <cbc:TaxInclusiveAmount currencyID="${escapeXml(d.currency)}">${totalIncl.toFixed(2)}</cbc:TaxInclusiveAmount>
 <cbc:PayableAmount currencyID="${escapeXml(d.currency)}">${totalIncl.toFixed(2)}</cbc:PayableAmount>
 </cac:LegalMonetaryTotal>
 ${documentLines}
</ubl:${isCreditNote ? "CreditNote" : "Invoice"}>`;
}
