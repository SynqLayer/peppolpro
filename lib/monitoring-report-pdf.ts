import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type ReportTarget = {
 label?: string | null;
 identifier_type?: string | null;
 identifier_value?: string | null;
 status?: string | null;
 last_checked_at?: string | null;
 created_at?: string | null;
};

export type ReportEvent = {
 event_type?: string | null;
 severity?: string | null;
 created_at?: string | null;
 payload?: unknown;
};

function safeText(value: unknown) {
 return String(value ?? "-").replace(/[\r\n]+/g, " ").slice(0, 150);
}

function dateText(value?: string | null) {
 if (!value) return "-";
 return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function payloadSummary(payload: unknown) {
 if (!payload || typeof payload !== "object") return "";
 const data = payload as { query?: unknown; matches?: unknown; message?: unknown; httpStatus?: unknown };
 const parts = [];
 if (data.query) parts.push(`query=${safeText(data.query)}`);
 if (typeof data.matches !== "undefined") parts.push(`matches=${safeText(data.matches)}`);
 if (data.httpStatus) parts.push(`http=${safeText(data.httpStatus)}`);
 if (data.message) parts.push(`melding=${safeText(data.message)}`);
 return parts.join(" · ");
}

export async function generateMonitoringReportPdf({
 companyName,
 target,
 events,
}: {
 companyName: string;
 target: ReportTarget;
 events: ReportEvent[];
}) {
 const pdf = await PDFDocument.create();
 const regular = await pdf.embedFont(StandardFonts.Helvetica);
 const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
 let page = pdf.addPage([595.28, 841.89]);
 let y = 792;
 const margin = 48;
 const lineHeight = 18;
 const draw = (text: string, options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}) => {
 if (y < 60) {
 page = pdf.addPage([595.28, 841.89]);
 y = 792;
 }
 page.drawText(safeText(text), { x: margin, y, size: options.size || 11, font: options.bold ? bold : regular, color: options.color || rgb(0.08, 0.12, 0.2) });
 y -= lineHeight;
 };
 draw("PeppolPro compliancerapport", { size: 20, bold: true, color: rgb(0.12, 0.25, 0.7) });
 y -= 8;
 draw(`Bedrijfsnaam: ${companyName}`, { bold: true });
 draw(`Target: ${target.label || target.identifier_value || "-"}`);
 draw(`Identifier: ${target.identifier_type || "-"} · ${target.identifier_value || "-"}`);
 draw(`Peppol-status: ${target.status || "onbekend"}`);
 draw(`Laatste check: ${dateText(target.last_checked_at)}`);
 draw(`Rapportdatum: ${dateText(new Date().toISOString())}`);
 y -= 12;
 draw("Historie monitoring-events", { size: 15, bold: true });
 if (events.length === 0) {
 draw("Geen monitoring-events gevonden voor dit target.");
 } else {
 events.slice(0, 120).forEach((event) => {
 draw(`${dateText(event.created_at)} · ${event.severity || "info"} · ${event.event_type || "event"}`, { bold: true });
 const summary = payloadSummary(event.payload);
 if (summary) draw(`  ${summary}`, { size: 10, color: rgb(0.25, 0.3, 0.38) });
 });
 }
 return Buffer.from(await pdf.save());
}
