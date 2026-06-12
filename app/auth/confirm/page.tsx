"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { C } from "@/lib/constants";
import type { EmailOtpType } from "@supabase/supabase-js";

function AuthConfirmContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const supabase = createClient();
 const tokenHash = useMemo(() => searchParams.get("token_hash"), [searchParams]);
 const code = useMemo(() => searchParams.get("code"), [searchParams]);
 const type = useMemo(() => (searchParams.get("type") || "email") as EmailOtpType, [searchParams]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 const confirm = async () => {
 setLoading(true);
 setError("");

 const { error } = tokenHash
 ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
 : await supabase.auth.exchangeCodeForSession(code || "");

 setLoading(false);
 if (error) {
 setError("Deze loginlink is verlopen, al gebruikt of in een andere browser geopend. Vraag een nieuwe magic link aan.");
 return;
 }
 router.push("/dashboard");
 };

 const hasToken = Boolean(tokenHash || code);

 return (
 <section style={{ width: "100%", maxWidth: 440, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 34, backdropFilter: "blur(20px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)", textAlign: "center" }}>
 <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Inloggen bevestigen</h1>
 <p style={{ fontSize: 14, color: C.dim, margin: "10px 0 22px", lineHeight: 1.6 }}>
 We loggen je pas in nadat je op de knop klikt. Zo kan een automatische mailchecker de link niet verbruiken.
 </p>
 {!hasToken && <p style={{ color: "#fbbf24", fontSize: 13, lineHeight: 1.6 }}>Deze link mist een token. Vraag een nieuwe magic link aan.</p>}
 {code && !tokenHash && <p style={{ color: "#fbbf24", fontSize: 13, lineHeight: 1.6 }}>Deze link gebruikt de oude code-flow. De code wordt pas bij klik verbruikt.</p>}
 {error && <p style={{ color: "#f87171", fontSize: 13, lineHeight: 1.6 }}>{error}</p>}
 <button onClick={confirm} disabled={loading || !hasToken} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 14, fontWeight: 900, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", opacity: loading || !hasToken ? 0.72 : 1 }}>
 {loading ? "Bevestigen..." : "Inloggen bevestigen"}
 </button>
 <Link href="/login" style={{ display: "inline-flex", marginTop: 16, color: C.blue, textDecoration: "none", fontSize: 13, fontWeight: 900 }}>Nieuwe link aanvragen</Link>
 </section>
 );
}

export default function AuthConfirmPage() {
 return (
 <main style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
 <Suspense fallback={<div style={{ color: C.white }}>Laden...</div>}>
 <AuthConfirmContent />
 </Suspense>
 </main>
 );
}
