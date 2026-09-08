"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/constants";

type ProfileShape = {
 company_name?: string | null;
 country?: string | null;
 kvk_kbo?: string | null;
 btw_nr?: string | null;
 address?: string | null;
 postal_code?: string | null;
 city?: string | null;
 address_verified?: boolean | null;
 address_validation_source?: string | null;
};

export default function ProfileForm({ profile, mode }: { profile: ProfileShape | null; mode: "onboarding" | "profile" }) {
 const router = useRouter();
 const initialCountry = (profile?.country || "NL").toUpperCase();
 const [country, setCountry] = useState(initialCountry);
 const [companyName, setCompanyName] = useState(profile?.company_name || "");
 const [kvkKbo, setKvkKbo] = useState(profile?.kvk_kbo || "");
 const [btw, setBtw] = useState(profile?.btw_nr || "");
 const [address, setAddress] = useState(profile?.address || "");
 const [postalCode, setPostalCode] = useState(profile?.postal_code || "");
 const [city, setCity] = useState(profile?.city || "");
 const [houseNumber, setHouseNumber] = useState("");
 const [manualAddress, setManualAddress] = useState(country !== "NL" || profile?.address_validation_source === "manual" || Boolean(profile?.address && profile.address_validation_source !== "pdok"));
 const [loading, setLoading] = useState(false);
 const [lookupLoading, setLookupLoading] = useState(false);
 const [error, setError] = useState("");
 const [warning, setWarning] = useState("");

 const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.input || "rgba(15,23,42,0.8)",
  color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box" as const,
 };
 const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 800, color: C.gray, marginBottom: 6,
 };

 async function lookupAddress() {
  setLookupLoading(true);
  setError("");
  const params = new URLSearchParams({ postalCode, houseNumber });
  const res = await fetch(`/api/address/lookup?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  setLookupLoading(false);
  if (!res.ok) {
   setError(data.error || "Adres niet gevonden. Gebruik handmatige invoer als dit adres klopt.");
   return;
  }
  setAddress(data.address || "");
  setPostalCode(data.postalCode || postalCode);
  setCity(data.city || "");
 }

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError("");
  setWarning("");
  const res = await fetch("/api/profile", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    companyName,
    country,
    kvkKbo,
    vatNumber: btw,
    address,
    postalCode,
    city,
    houseNumber,
    manualAddress,
    completeOnboarding: true,
   }),
  });
  const data = await res.json().catch(() => ({}));
  setLoading(false);
  if (!res.ok) {
   setError(data.error || "Opslaan mislukt");
   return;
  }
  if (data.warning) setWarning(data.warning);
  router.push(mode === "onboarding" ? "/dashboard" : "/dashboard");
  router.refresh();
 }

 return (
  <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
   <div style={{ width: "100%", maxWidth: 640, margin: "0 auto", paddingTop: 48 }}>
    {mode === "profile" && <Link href="/dashboard" style={{ color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>Terug naar dashboard</Link>}
    <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28 }}>
     <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Bedrijfsprofiel</h1>
     <p style={{ fontSize: 14, color: C.dim, margin: "8px 0 24px" }}>Deze gegevens worden gebruikt voor facturatie en Peppol-verzending.</p>

     <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div>
       <label style={labelStyle}>Land</label>
       <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {["NL", "BE", "OTHER"].map((code) => (
         <button key={code} type="button" onClick={() => { setCountry(code === "OTHER" ? "DE" : code); setManualAddress(code !== "NL"); }} style={{
          minHeight: 42, borderRadius: 8, cursor: "pointer",
          border: (code === "OTHER" ? !["NL", "BE"].includes(country) : country === code) ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
          background: (code === "OTHER" ? !["NL", "BE"].includes(country) : country === code) ? `${C.blue}18` : "transparent",
          color: C.white, fontSize: 13, fontWeight: 800, fontFamily: "inherit",
         }}>{code === "OTHER" ? "Overig" : code}</button>
        ))}
       </div>
      </div>

      <div><label style={labelStyle}>Bedrijfsnaam</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required style={inputStyle} /></div>
      <div><label style={labelStyle}>{country === "BE" ? "KBO-nummer" : "KvK-nummer"}</label><input value={kvkKbo} onChange={(e) => setKvkKbo(e.target.value)} required style={inputStyle} /></div>
      <div><label style={labelStyle}>BTW-nummer</label><input value={btw} onChange={(e) => setBtw(e.target.value)} placeholder={country === "BE" ? "BE0123456789" : "NL123456789B01"} required style={inputStyle} /></div>

      {country === "NL" && !manualAddress && (
       <div style={{ display: "grid", gap: 12, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 10 }}>
         <div><label style={labelStyle}>Postcode</label><input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1234 AB" required style={inputStyle} /></div>
         <div><label style={labelStyle}>Huisnummer</label><input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} required style={inputStyle} /></div>
        </div>
        <button type="button" onClick={lookupAddress} disabled={lookupLoading} style={{ minHeight: 40, borderRadius: 8, border: 0, color: "#fff", background: C.blue, fontWeight: 900, cursor: lookupLoading ? "wait" : "pointer" }}>{lookupLoading ? "Zoeken..." : "Adres ophalen"}</button>
        <div><label style={labelStyle}>Straat + huisnummer</label><input value={address} readOnly style={{ ...inputStyle, opacity: 0.78 }} /></div>
        <div><label style={labelStyle}>Plaats</label><input value={city} readOnly style={{ ...inputStyle, opacity: 0.78 }} /></div>
       </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 10, color: C.white, fontSize: 14, fontWeight: 800 }}>
       <input type="checkbox" checked={manualAddress} onChange={(e) => setManualAddress(e.target.checked)} />
       Adres handmatig invullen
      </label>

      {(manualAddress || country !== "NL") && (
       <div style={{ display: "grid", gap: 12, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
        <div><label style={labelStyle}>Straat + huisnummer</label><input value={address} onChange={(e) => setAddress(e.target.value)} required style={inputStyle} /></div>
        <div><label style={labelStyle}>Postcode</label><input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required style={inputStyle} /></div>
        <div><label style={labelStyle}>Plaats</label><input value={city} onChange={(e) => setCity(e.target.value)} required style={inputStyle} /></div>
        <div><label style={labelStyle}>Land</label><input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} required style={inputStyle} /></div>
       </div>
      )}

      {error && <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>{error}</p>}
      {warning && <p style={{ fontSize: 13, color: "#fbbf24", margin: 0 }}>{warning}</p>}
      <button type="submit" disabled={loading} style={{ width: "100%", minHeight: 46, borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 15, fontWeight: 900, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
       {loading ? "Opslaan..." : "Opslaan"}
      </button>
     </form>
    </div>
   </div>
  </div>
 );
}
