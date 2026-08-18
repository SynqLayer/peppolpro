"use client";
import { useState, useRef } from "react";
import { C } from "../../lib/constants";

export default function ConvertPage() {
 const [file, setFile] = useState<File | null>(null);
 const [dragging, setDragging] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [result, setResult] = useState<{ parsed: Record<string, unknown>; ubl_xml: string; conversion_id: string } | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const handleFile = (f: File) => {
 if (f.type !== "application/pdf") { setError("Alleen PDF-bestanden zijn toegestaan"); return; }
 if (f.size > 10 * 1024 * 1024) { setError("Bestand mag maximaal 10MB zijn"); return; }
 setFile(f);
 setError("");
 setResult(null);
 };

 const handleConvert = async () => {
 if (!file) return;
 setLoading(true);
 setError("");

 const formData = new FormData();
 formData.append("pdf", file);

 try {
 const res = await fetch("/api/convert", { method: "POST", body: formData });
 const data = await res.json();

 if (!res.ok) {
 setError(data.error || "Er ging iets mis");
 setLoading(false);
 return;
 }

 setResult(data);
 } catch {
 setError("Netwerkfout. Probeer opnieuw.");
 }
 setLoading(false);
 };

 const downloadUBL = () => {
 if (!result) return;
 const blob = new Blob([result.ubl_xml], { type: "application/xml" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `${(result.parsed as Record<string, Record<string, string>>)?.invoice?.number || "factuur"}.xml`;
 a.click();
 URL.revokeObjectURL(url);
 };

 const cardStyle: React.CSSProperties = {
 background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
 padding: 32, backdropFilter: "blur(20px)",
 };

 return (
 <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.white }}>
 {/* Top bar */}
 <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
 <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 60 }}>
 <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.white }}>
 <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
 <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>P</span>
 </div>
 <span style={{ fontSize: 18, fontWeight: 800 }}>Peppol<span style={{ color: C.blue }}>Pro</span></span>
 </a>
 <a href="/dashboard" style={{ fontSize: 13, color: C.dim, textDecoration: "none" }}>← Dashboard</a>
 </div>
 </div>

 <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
 <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Factuur converteren</h1>
 <p style={{ fontSize: 15, color: C.dim, marginBottom: 32 }}>Upload een PDF-factuur en ontvang UBL 2.1 XML</p>

 {!result ? (
 <>
 {/* Upload zone */}
 <div
 onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
 onDragLeave={() => setDragging(false)}
 onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
 onClick={() => inputRef.current?.click()}
 style={{
 ...cardStyle,
 border: dragging ? `2px dashed ${C.blue}` : file ? `2px solid ${C.blue}33` : `2px dashed ${C.border}`,
 background: dragging ? `${C.blue}08` : file ? `${C.blue}05` : C.card,
 cursor: "pointer", textAlign: "center", padding: "60px 32px",
 transition: "all 0.2s",
 }}
 >
 <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
 {file ? (
 <>
 <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📄</span>
 <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{file.name}</p>
 <p style={{ fontSize: 13, color: C.dim }}>{(file.size / 1024).toFixed(0)} KB · Klik om te wijzigen</p>
 </>
 ) : (
 <>
 <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📂</span>
 <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Sleep je PDF hierheen</p>
 <p style={{ fontSize: 13, color: C.dim }}>of klik om te selecteren · Max 10MB</p>
 </>
 )}
 </div>

 {error && (
 <div style={{ ...cardStyle, marginTop: 16, borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
 <p style={{ fontSize: 14, color: "#ef4444" }}>❌ {error}</p>
 </div>
 )}

 {file && (
 <button onClick={handleConvert} disabled={loading} style={{
 width: "100%", marginTop: 20, padding: "16px 0", borderRadius: 12, border: "none",
 background: loading ? C.dim : `linear-gradient(135deg, ${C.blue}, ${C.indigo})`,
 color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "wait" : "pointer",
 fontFamily: "inherit", transition: "all 0.2s",
 }}>
 {loading ? "⏳ AI leest je factuur..." : "🧠 Converteer naar UBL"}
 </button>
 )}
 </>
 ) : (
 <>
 {/* Success result */}
 <div style={{ ...cardStyle, borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.05)", marginBottom: 20 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
 <span style={{ fontSize: 28 }}>✅</span>
 <div>
 <h2 style={{ fontSize: 18, fontWeight: 700 }}>Conversie geslaagd!</h2>
 <p style={{ fontSize: 13, color: C.dim }}>Je UBL 2.1 XML is klaar om te downloaden</p>
 </div>
 </div>

 {/* Parsed summary */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
 {[
 { l: "Factuurnummer", v: (result.parsed as Record<string, Record<string, string>>)?.invoice?.number },
 { l: "Datum", v: (result.parsed as Record<string, Record<string, string>>)?.invoice?.date },
 { l: "Leverancier", v: (result.parsed as Record<string, Record<string, string>>)?.seller?.name },
 { l: "Klant", v: (result.parsed as Record<string, Record<string, string>>)?.buyer?.name },
 { l: "BTW leverancier", v: (result.parsed as Record<string, Record<string, string>>)?.seller?.btw_number },
 { l: "BTW klant", v: (result.parsed as Record<string, Record<string, string>>)?.buyer?.btw_number },
 { l: "Subtotaal", v: `€${(result.parsed as Record<string, Record<string, number>>)?.totals?.subtotal}` },
 { l: "Totaal", v: `€${(result.parsed as Record<string, Record<string, number>>)?.totals?.total}` },
 ].map((item, i) => (
 <div key={i}>
 <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, marginBottom: 2 }}>{item.l}</div>
 <div style={{ fontSize: 14, fontWeight: 600 }}>{item.v || "—"}</div>
 </div>
 ))}
 </div>

 <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
 <button onClick={downloadUBL} style={{
 background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, border: "none",
 color: "#fff", fontWeight: 600, fontSize: 14, padding: "12px 28px", borderRadius: 10,
 cursor: "pointer", fontFamily: "inherit",
 }}>
 ⬇️ Download UBL XML
 </button>
 <button onClick={() => { setResult(null); setFile(null); }} style={{
 background: "transparent", border: `1px solid ${C.border}`,
 color: C.gray, fontWeight: 600, fontSize: 14, padding: "12px 28px", borderRadius: 10,
 cursor: "pointer", fontFamily: "inherit",
 }}>
 📄 Nieuwe factuur
 </button>
 </div>
 </div>

 {/* XML preview */}
 <div style={cardStyle}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
 <h3 style={{ fontSize: 14, fontWeight: 700 }}>UBL XML Preview</h3>
 <button onClick={() => navigator.clipboard.writeText(result.ubl_xml)} style={{
 background: "transparent", border: `1px solid ${C.border}`, color: C.dim,
 fontSize: 12, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
 }}>
 📋 Kopieer
 </button>
 </div>
 <pre style={{
 fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.gray,
 background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 10,
 overflow: "auto", maxHeight: 300, lineHeight: 1.5,
 }}>
 {result.ubl_xml}
 </pre>
 </div>
 </>
 )}
 </div>
 </div>
 );
}