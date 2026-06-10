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
 supplierCity: string;
 supplierCountry: string;
 supplierVatNr: string;
 supplierKvkKbo: string;
 supplierIban: string;
 supplierPeppolId?: string;
 // Klant
 customerName: string;
 customerAddress: string;
 customerCity: string;
 customerCountry: string;
 customerVatNr: string;
 customerKvkKbo?: string;
 customerPeppolId?: string;
 buyerReference?: string;
 // Factuur
 invoiceNumber: string;
 invoiceDate: string;
 dueDate: string;
 currency: string;
 lines: InvoiceLine[];
}

function schemeForCountry(country: string): string {
 return country?.toUpperCase() === "BE" ? "0208" : "0106";
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

 const supScheme = schemeForCountry(d.supplierCountry);
 const cusScheme = schemeForCountry(d.customerCountry);
 const supEndpoint = d.supplierPeppolId || d.supplierKvkKbo;
 const cusEndpoint = d.customerPeppolId || d.customerKvkKbo || d.customerVatNr;

 const taxSubtotals = Object.entries(vatGroups)
 .map(([pct, value]) => `
 <cac:TaxSubtotal>
 <cbc:TaxableAmount currencyID="${escapeXml(d.currency)}">${value.taxable.toFixed(2)}</cbc:TaxableAmount>
 <cbc:TaxAmount currencyID="${escapeXml(d.currency)}">${value.tax.toFixed(2)}</cbc:TaxAmount>
 <cac:TaxCategory>
 <cbc:ID>${Number(pct) === 0 ? "Z" : "S"}</cbc:ID>
 <cbc:Percent>${pct}</cbc:Percent>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:TaxCategory>
 </cac:TaxSubtotal>`)
 .join("");

 const invoiceLines = lineTotals
 .map((line, index) => `
 <cac:InvoiceLine>
 <cbc:ID>${index + 1}</cbc:ID>
 <cbc:InvoicedQuantity unitCode="C62">${line.quantity}</cbc:InvoicedQuantity>
 <cbc:LineExtensionAmount currencyID="${escapeXml(d.currency)}">${line.lineExcl.toFixed(2)}</cbc:LineExtensionAmount>
 <cac:Item>
 <cbc:Description>${escapeXml(line.description)}</cbc:Description>
 <cbc:Name>${escapeXml(line.description)}</cbc:Name>
 <cac:ClassifiedTaxCategory>
 <cbc:ID>${line.vatPct === 0 ? "Z" : "S"}</cbc:ID>
 <cbc:Percent>${line.vatPct}</cbc:Percent>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:ClassifiedTaxCategory>
 </cac:Item>
 <cac:Price>
 <cbc:PriceAmount currencyID="${escapeXml(d.currency)}">${line.unitPrice.toFixed(2)}</cbc:PriceAmount>
 </cac:Price>
 </cac:InvoiceLine>`)
 .join("");

 return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
 <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
 <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
 <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
 <cbc:ID>${escapeXml(d.invoiceNumber)}</cbc:ID>
 <cbc:IssueDate>${escapeXml(d.invoiceDate)}</cbc:IssueDate>
 <cbc:DueDate>${escapeXml(d.dueDate)}</cbc:DueDate>
 <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
 <cbc:DocumentCurrencyCode>${escapeXml(d.currency)}</cbc:DocumentCurrencyCode>
 ${d.buyerReference ? `<cbc:BuyerReference>${escapeXml(d.buyerReference)}</cbc:BuyerReference>` : "<cbc:BuyerReference>N/A</cbc:BuyerReference>"}
 <cac:AccountingSupplierParty>
 <cac:Party>
 <cbc:EndpointID schemeID="${supScheme}">${escapeXml(supEndpoint)}</cbc:EndpointID>
 <cac:PartyName><cbc:Name>${escapeXml(d.supplierName)}</cbc:Name></cac:PartyName>
 <cac:PostalAddress>
 <cbc:StreetName>${escapeXml(d.supplierAddress)}</cbc:StreetName>
 <cbc:CityName>${escapeXml(d.supplierCity)}</cbc:CityName>
 <cac:Country><cbc:IdentificationCode>${escapeXml(d.supplierCountry)}</cbc:IdentificationCode></cac:Country>
 </cac:PostalAddress>
 <cac:PartyTaxScheme>
 <cbc:CompanyID>${escapeXml(d.supplierVatNr)}</cbc:CompanyID>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:PartyTaxScheme>
 <cac:PartyLegalEntity>
 <cbc:RegistrationName>${escapeXml(d.supplierName)}</cbc:RegistrationName>
 <cbc:CompanyID>${escapeXml(d.supplierKvkKbo)}</cbc:CompanyID>
 </cac:PartyLegalEntity>
 </cac:Party>
 </cac:AccountingSupplierParty>
 <cac:AccountingCustomerParty>
 <cac:Party>
 <cbc:EndpointID schemeID="${cusScheme}">${escapeXml(cusEndpoint)}</cbc:EndpointID>
 <cac:PartyName><cbc:Name>${escapeXml(d.customerName)}</cbc:Name></cac:PartyName>
 <cac:PostalAddress>
 <cbc:StreetName>${escapeXml(d.customerAddress)}</cbc:StreetName>
 <cbc:CityName>${escapeXml(d.customerCity)}</cbc:CityName>
 <cac:Country><cbc:IdentificationCode>${escapeXml(d.customerCountry)}</cbc:IdentificationCode></cac:Country>
 </cac:PostalAddress>
 <cac:PartyTaxScheme>
 <cbc:CompanyID>${escapeXml(d.customerVatNr)}</cbc:CompanyID>
 <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
 </cac:PartyTaxScheme>
 <cac:PartyLegalEntity>
 <cbc:RegistrationName>${escapeXml(d.customerName)}</cbc:RegistrationName>
 ${d.customerKvkKbo ? `<cbc:CompanyID>${escapeXml(d.customerKvkKbo)}</cbc:CompanyID>` : ""}
 </cac:PartyLegalEntity>
 </cac:Party>
 </cac:AccountingCustomerParty>
 <cac:PaymentMeans>
 <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
 <cbc:PaymentDueDate>${escapeXml(d.dueDate)}</cbc:PaymentDueDate>
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
 ${invoiceLines}
</ubl:Invoice>`;
}
