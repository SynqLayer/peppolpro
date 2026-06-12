"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { C } from "@/lib/constants";

function registerErrorMessage(message: string) {
 const lower = message.toLowerCase();
 if (lower.includes("already registered") || lower.includes("already exists")) return "Er bestaat al een account met dit e-mailadres. Log in of reset je wachtwoord.";
 if (lower.includes("password")) return "Gebruik een sterker wachtwoord van minimaal 8 tekens.";
 if (lower.includes("rate limit")) return "Te vaak geprobeerd. Wacht even en probeer opnieuw.";
 return "Registreren lukt niet. Controleer je gegevens en probeer opnieuw.";
}

export default function RegisterPage() {
 const router = useRouter();
 const supabase = createClient();
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const [sent, setSent] = useState(false);
 const [error, setError] = useState("");

 const handleRegister = async (event: FormEvent) => {
 event.preventDefault();
 setError("");
 if (password.length < 8) {
 setError("Je wachtwoord moet minimaal 8 tekens hebben.");
 return;
 }
 if (password !== confirmPassword) {
 setError("De wachtwoorden komen niet overeen.");
 return;
 }

 setLoading(true);
 const { data, error } = await supabase.auth.signUp({
 email,
 password,
 options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=/onboarding` },
 });
 setLoading(false);

 if (error) {
 setError(registerErrorMessage(error.message));
 return;
 }
 if (data.session) router.push("/onboarding");
 else setSent(true);
 };

 const inputStyle = {
 width: "100%",
 padding: "12px 14px",
 borderRadius: 8,
 border: `1px solid ${C.border}`,
 background: C.input,
 color: C.white,
 fontSize: 14,
 fontFamily: "inherit",
 outline: "none",
 boxSizing: "border-box" as const,
 };

 return (
 <main style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
 <section style={{ width: "100%", maxWidth: 430, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 34, backdropFilter: "blur(20px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)" }}>
 <div style={{ textAlign: "center", marginBottom: 28 }}>
 <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16, textDecoration: "none" }}>
 <span style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 900 }}>P</span>
 <span style={{ fontSize: 20, fontWeight: 900, color: C.white }}>Peppol<span style={{ color: C.blue }}>Pro</span></span>
 </Link>
 <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Account maken</h1>
 <p style={{ fontSize: 14, color: C.dim, margin: "8px 0 0" }}>Maak een account met e-mail en wachtwoord.</p>
 </div>

 {sent ? (
 <div style={{ textAlign: "center", padding: "18px 0" }}>
 <h2 style={{ fontSize: 18, fontWeight: 900, color: C.white, marginBottom: 8 }}>Check je inbox</h2>
 <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6 }}>Bevestig je e-mailadres via de link die we naar <strong style={{ color: C.white }}>{email}</strong> hebben gestuurd.</p>
 <Link href="/login" style={{ display: "inline-flex", marginTop: 18, color: "#fff", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, borderRadius: 8, padding: "10px 14px", textDecoration: "none", fontWeight: 900 }}>Naar login</Link>
 </div>
 ) : (
 <form onSubmit={handleRegister} style={{ display: "grid", gap: 12 }}>
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>E-mail</label>
 <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jouw@email.nl" required style={inputStyle} />
 </div>
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>Wachtwoord</label>
 <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} style={inputStyle} />
 </div>
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>Bevestig wachtwoord</label>
 <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} style={inputStyle} />
 </div>
 {error && <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>}
 <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 14, fontWeight: 900, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", opacity: loading ? 0.72 : 1 }}>
 {loading ? "Account maken..." : "Account maken"}
 </button>
 </form>
 )}

 <div style={{ marginTop: 24, textAlign: "center" }}>
 <p style={{ fontSize: 12, color: `${C.dim}88`, margin: 0 }}>
 Al een account?{" "}
 <Link href="/login" style={{ color: C.blue, textDecoration: "none", fontWeight: 800 }}>Log in</Link>
 </p>
 </div>
 </section>
 </main>
 );
}
