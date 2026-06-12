"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { C } from "@/lib/constants";

export default function ForgotPasswordPage() {
 const supabase = createClient();
 const [email, setEmail] = useState("");
 const [loading, setLoading] = useState(false);
 const [sent, setSent] = useState(false);
 const [error, setError] = useState("");

 const handleReset = async (event: FormEvent) => {
 event.preventDefault();
 setLoading(true);
 setError("");
 const { error } = await supabase.auth.resetPasswordForEmail(email, {
 redirectTo: `${window.location.origin}/wachtwoord-reset`,
 });
 setLoading(false);
 if (error) {
 setError("We konden de resetlink niet versturen. Probeer het opnieuw.");
 return;
 }
 setSent(true);
 };

 return (
 <main style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
 <section style={{ width: "100%", maxWidth: 430, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 34, backdropFilter: "blur(20px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)" }}>
 <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Wachtwoord vergeten</h1>
 <p style={{ fontSize: 14, color: C.dim, margin: "10px 0 22px", lineHeight: 1.6 }}>Ook als je eerder alleen magic links gebruikte, kun je hiermee een wachtwoord instellen.</p>

 {sent ? (
 <div>
 <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7 }}>Als dit e-mailadres bestaat, ontvang je zo een link om je wachtwoord in te stellen.</p>
 <Link href="/login" style={{ display: "inline-flex", marginTop: 14, color: C.blue, textDecoration: "none", fontWeight: 900 }}>Terug naar login</Link>
 </div>
 ) : (
 <form onSubmit={handleReset} style={{ display: "grid", gap: 12 }}>
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>E-mail</label>
 <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jouw@email.nl" required style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.input, color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
 </div>
 {error && <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>}
 <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 14, fontWeight: 900, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", opacity: loading ? 0.72 : 1 }}>
 {loading ? "Versturen..." : "Stuur resetlink"}
 </button>
 </form>
 )}
 </section>
 </main>
 );
}

