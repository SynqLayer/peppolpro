"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { C } from "../../lib/constants";

export default function OnboardingPage() {
 const [country, setCountry] = useState("NL");
 const [companyName, setCompanyName] = useState("");
 const [kvk, setKvk] = useState("");
 const [kbo, setKbo] = useState("");
 const [btw, setBtw] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const router = useRouter();
 const supabase = createClient();

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError("");

 if (country === "NL" && !kvk) { setError("KvK-nummer is verplicht"); setLoading(false); return; }
 if (country === "BE" && !kbo) { setError("KBO-nummer is verplicht"); setLoading(false); return; }
 if (!btw) { setError("BTW-nummer is verplicht"); setLoading(false); return; }

 const { data: { user } } = await supabase.auth.getUser();
 if (!user) { router.push("/login"); return; }

 const { error: dbError } = await supabase
 .from("user_profiles")
 .update({
 company_name: companyName,
 country,
 kvk_kbo: country === "NL" ? kvk : kbo,
 btw_nr: btw,
 onboarding_complete: true,
 })
 .eq("id", user.id);

 setLoading(false);
 if (dbError) setError(dbError.message);
 else router.push("/dashboard");
 };

 const inputStyle: React.CSSProperties = {
 width: "100%", padding: "12px 14px", borderRadius: 10,
 border: `1px solid ${C.border}`, background: C.input || "rgba(15,23,42,0.8)",
 color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none",
 marginBottom: 16, boxSizing: "border-box" as const,
 };

 const labelStyle: React.CSSProperties = {
 display: "block", fontSize: 13, fontWeight: 600, color: C.gray, marginBottom: 6,
 };

 return (
 <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
 <div style={{ width: "100%", maxWidth: 480, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, backdropFilter: "blur(20px)" }}>
 <div style={{ textAlign: "center", marginBottom: 32 }}>
 <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🏢</span>
 <h1 style={{ fontSize: 24, fontWeight: 700, color: C.white, marginBottom: 6 }}>Bedrijfsgegevens</h1>
 <p style={{ fontSize: 14, color: C.dim }}>We hebben je KvK/KBO-nummer nodig voor Peppol-compliant facturen.</p>
 </div>

 <form onSubmit={handleSubmit}>
 <label style={labelStyle}>Land</label>
 <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
 {[
 { code: "NL", flag: "🇳🇱", label: "Nederland" },
 { code: "BE", flag: "🇧🇪", label: "België" },
 ].map((c) => (
 <button key={c.code} type="button" onClick={() => setCountry(c.code)} style={{
 flex: 1, padding: "12px 0", borderRadius: 10, cursor: "pointer",
 border: country === c.code ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
 background: country === c.code ? `${C.blue}11` : "transparent",
 color: C.white, fontSize: 14, fontWeight: 600, fontFamily: "inherit",
 }}>
 {c.flag} {c.label}
 </button>
 ))}
 </div>

 <label style={labelStyle}>Bedrijfsnaam</label>
 <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Jouw Bedrijf B.V." required style={inputStyle} />

 {country === "NL" ? (
 <>
 <label style={labelStyle}>KvK-nummer *</label>
 <input type="text" value={kvk} onChange={(e) => setKvk(e.target.value)} placeholder="12345678" maxLength={8} required style={inputStyle} />
 </>
 ) : (
 <>
 <label style={labelStyle}>KBO-nummer *</label>
 <input type="text" value={kbo} onChange={(e) => setKbo(e.target.value)} placeholder="0123.456.789" required style={inputStyle} />
 </>
 )}

 <label style={labelStyle}>BTW-nummer *</label>
 <input type="text" value={btw} onChange={(e) => setBtw(e.target.value)} placeholder={country === "NL" ? "NL123456789B01" : "BE0123456789"} required style={inputStyle} />

 {error && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{error}</p>}

 <button type="submit" disabled={loading} style={{
 width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
 background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`,
 color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "wait" : "pointer",
 fontFamily: "inherit", opacity: loading ? 0.7 : 1, marginTop: 8,
 }}>
 {loading ? "Opslaan..." : "Opslaan en doorgaan →"}
 </button>
 </form>

 <p style={{ fontSize: 12, color: `${C.dim}88`, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
 Deze gegevens zijn nodig voor UBL-facturen conform Peppol/EN 16931.
 </p>
 </div>
 </div>
 );
}
