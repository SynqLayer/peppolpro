import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type InvoicePdfInput = {
 invoice_number?: string | null;
 invoice_kind?: string | null;
 original_invoice_number?: string | null;
 issued_at?: string | null;
 invoice_date?: string | null;
 currency?: string | null;
 amount?: number | string | null;
 vat_amount?: number | string | null;
 vat_rate?: number | string | null;
 total_excl?: number | string | null;
 total_incl?: number | string | null;
 user_profiles?: {
  company_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  address?: string | null;
  btw_number?: string | null;
  btw_nr?: string | null;
 } | null;
};

function money(value?: number | string | null, currency = "EUR") {
 return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(Number(value || 0));
}

function date(value?: string | null) {
 if (!value) return "-";
 return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

export async function generateBillingInvoicePdf(invoice: InvoicePdfInput) {
 const pdf = await PDFDocument.create();
 const page = pdf.addPage([595, 842]);
 const font = await pdf.embedFont(StandardFonts.Helvetica);
 const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
 const dark = rgb(0.06, 0.09, 0.16);
 const muted = rgb(0.39, 0.45, 0.55);
 const accent = invoice.invoice_kind === "credit" ? rgb(0.86, 0.22, 0.22) : rgb(0.1, 0.45, 0.95);
 const currency = invoice.currency || "EUR";
 const profile = invoice.user_profiles;
 const customer = profile?.company_name || profile?.full_name || profile?.email || "Klant";
 const vatId = profile?.btw_number || profile?.btw_nr || "-";
 const totalIncl = invoice.total_incl ?? invoice.amount ?? 0;
 const vat = invoice.vat_amount ?? 0;
 const totalExcl = invoice.total_excl ?? (Number(totalIncl) - Number(vat));

 page.drawText(invoice.invoice_kind === "credit" ? "Creditfactuur" : "Factuur", { x: 48, y: 780, size: 28, font: bold, color: dark });
 page.drawText("PeppolPro / SynqLayer", { x: 48, y: 750, size: 12, font, color: muted });
 page.drawRectangle({ x: 48, y: 724, width: 500, height: 2, color: accent });

 const rows: Array<[string, string]> = [
 ["Factuurnummer", invoice.invoice_number || "-"],
 ["Datum", date(invoice.issued_at || invoice.invoice_date)],
 ["Klant", customer],
 ["BTW klant", vatId],
 ];
 if (invoice.invoice_kind === "credit") rows.push(["Credit op", invoice.original_invoice_number || "originele factuur"]);

 let y = 690;
 for (const [label, value] of rows) {
 page.drawText(label, { x: 48, y, size: 10, font: bold, color: muted });
 page.drawText(value, { x: 180, y, size: 11, font, color: dark });
 y -= 24;
 }

 y -= 20;
 page.drawText("Omschrijving", { x: 48, y, size: 10, font: bold, color: muted });
 page.drawText("Bedrag", { x: 440, y, size: 10, font: bold, color: muted });
 y -= 24;
 page.drawText(invoice.invoice_kind === "credit" ? "Credit abonnement PeppolPro monitoring" : invoice.invoice_kind === "credits" ? "PeppolPro verzendbundel credits" : "PeppolPro monitoring abonnement", { x: 48, y, size: 12, font, color: dark });
 page.drawText(money(totalExcl, currency), { x: 440, y, size: 12, font, color: dark });

 y -= 70;
 page.drawText(`BTW ${Number(invoice.vat_rate ?? 21)}%`, { x: 330, y, size: 11, font, color: muted });
 page.drawText(money(vat, currency), { x: 440, y, size: 11, font, color: dark });
 y -= 28;
 page.drawText("Totaal incl. BTW", { x: 330, y, size: 13, font: bold, color: dark });
 page.drawText(money(totalIncl, currency), { x: 440, y, size: 13, font: bold, color: dark });

 page.drawText("Deze PDF is on-the-fly gegenereerd en wordt niet server-side opgeslagen.", { x: 48, y: 70, size: 9, font, color: muted });
 return pdf.save();
}
