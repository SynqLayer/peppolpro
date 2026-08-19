"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { C } from "@/lib/constants";
import {
 appendCheckoutIntent,
 checkoutIntentCookieValue,
 clearCheckoutIntentCookieValue,
 readCheckoutIntentFromSearch,
} from "@/lib/checkout-intent";

type Mode = "password" | "magic";

function authErrorMessage(message: string) {
 const lower = message.toLowerCase();
 if (lower.includes("invalid login credentials")) return "E-mailadres of wachtwoord klopt niet.";
 if (lower.includes("email not confirmed")) return "Je e-mailadres is nog niet bevestigd. Check je inbox.";
 if (lower.includes("user not found")) return "Er bestaat nog geen account met dit e-mailadres.";
 if (lower.includes("rate limit")) return "Te vaak geprobeerd. Wacht even en probeer opnieuw.";
 return "Inloggen lukt niet. Controleer je gegevens en probeer opnieuw.";
}

function LoginContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const supabase = createClient();
 const checkoutPlan = readCheckoutIntentFromSearch(new URLSearchParams(searchParams.toString()));
 const registerHref = checkoutPlan ? `/register?plan=${encodeURIComponent(checkoutPlan)}&redirect=checkout` : "/register";
 const [mode, setMode] = useState<Mode>("password");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const [sent, setSent] = useState(false);
 const [error, setError] = useState("");


 const handlePasswordLogin = async (event: FormEvent) => {
 event.preventDefault();
 setLoading(true);
 setError("");
 const { error } = await supabase.auth.signInWithPassword({ email, password });
 if (error) {
 setLoading(false);
 setError(authErrorMessage(error.message));
 return;
 }
 if (checkoutPlan) {
 document.cookie = checkoutIntentCookieValue(checkoutPlan);
 const res = await fetch("/api/checkout", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ plan: checkoutPlan }),
 });
 const data = await res.json().catch(() => ({}));
 setLoading(false);
 if (data.checkoutUrl) {
 document.cookie = clearCheckoutIntentCookieValue();
 window.location.href = data.checkoutUrl;
 return;
 }
 setError(data.error || "Ingelogd, maar checkout kon niet worden gestart. Probeer het opnieuw vanaf de prijzenpagina.");
 return;
 }
 setLoading(false);
 router.push("/dashboard");
 };

 const handleMagicLink = async (event: FormEvent) => {
 event.preventDefault();
 setLoading(true);
 setError("");
 try {
 const { error } = await supabase.auth.signInWithOtp({
 email,
 options: { emailRedirectTo: appendCheckoutIntent(`${window.location.origin}/auth/confirm`, checkoutPlan) },
 });
 setLoading(false);
 if (error) setError(authErrorMessage(error.message));
 else setSent(true);
 } catch {
 setLoading(false);
 setError("Inloggen lukt niet. Controleer je gegevens en probeer opnieuw.");
 }
 };

 const handleGoogle = async () => {
 try {
 if (checkoutPlan) document.cookie = checkoutIntentCookieValue(checkoutPlan);
 await supabase.auth.signInWithOAuth({
 provider: "google",
 options: { redirectTo: appendCheckoutIntent(`${window.location.origin}/api/auth/callback`, checkoutPlan) },
 });
 } catch {
 setError("Inloggen via Google lukt niet. Probeer opnieuw of gebruik e-mail.");
 }
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
 <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Inloggen</h1>
 <p style={{ fontSize: 14, color: C.dim, margin: "8px 0 0" }}>Kies wachtwoord of magic link.</p>
 </div>

 {sent ? (
 <div style={{ textAlign: "center", padding: "18px 0" }}>
 <h2 style={{ fontSize: 18, fontWeight: 900, color: C.white, marginBottom: 8 }}>Check je inbox</h2>
 <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6 }}>We hebben een loginlink gestuurd naar <strong style={{ color: C.white }}>{email}</strong>.</p>
 <button onClick={() => setSent(false)} style={{ marginTop: 18, border: `1px solid ${C.border}`, background: "transparent", color: C.white, borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontWeight: 800 }}>Terug</button>
 </div>
 ) : (
 <>
 <button onClick={handleGoogle} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.white, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 18 }}>
 Doorgaan met Google
 </button>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "rgba(15,23,42,0.6)", border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, marginBottom: 18 }}>
 {(["password", "magic"] as Mode[]).map((item) => (
 <button key={item} onClick={() => { setMode(item); setError(""); }} style={{ border: 0, borderRadius: 6, padding: "9px 8px", background: mode === item ? `linear-gradient(135deg, ${C.blue}, ${C.indigo})` : "transparent", color: mode === item ? "#fff" : C.gray, fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
 {item === "password" ? "Wachtwoord" : "Magic link"}
 </button>
 ))}
 </div>

 <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink} style={{ display: "grid", gap: 12 }}>
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>E-mail</label>
 <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jouw@email.nl" required style={inputStyle} />
 </div>
 {mode === "password" && (
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>Wachtwoord</label>
 <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} style={inputStyle} />
 <div style={{ marginTop: 8, textAlign: "right" }}>
 <Link href="/wachtwoord-vergeten" style={{ color: C.blue, textDecoration: "none", fontSize: 12, fontWeight: 800 }}>Wachtwoord vergeten?</Link>
 </div>
 </div>
 )}
 {error && <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>}
 <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 14, fontWeight: 900, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", opacity: loading ? 0.72 : 1 }}>
 {loading ? "Even geduld..." : mode === "password" ? "Inloggen" : "Verstuur magic link"}
 </button>
 </form>
 </>
 )}

 <div style={{ marginTop: 24, textAlign: "center" }}>
 <p style={{ fontSize: 12, color: `${C.dim}88`, margin: 0 }}>
 Nog geen account?{" "}
 <Link href={registerHref} style={{ color: C.blue, textDecoration: "none", fontWeight: 800 }}>Registreer</Link>
 </p>
 </div>
 </section>
 </main>
 );
}

export default function LoginPage() {
 return (
 <Suspense fallback={<main style={{ background: C.bg, minHeight: "100vh" }} />}>
 <LoginContent />
 </Suspense>
 );
}
