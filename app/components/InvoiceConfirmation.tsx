"use client";

import { C } from "@/lib/constants";
import type { InvoicePreview } from "@/lib/invoice-preview";

type Props = {
 title: string;
 preview: InvoicePreview;
 remainingCreditsAfterSend?: number | null;
 confirmLabel: string;
 cancelLabel?: string;
 busy?: boolean;
 onConfirm: () => void;
 onCancel: () => void;
};

const labelStyle = { color: "#94a3b8", fontSize: 12, fontWeight: 800 } as const;
const valueStyle = { color: "#f8fafc", fontSize: 13, fontWeight: 800 } as const;

function Row({ label, value }: { label: string; value: string }) {
 return (
  <div>
   <div style={labelStyle}>{label}</div>
   <div style={valueStyle}>{value || "-"}</div>
  </div>
 );
}

export function InvoiceConfirmation({ title, preview, remainingCreditsAfterSend, confirmLabel, cancelLabel = "Annuleren", busy = false, onConfirm, onCancel }: Props) {
 return (
  <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(2,6,23,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
   <div role="dialog" aria-modal="true" aria-label={title} style={{ width: "min(860px, 100%)", maxHeight: "90vh", overflow: "auto", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: "0 24px 90px rgba(0,0,0,0.42)", padding: 22 }}>
    <h2 style={{ margin: "0 0 8px", color: C.white, fontSize: 22, fontWeight: 900 }}>{title}</h2>
    <p style={{ margin: "0 0 18px", color: C.dim, fontSize: 13, lineHeight: 1.55 }}>Controleer wat er werkelijk in de factuur staat voordat je doorgaat.</p>

    {preview.dueDateWarning && (
     <div style={{ marginBottom: 16, border: "1px solid rgba(245,158,11,0.38)", background: "rgba(120,53,15,0.22)", color: "#fbbf24", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 900 }}>
      Let op: de vervaldatum ligt op of vóór de factuurdatum.
     </div>
    )}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
     <Row label="Afzender" value={`${preview.seller.name} · ${preview.seller.identifier}`} />
     <Row label="Ontvanger" value={`${preview.buyer.name} · ${preview.buyer.identifier} · ${preview.buyer.country}`} />
     <Row label="Peppol-ID ontvanger" value={preview.buyer.peppolId} />
     <Row label="Factuur" value={`${preview.invoiceNumber} · ${preview.issueDate} · vervalt ${preview.dueDate}`} />
     <Row label="Valuta" value={preview.currency} />
     {remainingCreditsAfterSend !== null && remainingCreditsAfterSend !== undefined ? <Row label="Verzendtegoed na verzending" value={String(remainingCreditsAfterSend)} /> : null}
    </div>

    <div style={{ overflowX: "auto", marginBottom: 18 }}>
     <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620, fontSize: 13 }}>
      <thead>
       <tr>
        {['Omschrijving', 'Aantal', 'Prijs', 'BTW', 'Totaal excl.'].map((header) => <th key={header} style={{ textAlign: "left", color: "#64748b", padding: "9px 10px", borderBottom: "1px solid rgba(148,163,184,0.14)" }}>{header}</th>)}
       </tr>
      </thead>
      <tbody>
       {preview.lines.map((line, index) => (
        <tr key={`${line.description}-${index}`}>
         <td style={{ color: C.white, padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.09)" }}>{line.description}</td>
         <td style={{ color: "#cbd5e1", padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.09)" }}>{line.quantity}</td>
         <td style={{ color: "#cbd5e1", padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.09)" }}>{line.netPriceAmount}</td>
         <td style={{ color: "#cbd5e1", padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.09)" }}>{line.vatPercentage}%</td>
         <td style={{ color: "#cbd5e1", padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.09)" }}>{line.lineNetAmount}</td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>

    <div style={{ display: "grid", gap: 6, color: "#cbd5e1", fontSize: 13, marginBottom: 20 }}>
     <strong style={{ color: C.white }}>Subtotaal: {preview.totals.subtotal} {preview.currency}</strong>
     {preview.totals.vatByRate.map((vat) => <span key={vat.percentage}>BTW {vat.percentage}% over {vat.taxableAmount}: {vat.vatAmount} {preview.currency}</span>)}
     <strong style={{ color: C.white }}>Totaalbedrag: {preview.totals.total} {preview.currency}</strong>
    </div>

    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
     <button type="button" onClick={onCancel} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.white, fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>{cancelLabel}</button>
     <button type="button" onClick={onConfirm} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: C.blue, color: "#fff", fontWeight: 900, cursor: busy ? "wait" : "pointer" }}>{busy ? "Even geduld..." : confirmLabel}</button>
    </div>
   </div>
  </div>
 );
}
