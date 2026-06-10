"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-client";
import { C } from "../../lib/constants";
import { InvoiceData, InvoiceLine } from "../../lib/ubl-generator";
import { validateInvoiceData } from "../../lib/ubl-validator";

const today = new Date().toISOString().slice(0, 10);
const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const invoiceNo = `F-${new Date().getFullYear()}-001`;
const emptyLine = (): InvoiceLine => ({ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, vatPct: 21 });
const countries = ["NL", "BE", "DE", "Andere"];

export default function NieuwPage() {
 const router = useRouter();
 const supabase = createClient();
 const [loadingProfile, setLoadingProfile] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [errors, setErrors] = useState<string[]>([]);
 const [xml, setXml] = useState("");

 const [supplierName, setSupplierName] = useState("");
 const [supplierAddress, setSupplierAddress] = useState("");
 const [supplierCity, setSupplierCity] = useState("");
 const [supplierCountry, setSupplierCountry] = useState("NL");
 const [supplierKvkKbo, setSupplierKvkKbo] = useState("");
 const [supplierVatNr, setSupplierVatNr] = useState("");
 const [supplierIban, setSupplierIban] = useState("");

 const [customerName, setCustomerName] = useState("");
 const [customerAddress, setCustomerAddress] = useState("");
 const [customerCity, setCustomerCity] = useState("");
 const [customerCountry, setCustomerCountry] = useState("NL");
 const [customerVatNr, setCustomerVatNr] = useState("");
 const [customerKvkKbo, setCustomerKvkKbo] = useState("");
 const [customerPeppolId, setCustomerPeppolId] = useState("");
 const [buyerReference, setBuyerReference] = useState("");

 const [invoiceNumber, setInvoiceNumber] = useState(invoiceNo);
 const [invoiceDate, setInvoiceDate] = useState(today);
 const [dueDate, setDueDate] = useState(due);
 const [currency, setCurrency] = useState("EUR");
 const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);

 useEffect(() => {
 const loadProfile = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
 setLoadingProfile(false);
 return;
 }
 const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
 if (data) {
 const profile = data as Record<string, string | null>;
 setSupplierName(profile.company_name || "");
 setSupplierCountry(profile.country || "NL");
 setSupplierKvkKbo(profile.kvk_kbo || profile.kvk_number || profile.kbo_number || "");
 setSupplierVatNr(profile.btw_nr || profile.btw_number || "");
 setSupplierAddress(profile.address || "");
 setSupplierIban(profile.iban || "");
 }
 setLoadingProfile(false);
 };
 loadProfile();
 }, [supabase]);

 const totals = useMemo(() => {
 const excl = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
 const vatByPct = lines.reduce<Record<number, number>>((acc, line) => {
 acc[line.vatPct] = (acc[line.vatPct] || 0) + line.quantity * line.unitPrice * (line.vatPct / 100);
 return acc;
 }, {});
 const vat = Object.values(vatByPct).reduce((sum, value) => sum + value, 0);
 return { excl, vatByPct, vat, incl: excl + vat };
 }, [lines]);

 const invoiceData = (): InvoiceData => ({
 supplierName,
 supplierAddress,
 supplierCity,
 supplierCountry,
 supplierVatNr,
 supplierKvkKbo,
 supplierIban,
 customerName,
 customerAddress,
 customerCity,
 customerCountry,
 customerVatNr,
 customerKvkKbo,
 customerPeppolId,
 buyerReference,
 invoiceNumber,
 invoiceDate,
 dueDate,
 currency,
 lines,
 });

 const setLine = (id: string, patch: Partial<InvoiceLine>) => {
 setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
 };

 const submit = async () => {
 const data = invoiceData();
 const result = validateInvoiceData(data);
 setErrors(result.errors);
 setXml("");
 if (!result.valid) return;

 setSubmitting(true);
 try {
 const res = await fetch("/api/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(data),
 });
 const body = await res.json();
 if (!res.ok) {
 setErrors(body.errors || [body.error || "Generatie mislukt"]);
 return;
 }
 setXml(body.xml);
 } catch {
 setErrors(["Netwerkfout. Probeer opnieuw."]);
 } finally {
 setSubmitting(false);
 }
 };

 const downloadXml = () => {
 const blob = new Blob([xml], { type: "application/xml" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `peppolpro-${invoiceNumber}.xml`;
 a.click();
 URL.revokeObjectURL(url);
 };

 const input = {
 width: "100%",
 padding: "11px 12px",
 borderRadius: 8,
 border: `1px solid ${C.border}`,
 background: C.input,
 color: C.white,
 fontSize: 14,
 fontFamily: "inherit",
 boxSizing: "border-box" as const,
 };

 const label = { display: "block", color: C.gray, fontSize: 12, fontWeight: 700, marginBottom: 6 };

 const field = (title: string, value: string, setter: (value: string) => void, type = "text") => (
 <div>
 <label style={label}>{title}</label>
 <input type={type} value={value} onChange={(e) => setter(e.target.value)} style={input} />
 </div>
 );

 const select = (title: string, value: string, setter: (value: string) => void, options: string[]) => (
 <div>
 <label style={label}>{title}</label>
 <select value={value} onChange={(e) => setter(e.target.value)} style={input}>
 {options.map((option) => <option key={option} value={option}>{option}</option>)}
 </select>
 </div>
 );

 return (
 <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
 <style>{`
 .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
 .line-grid { display: grid; grid-template-columns: 2fr .7fr .8fr .7fr .9fr auto; gap: 10px; align-items: end; }
 @media (max-width: 760px) {
 .form-grid, .line-grid { grid-template-columns: 1fr; }
 }
 `}</style>
 <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 20px 72px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 28 }}>
 <div>
 <a href="/dashboard" style={{ color: C.dim, textDecoration: "none", fontSize: 13 }}>← Dashboard</a>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 14 }}>Nieuwe factuur</h1>
 </div>
 <button onClick={submit} disabled={submitting} style={{ padding: "12px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}>
 {submitting ? "Genereren..." : "Genereer UBL"}
 </button>
 </div>

 {loadingProfile && <p style={{ color: C.dim, marginBottom: 18 }}>Profiel laden...</p>}

 <Section title="Uw bedrijf">
 <div className="form-grid">
 {field("Naam", supplierName, setSupplierName)}
 {field("Adres", supplierAddress, setSupplierAddress)}
 {field("Stad", supplierCity, setSupplierCity)}
 {select("Land", supplierCountry, setSupplierCountry, countries)}
 {field("KvK of KBO", supplierKvkKbo, setSupplierKvkKbo)}
 {field("BTW-nummer", supplierVatNr, setSupplierVatNr)}
 {field("IBAN", supplierIban, setSupplierIban)}
 </div>
 </Section>

 <Section title="Klant">
 <div className="form-grid">
 {field("Naam", customerName, setCustomerName)}
 {field("Adres", customerAddress, setCustomerAddress)}
 {field("Stad", customerCity, setCustomerCity)}
 {select("Land", customerCountry, setCustomerCountry, countries)}
 {field("BTW-nummer", customerVatNr, setCustomerVatNr)}
 {field("KvK/KBO optioneel", customerKvkKbo, setCustomerKvkKbo)}
 {field("Peppol-ID optioneel", customerPeppolId, setCustomerPeppolId)}
 {field("Betalingskenmerk", buyerReference, setBuyerReference)}
 </div>
 </Section>

 <Section title="Factuurgegevens">
 <div className="form-grid">
 {field("Factuurnummer", invoiceNumber, setInvoiceNumber)}
 {field("Factuurdatum", invoiceDate, setInvoiceDate, "date")}
 {field("Vervaldatum", dueDate, setDueDate, "date")}
 {select("Valuta", currency, setCurrency, ["EUR"])}
 </div>
 </Section>

 <Section title="Factuurregels">
 <div style={{ display: "grid", gap: 12 }}>
 {lines.map((line) => (
 <div key={line.id} className="line-grid">
 <div>{field("Omschrijving", line.description, (value) => setLine(line.id, { description: value }))}</div>
 <div>{field("Aantal", String(line.quantity), (value) => setLine(line.id, { quantity: Number(value) }), "number")}</div>
 <div>{field("Prijs", String(line.unitPrice), (value) => setLine(line.id, { unitPrice: Number(value) }), "number")}</div>
 <div>{select("BTW%", String(line.vatPct), (value) => setLine(line.id, { vatPct: Number(value) }), ["0", "6", "9", "21"])}</div>
 <div>
 <label style={label}>Totaal excl.</label>
 <input readOnly value={`€${(line.quantity * line.unitPrice).toFixed(2)}`} style={{ ...input, color: C.gray }} />
 </div>
 <button onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} disabled={lines.length === 1} style={{ height: 42, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.gray, cursor: lines.length === 1 ? "not-allowed" : "pointer" }}>
 Verwijder
 </button>
 </div>
 ))}
 <button onClick={() => setLines((current) => [...current, emptyLine()])} style={{ justifySelf: "start", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.white, fontWeight: 700, cursor: "pointer" }}>
 + Regel toevoegen
 </button>
 </div>
 <div style={{ marginTop: 24, display: "grid", gap: 6, color: C.gray, fontSize: 14 }}>
 <strong style={{ color: C.white }}>Totaal excl.: €{totals.excl.toFixed(2)}</strong>
 {Object.entries(totals.vatByPct).map(([pct, value]) => <span key={pct}>BTW {pct}%: €{value.toFixed(2)}</span>)}
 <strong style={{ color: C.white }}>Totaal incl.: €{totals.incl.toFixed(2)}</strong>
 </div>
 </Section>

 {errors.length > 0 && (
 <div style={{ border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
 <strong style={{ color: "#fca5a5" }}>Controleer deze punten:</strong>
 <ul style={{ margin: "10px 0 0", color: "#fecaca" }}>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
 </div>
 )}

 <button onClick={submit} disabled={submitting} style={{ width: "100%", padding: "15px 18px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontWeight: 800, fontSize: 15, cursor: submitting ? "wait" : "pointer" }}>
 {submitting ? "Genereren..." : "Genereer Peppol BIS 3.0 XML"}
 </button>

 {xml && (
 <Section title="XML-preview">
 <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
 <button onClick={downloadXml} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: C.blue, color: "#fff", fontWeight: 700 }}>Download XML</button>
 <button onClick={() => router.push("/dashboard")} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.white, fontWeight: 700 }}>Opslaan in dashboard</button>
 </div>
 <pre style={{ overflow: "auto", maxHeight: 420, background: "rgba(0,0,0,0.32)", borderRadius: 10, padding: 16, color: C.gray, fontSize: 12 }}>{xml}</pre>
 </Section>
 )}
 </div>
 </div>
 );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 20 }}>
 <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{title}</h2>
 {children}
 </section>
 );
}
