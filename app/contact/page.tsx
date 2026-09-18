"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { C } from "../../lib/constants";

export default function ContactPage() {
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [company, setCompany] = useState("");
 const [message, setMessage] = useState("");
 const [loading, setLoading] = useState(false);
 const [sent, setSent] = useState(false);
 const [error, setError] = useState("");

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError("");

 const supabase = createClient();
 const { error: dbError } = await supabase
 .from("contact_messages")
 .insert({ name, email, company, message, subject: "Contact via website" });

 setLoading(false);
 if (dbError) setError("Er ging iets mis. Probeer opnieuw.");
 else setSent(true);
 };

 const inputStyle: React.CSSProperties = {
 width: "100%", padding: "12px 14px", borderRadius: 10,
 border: `1px solid ${C.border}`, background: C.input || "rgba(15,23,42,0.8)",
 color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none",
 marginBottom: 16, boxSizing: "border-box" as const,
 };

 return (
 <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: C.white }}>
 <div style={{ maxWidth: 520, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#93c5fd", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Contact</h1>
 <p style={{ fontSize: 15, color: C.gray, marginBottom: 32 }}>Heb je een vraag of wil je samenwerken? Stuur ons een bericht.</p>

 {sent ? (
 <div role="status" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 32, textAlign: "center" }}>
 <span aria-hidden="true" style={{ fontSize: 40, display: "block", marginBottom: 12 }}>✅</span>
 <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bericht verstuurd</h2>
 <p style={{ fontSize: 14, color: C.gray }}>We nemen je bericht in behandeling en reageren zo snel mogelijk.</p>
 </div>
 ) : (
 <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, backdropFilter: "blur(20px)" }}>
 <label htmlFor="contact-name" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.gray, marginBottom: 6 }}>Naam *</label>
 <input id="contact-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jouw naam" autoComplete="name" required maxLength={120} style={inputStyle} />

 <label htmlFor="contact-email" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.gray, marginBottom: 6 }}>E-mail *</label>
 <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jouw@email.nl" autoComplete="email" required maxLength={254} style={inputStyle} />

 <label htmlFor="contact-company" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.gray, marginBottom: 6 }}>Bedrijf</label>
 <input id="contact-company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optioneel" autoComplete="organization" maxLength={160} style={inputStyle} />

 <label htmlFor="contact-message" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.gray, marginBottom: 6 }}>Bericht *</label>
 <textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Waar kunnen we je mee helpen?" required maxLength={5000} rows={5} style={{ ...inputStyle, resize: "vertical" as const }} />

 <p style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, margin: "0 0 16px" }}>We gebruiken deze gegevens om je vraag te behandelen en voor beveiliging/misbruikpreventie. Dit formulier schrijft je niet in voor marketing. Zie de <Link href="/privacy" style={{ color: "#93c5fd" }}>privacyverklaring</Link>.</p>

 {error && <p role="alert" style={{ fontSize: 13, color: "#f87171", marginBottom: 12 }}>{error}</p>}

 <button type="submit" disabled={loading} style={{
 width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
 background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`,
 color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "wait" : "pointer",
 fontFamily: "inherit", opacity: loading ? 0.7 : 1,
 }}>
 {loading ? "Versturen..." : "Verstuur bericht →"}
 </button>
 </form>
 )}
 </div>
 </div>
 );
}
