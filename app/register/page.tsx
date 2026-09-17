"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { C } from "@/lib/constants";
import {
 CHECKOUT_TERMS_VERSION,
 appendCheckoutIntent,
 checkoutIntentCookieValue,
 checkoutResumePath,
 readCheckoutIntentFromSearch,
} from "@/lib/checkout-intent";

function registerErrorMessage(message: string) {
 const lower = message.toLowerCase();
 if (lower.includes("already registered") || lower.includes("already exists")) return "Er bestaat al een account met dit e-mailadres. Log in of reset je wachtwoord.";
 if (lower.includes("password")) return "Gebruik een sterker wachtwoord van minimaal 8 tekens.";
 if (lower.includes("rate limit")) return "Te vaak geprobeerd. Wacht even en probeer opnieuw.";
 return "Registreren lukt niet. Controleer je gegevens en probeer opnieuw.";
}

function RegisterContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const supabase = createClient();
 const checkoutPlan = readCheckoutIntentFromSearch(new URLSearchParams(searchParams.toString()));
 const loginHref = checkoutPlan ? `/login?plan=${encodeURIComponent(checkoutPlan)}&redirect=checkout` : "/login";
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [termsAccepted, setTermsAccepted] = useState(false);
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
 if (!termsAccepted) {
 setError("Bevestig eerst de zakelijke gebruiks- en voorwaardenverklaring.");
 return;
 }

 const acceptedAt = new Date().toISOString();
 setLoading(true);
 const { data, error } = await supabase.auth.signUp({
 email,
 password,
 options: {
  emailRedirectTo: checkoutPlan ? appendCheckoutIntent(`${window.location.origin}/api/auth/callback`, checkoutPlan) : `${window.location.origin}/api/auth/callback?redirect=/onboarding`,
  data: {
   business_use_confirmed: true,
   age_18_plus_confirmed: true,
   terms_version: CHECKOUT_TERMS_VERSION,
   terms_accepted_at: acceptedAt,
  },
 },
 });
 setLoading(false);

 if (error) {
 setError(registerErrorMessage(error.message));
 return;
 }
 if (checkoutPlan) document.cookie = checkoutIntentCookieValue(checkoutPlan);
 if (data.session) router.push(checkoutPlan ? checkoutResumePath(checkoutPlan) : "/onboarding");
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
 <main style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif", padding: 20 }}>
 <section style={{ width: "100%", maxWidth: 460, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 34, backdropFilter: "blur(20px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)" }}>
 <div style={{ textAlign: "center", marginBottom: 28 }}>
 <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16, textDecoration: "none" }}>
 <span style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 900 }}>P</span>
 <span style={{ fontSize: 20, fontWeight: 900, color: C.white }}>Peppol<span style={{ color: C.blue }}>Pro</span></span>
 </Link>
 <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Zakelijk account maken</h1>
 <p style={{ fontSize: 14, color: C.dim, margin: "8px 0 0", lineHeight: 1.6 }}>PeppolPro is bedoeld voor ondernemers en organisaties. Je moet 18+ zijn en bevoegd zijn voor de organisatie te handelen.</p>
 </div>

 {sent ? (
 <div style={{ textAlign: "center", padding: "18px 0" }}>
 <h2 style={{ fontSize: 18, fontWeight: 900, color: C.white, marginBottom: 8 }}>Check je inbox</h2>
 <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6 }}>Bevestig je e-mailadres via de link die we naar <strong style={{ color: C.white }}>{email}</strong> hebben gestuurd.</p>
 <Link href={loginHref} style={{ display: "inline-flex", marginTop: 18, color: "#fff", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, borderRadius: 8, padding: "10px 14px", textDecoration: "none", fontWeight: 900 }}>Naar login</Link>
 </div>
 ) : (
 <form onSubmit={handleRegister} style={{ display: "grid", gap: 12 }}>
 <div>
 <label htmlFor="register-email" style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>E-mail</label>
 <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jouw@bedrijf.nl" autoComplete="email" required style={inputStyle} />
 </div>
 <div>
 <label htmlFor="register-password" style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>Wachtwoord</label>
 <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} style={inputStyle} />
 </div>
 <div>
 <label htmlFor="register-password-confirm" style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>Bevestig wachtwoord</label>
 <input id="register-password-confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} style={inputStyle} />
 </div>

 <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4, padding: 14, border: `1px solid ${C.border}`, borderRadius: 8, color: "#cbd5e1", fontSize: 12, lineHeight: 1.6 }}>
  <input type="checkbox" required checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} style={{ marginTop: 3, width: 17, height: 17 }} />
  <span>Ik ben 18 jaar of ouder, gebruik PeppolPro zakelijk en ben bevoegd voor de onderneming/organisatie te handelen. Ik ga akkoord met de <Link href="/voorwaarden" target="_blank" style={{ color: "#93c5fd" }}>algemene voorwaarden</Link> en heb de <Link href="/privacy" target="_blank" style={{ color: "#93c5fd" }}>privacyverklaring</Link> gelezen.</span>
 </label>

 {error && <p role="alert" style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>}
 <button type="submit" disabled={loading || !termsAccepted} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 14, fontWeight: 900, cursor: loading || !termsAccepted ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading || !termsAccepted ? 0.62 : 1 }}>
 {loading ? "Account maken..." : "Account maken"}
 </button>
 <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.6, margin: 0 }}>We gebruiken registratiegegevens voor accountbeheer, beveiliging en de dienstverlening; niet om je automatisch voor marketing in te schrijven.</p>
 </form>
 )}

 <div style={{ marginTop: 24, textAlign: "center" }}>
 <p style={{ fontSize: 12, color: C.gray, margin: 0 }}>
 Al een account?{" "}
 <Link href={loginHref} style={{ color: C.blue, textDecoration: "none", fontWeight: 800 }}>Log in</Link>
 </p>
 </div>
 </section>
 </main>
 );
}

export default function RegisterPage() {
 return (
 <Suspense fallback={<main style={{ background: C.bg, minHeight: "100vh" }} />}>
 <RegisterContent />
 </Suspense>
 );
}
