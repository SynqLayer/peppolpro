"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { C } from "@/lib/constants";

function PasswordResetForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const supabase = createClient();
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const [ready, setReady] = useState(false);
 const [done, setDone] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 const code = searchParams.get("code");
 if (!code) {
 setReady(true);
 return;
 }

 supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
 if (error) setError("Deze resetlink is verlopen of ongeldig. Vraag een nieuwe link aan.");
 setReady(true);
 window.history.replaceState({}, "", "/wachtwoord-reset");
 });
 }, [searchParams, supabase]);

 const handleUpdate = async (event: FormEvent) => {
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
 const { error } = await supabase.auth.updateUser({ password });
 setLoading(false);
 if (error) {
 setError("Wachtwoord aanpassen lukt niet. Vraag eventueel een nieuwe resetlink aan.");
 return;
 }
 setDone(true);
 setTimeout(() => router.push("/dashboard"), 900);
 };

 return (
 <section style={{ width: "100%", maxWidth: 430, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 34, backdropFilter: "blur(20px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)" }}>
 <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Nieuw wachtwoord</h1>
 <p style={{ fontSize: 14, color: C.dim, margin: "10px 0 22px", lineHeight: 1.6 }}>Stel een wachtwoord in van minimaal 8 tekens.</p>

 {!ready ? (
 <p style={{ color: C.gray, fontSize: 14 }}>Resetlink controleren...</p>
 ) : done ? (
 <div>
 <p style={{ color: "#6ee7b7", fontSize: 14, lineHeight: 1.7, fontWeight: 900 }}>Je wachtwoord is aangepast.</p>
 <Link href="/dashboard" style={{ display: "inline-flex", marginTop: 14, color: C.blue, textDecoration: "none", fontWeight: 900 }}>Naar dashboard</Link>
 </div>
 ) : (
 <form onSubmit={handleUpdate} style={{ display: "grid", gap: 12 }}>
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>Nieuw wachtwoord</label>
 <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.input, color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
 </div>
 <div>
 <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6 }}>Bevestig wachtwoord</label>
 <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.input, color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
 </div>
 {error && <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>}
 <button type="submit" disabled={loading || Boolean(error && error.includes("verlopen"))} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 14, fontWeight: 900, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", opacity: loading ? 0.72 : 1 }}>
 {loading ? "Opslaan..." : "Wachtwoord opslaan"}
 </button>
 <Link href="/wachtwoord-vergeten" style={{ color: C.blue, textDecoration: "none", fontSize: 12, fontWeight: 900, textAlign: "center" }}>Nieuwe resetlink aanvragen</Link>
 </form>
 )}
 </section>
 );
}

export default function PasswordResetPage() {
 return (
 <main style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
 <Suspense fallback={<div style={{ color: C.white }}>Laden...</div>}>
 <PasswordResetForm />
 </Suspense>
 </main>
 );
}
