"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { C } from "../../lib/constants";
import { InvoiceData, InvoiceLine } from "../../lib/ubl-generator";
import { validateInvoiceData } from "../../lib/ubl-validator";
import { parseDecimalCurrencyInput, parseDecimalInput, sanitizeDecimalCurrencyDisplayInput, sanitizeDecimalDisplayInput } from "../../lib/decimal-input";
import type { ConversionDraftAssumption } from "../../lib/conversion-drafts";

type Draft = {
 id: string;
 filename: string;
 invoiceData: InvoiceData;
 assumptions: ConversionDraftAssumption[];
 expiresAt: string;
};

const emptyLine = (): InvoiceLine => ({ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, vatPct: 21 });
const countries = ["NL", "BE", "DE", "Andere"];

export default function ConvertPage() {
 const [file, setFile] = useState<File | null>(null);
 const [dragging, setDragging] = useState(false);
 const [loading, setLoading] = useState(false);
 const [confirming, setConfirming] = useState(false);
 const [error, setError] = useState("");
 const [errors, setErrors] = useState<string[]>([]);
 const [draft, setDraft] = useState<Draft | null>(null);
 const [savedDrafts, setSavedDrafts] = useState<Draft[]>([]);
 const [result, setResult] = useState<{ xml: string; conversionId: string } | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
 const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

 const [supplierName, setSupplierName] = useState("");
 const [supplierAddress, setSupplierAddress] = useState("");
 const [supplierPostalCode, setSupplierPostalCode] = useState("");
 const [supplierCity, setSupplierCity] = useState("");
 const [supplierCountry, setSupplierCountry] = useState("NL");
 const [supplierKvkKbo, setSupplierKvkKbo] = useState("");
 const [supplierVatNr, setSupplierVatNr] = useState("");
 const [supplierIban, setSupplierIban] = useState("");
 const [customerName, setCustomerName] = useState("");
 const [customerAddress, setCustomerAddress] = useState("");
 const [customerPostalCode, setCustomerPostalCode] = useState("");
 const [customerCity, setCustomerCity] = useState("");
 const [customerCountry, setCustomerCountry] = useState("NL");
 const [customerVatNr, setCustomerVatNr] = useState("");
 const [customerKvkKbo, setCustomerKvkKbo] = useState("");
 const [customerPeppolId, setCustomerPeppolId] = useState("");
 const [customerEmail, setCustomerEmail] = useState("");
 const [buyerReference, setBuyerReference] = useState("");
 const [invoiceNumber, setInvoiceNumber] = useState("");
 const [invoiceDate, setInvoiceDate] = useState("");
 const [dueDate, setDueDate] = useState("");
 const [currency, setCurrency] = useState("EUR");
 const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);

 useEffect(() => { loadDrafts(); }, []);

 async function loadDrafts() {
  const res = await fetch("/api/convert");
  const data = await res.json().catch(() => ({}));
  if (res.ok) setSavedDrafts(data.drafts || []);
 }

 const loadDraftIntoForm = (nextDraft: Draft) => {
  const data = nextDraft.invoiceData;
  setDraft(nextDraft);
  setResult(null);
  setErrors([]);
  setError("");
  setSupplierName(data.supplierName || "");
  setSupplierAddress(data.supplierAddress || "");
  setSupplierPostalCode(data.supplierPostalCode || "");
  setSupplierCity(data.supplierCity || "");
  setSupplierCountry(data.supplierCountry || "NL");
  setSupplierKvkKbo(data.supplierKvkKbo || "");
  setSupplierVatNr(data.supplierVatNr || "");
  setSupplierIban(data.supplierIban || "");
  setCustomerName(data.customerName || "");
  setCustomerAddress(data.customerAddress || "");
  setCustomerPostalCode(data.customerPostalCode || "");
  setCustomerCity(data.customerCity || "");
  setCustomerCountry(data.customerCountry || "NL");
  setCustomerVatNr(data.customerVatNr || "");
  setCustomerKvkKbo(data.customerKvkKbo || "");
  setCustomerPeppolId(data.customerPeppolId || "");
  setCustomerEmail(data.customerEmail || "");
  setBuyerReference(data.buyerReference || "");
  setInvoiceNumber(data.invoiceNumber || "");
  setInvoiceDate(data.invoiceDate || "");
  setDueDate(data.dueDate || "");
  setCurrency(data.currency || "EUR");
  const nextLines = data.lines?.length ? data.lines : [emptyLine()];
  setLines(nextLines.map((line) => ({ ...line, id: line.id || crypto.randomUUID() })));
  setPriceInputs({});
  setQuantityInputs({});
 };

 const handleFile = (f: File) => {
  if (f.type !== "application/pdf") { setError("Alleen PDF-bestanden zijn toegestaan"); return; }
  if (f.size > 10 * 1024 * 1024) { setError("Bestand mag maximaal 10MB zijn"); return; }
  setFile(f);
  setError("");
  setErrors([]);
  setResult(null);
 };

 const handleParse = async () => {
  if (!file) return;
  setLoading(true);
  setError("");
  setErrors([]);
  const formData = new FormData();
  formData.append("pdf", file);
  try {
   const res = await fetch("/api/convert", { method: "POST", body: formData });
   const data = await res.json();
   if (!res.ok) {
    setError(data.error || "Er ging iets mis");
    return;
   }
   loadDraftIntoForm(data.draft);
   setSavedDrafts((current) => [data.draft, ...current.filter((item) => item.id !== data.draft.id)]);
  } catch {
   setError("Netwerkfout. Probeer opnieuw.");
  } finally {
   setLoading(false);
  }
 };

 const invoiceData = (): InvoiceData => ({
  supplierName, supplierAddress, supplierPostalCode, supplierCity, supplierCountry, supplierVatNr, supplierKvkKbo, supplierIban,
  customerName, customerAddress, customerPostalCode, customerCity, customerCountry, customerVatNr, customerKvkKbo, customerPeppolId, customerEmail, buyerReference,
  invoiceNumber, invoiceDate, dueDate, currency, lines,
 });

 const totals = useMemo(() => {
  const excl = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const vatByPct = lines.reduce<Record<number, number>>((acc, line) => {
   acc[line.vatPct] = (acc[line.vatPct] || 0) + line.quantity * line.unitPrice * (line.vatPct / 100);
   return acc;
  }, {});
  const vat = Object.values(vatByPct).reduce((sum, value) => sum + value, 0);
  return { excl, vatByPct, vat, incl: excl + vat };
 }, [lines]);

 const setLine = (id: string, patch: Partial<InvoiceLine>) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
 const addLine = () => setLines((current) => [...current, emptyLine()]);
 const removeLine = (id: string) => {
  setLines((current) => current.filter((item) => item.id !== id));
  setPriceInputs((current) => { const next = { ...current }; delete next[id]; return next; });
  setQuantityInputs((current) => { const next = { ...current }; delete next[id]; return next; });
 };

 const assumptionFor = (fieldName: string) => draft?.assumptions.find((item) => item.field === fieldName);
 const mark = (fieldName: string) => assumptionFor(fieldName) ? { borderColor: "rgba(245,158,11,0.65)", boxShadow: "0 0 0 1px rgba(245,158,11,0.25)" } : {};
 const note = (fieldName: string) => assumptionFor(fieldName) ? <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 5 }}>{assumptionFor(fieldName)?.reason}</div> : null;

 const input = { width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.input, color: C.white, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const };
 const label = { display: "block", color: C.gray, fontSize: 12, fontWeight: 700, marginBottom: 6 };
 const field = (title: string, value: string, setter: (value: string) => void, fieldName: string, type = "text", inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]) => (
  <div>
   <label style={label}>{title}</label>
   <input type={type} inputMode={inputMode} value={value} onChange={(e) => setter(e.target.value)} style={{ ...input, ...mark(fieldName) }} />
   {note(fieldName)}
  </div>
 );
 const amountField = (title: string, line: InvoiceLine) => field(title, priceInputs[line.id] ?? String(line.unitPrice), (rawValue) => {
  const visibleValue = sanitizeDecimalCurrencyDisplayInput(rawValue);
  setPriceInputs((current) => ({ ...current, [line.id]: visibleValue }));
  setLine(line.id, { unitPrice: parseDecimalCurrencyInput(visibleValue) });
 }, `lines.${line.id}.unitPrice`, "text", "decimal");
 const quantityField = (title: string, line: InvoiceLine) => field(title, quantityInputs[line.id] ?? String(line.quantity), (rawValue) => {
  const visibleValue = sanitizeDecimalDisplayInput(rawValue, 3);
  setQuantityInputs((current) => ({ ...current, [line.id]: visibleValue }));
  setLine(line.id, { quantity: parseDecimalInput(visibleValue, 3) });
 }, `lines.${line.id}.quantity`, "text", "decimal");
 const select = (title: string, value: string, setter: (value: string) => void, fieldName: string, options: string[]) => (
  <div>
   <label style={label}>{title}</label>
   <select value={value} onChange={(e) => setter(e.target.value)} style={{ ...input, ...mark(fieldName) }}>
    {options.map((option) => <option key={option} value={option}>{option}</option>)}
   </select>
   {note(fieldName)}
  </div>
 );

 const confirmDraft = async () => {
  if (!draft || confirming) return;
  const data = invoiceData();
  const validation = validateInvoiceData(data);
  setErrors(validation.errors);
  setError("");
  if (!validation.valid) return;
  setConfirming(true);
  try {
   const res = await fetch("/api/convert/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftId: draft.id, invoiceData: data }),
   });
   const body = await res.json().catch(() => ({}));
   if (!res.ok) {
    setErrors(body.errors || [body.error || "Bevestigen mislukt"]);
    return;
   }
   setResult({ xml: body.xml, conversionId: body.conversionId });
   setDraft(null);
   setSavedDrafts((current) => current.filter((item) => item.id !== draft.id));
  } catch {
   setErrors(["Netwerkfout. Probeer opnieuw."]);
  } finally {
   setConfirming(false);
  }
 };

 const downloadUBL = () => {
  if (!result) return;
  const blob = new Blob([result.xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `peppolpro-${invoiceNumber || "factuur"}.xml`;
  a.click();
  URL.revokeObjectURL(url);
 };

 const cardStyle: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, backdropFilter: "blur(20px)" };

 return (
  <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.white }}>
   <style>{`.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; } .line-grid { display: grid; grid-template-columns: 2fr .7fr .8fr .7fr .9fr auto; gap: 10px; align-items: end; } @media (max-width: 760px) { .form-grid, .line-grid { grid-template-columns: 1fr; } }`}</style>
   <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 60 }}>
     <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.white }}><div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>P</span></div><span style={{ fontSize: 18, fontWeight: 800 }}>Peppol<span style={{ color: C.blue }}>Pro</span></span></a>
     <a href="/dashboard" style={{ fontSize: 13, color: C.dim, textDecoration: "none" }}>← Dashboard</a>
    </div>
   </div>
   <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px" }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Factuur converteren</h1>
    <p style={{ fontSize: 15, color: C.dim, marginBottom: 24 }}>Upload een PDF. We lezen eerst de gegevens; pas na jouw bevestiging kost dit één UBL-credit.</p>

    {!draft && !result && <>
     {savedDrafts.length > 0 && <Section title="Bewaarde concepten">
      <div style={{ display: "grid", gap: 10 }}>
       {savedDrafts.map((item) => <button key={item.id} onClick={() => loadDraftIntoForm(item)} style={{ textAlign: "left", padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.input, color: C.white, cursor: "pointer" }}>
        <strong>{item.invoiceData.invoiceNumber || item.filename}</strong><br /><span style={{ color: C.dim, fontSize: 12 }}>Verloopt op {item.expiresAt ? new Intl.DateTimeFormat("nl-NL").format(new Date(item.expiresAt)) : "onbekend"}</span>
       </button>)}
      </div>
     </Section>}
     <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} style={{ ...cardStyle, border: dragging ? `2px dashed ${C.blue}` : file ? `2px solid ${C.blue}33` : `2px dashed ${C.border}`, background: dragging ? `${C.blue}08` : file ? `${C.blue}05` : C.card, cursor: "pointer", textAlign: "center", padding: "60px 32px", transition: "all 0.2s" }}>
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {file ? <><span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📄</span><p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{file.name}</p><p style={{ fontSize: 13, color: C.dim }}>{(file.size / 1024).toFixed(0)} KB · Klik om te wijzigen</p></> : <><span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📂</span><p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Sleep je PDF hierheen</p><p style={{ fontSize: 13, color: C.dim }}>of klik om te selecteren · Max 10MB</p></>}
     </div>
     {error && <div style={{ ...cardStyle, marginTop: 16, borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}><p style={{ fontSize: 14, color: "#ef4444" }}>❌ {error}</p></div>}
     {file && <button onClick={handleParse} disabled={loading} style={{ width: "100%", marginTop: 20, padding: "16px 0", borderRadius: 12, border: "none", background: loading ? C.dim : `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>{loading ? "⏳ AI leest je factuur..." : "🧠 Lees PDF en maak concept"}</button>}
    </>}

    {draft && <>
     <div style={{ marginBottom: 18, border: "1px solid rgba(245,158,11,0.28)", background: "rgba(120,53,15,0.16)", color: "#fbbf24", borderRadius: 8, padding: 14, fontSize: 13, fontWeight: 800 }}>
      Concept opgeslagen tot {draft.expiresAt ? new Intl.DateTimeFormat("nl-NL").format(new Date(draft.expiresAt)) : "14 dagen"}. Velden met een oranje rand zijn parser-aannames of moeten gecontroleerd worden.
     </div>
     {draft.assumptions.length > 0 && <Section title="Parser-aannames"><ul style={{ margin: 0, color: "#fcd34d", lineHeight: 1.7 }}>{draft.assumptions.map((item, index) => <li key={`${item.field}-${index}`}><strong>{item.label}:</strong> {item.reason}</li>)}</ul></Section>}
     <Section title="Afzender"><div className="form-grid">{field("Naam", supplierName, setSupplierName, "supplierName")}{field("Adres", supplierAddress, setSupplierAddress, "supplierAddress")}{field("Postcode", supplierPostalCode, setSupplierPostalCode, "supplierPostalCode")}{field("Stad", supplierCity, setSupplierCity, "supplierCity")}{select("Land", supplierCountry, setSupplierCountry, "supplierCountry", countries)}{field("KvK of KBO", supplierKvkKbo, setSupplierKvkKbo, "supplierKvkKbo")}{field("BTW-nummer", supplierVatNr, setSupplierVatNr, "supplierVatNr")}{field("IBAN", supplierIban, setSupplierIban, "supplierIban")}</div></Section>
     <Section title="Ontvanger"><div className="form-grid">{field("Naam", customerName, setCustomerName, "customerName")}{field("Adres", customerAddress, setCustomerAddress, "customerAddress")}{field("Postcode", customerPostalCode, setCustomerPostalCode, "customerPostalCode")}{field("Stad", customerCity, setCustomerCity, "customerCity")}{select("Land", customerCountry, setCustomerCountry, "customerCountry", countries)}{field("BTW-nummer", customerVatNr, setCustomerVatNr, "customerVatNr")}{field("KvK/KBO optioneel", customerKvkKbo, setCustomerKvkKbo, "customerKvkKbo")}{field("Peppol-ID optioneel", customerPeppolId, setCustomerPeppolId, "customerPeppolId")}{field("E-mailadres ontvanger", customerEmail, setCustomerEmail, "customerEmail", "email")}{field("Betalingskenmerk", buyerReference, setBuyerReference, "buyerReference")}</div></Section>
     <Section title="Factuurgegevens"><div className="form-grid">{field("Factuurnummer", invoiceNumber, setInvoiceNumber, "invoiceNumber")}{field("Factuurdatum", invoiceDate, setInvoiceDate, "invoiceDate", "date")}{field("Vervaldatum", dueDate, setDueDate, "dueDate", "date")}{select("Valuta", currency, setCurrency, "currency", ["EUR"])}</div></Section>
     <Section title="Factuurregels"><div style={{ display: "grid", gap: 12 }}>{lines.map((line) => <div key={line.id} className="line-grid"><div>{field("Omschrijving", line.description, (value) => setLine(line.id, { description: value }), `lines.${line.id}.description`)}</div><div>{quantityField("Aantal", line)}</div><div>{amountField("Prijs", line)}</div><div>{select("BTW%", String(line.vatPct), (value) => setLine(line.id, { vatPct: Number(value) }), `lines.${line.id}.vatPct`, ["0", "6", "9", "21"])}</div><div><label style={label}>Totaal excl.</label><input readOnly value={`€${(line.quantity * line.unitPrice).toFixed(2)}`} style={{ ...input, color: C.gray }} /></div><button onClick={() => removeLine(line.id)} disabled={lines.length === 1} style={{ height: 42, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.gray, cursor: lines.length === 1 ? "not-allowed" : "pointer" }}>Verwijder</button></div>)}</div><button onClick={addLine} style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.white, fontWeight: 700, cursor: "pointer" }}>+ Regel toevoegen</button><div style={{ marginTop: 24, display: "grid", gap: 6, color: C.gray, fontSize: 14 }}><strong style={{ color: C.white }}>Totaal excl.: €{totals.excl.toFixed(2)}</strong>{Object.entries(totals.vatByPct).map(([pct, value]) => <span key={pct}>BTW {pct}%: €{value.toFixed(2)}</span>)}<strong style={{ color: C.white }}>Totaal incl.: €{totals.incl.toFixed(2)}</strong></div></Section>
     {errors.length > 0 && <div style={{ border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", borderRadius: 12, padding: 18, marginBottom: 20 }}><strong style={{ color: "#fca5a5" }}>Controleer deze punten:</strong><ul style={{ margin: "10px 0 0", color: "#fecaca" }}>{errors.map((item) => <li key={item}>{item}</li>)}</ul></div>}
     <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><button onClick={confirmDraft} disabled={confirming} style={{ padding: "14px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontWeight: 800, cursor: confirming ? "wait" : "pointer" }}>{confirming ? "Bevestigen..." : "Bevestigen en UBL genereren"}</button><button onClick={() => { setDraft(null); setFile(null); setErrors([]); }} style={{ padding: "14px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.gray, fontWeight: 800, cursor: "pointer" }}>Annuleren en later afmaken</button></div>
    </>}

    {result && <><div style={{ ...cardStyle, borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.05)", marginBottom: 20 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>✅ UBL gegenereerd</h2><p style={{ fontSize: 13, color: C.dim, margin: "8px 0 18px" }}>Conversie is opgeslagen en de credit is nu pas afgeschreven.</p><button onClick={downloadUBL} style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>⬇️ Download UBL XML</button></div><Section title="UBL XML Preview"><pre style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.gray, background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 10, overflow: "auto", maxHeight: 420, lineHeight: 1.5 }}>{result.xml}</pre></Section></>}
   </div>
  </div>
 );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
 return <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 20 }}><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{title}</h2>{children}</section>;
}
