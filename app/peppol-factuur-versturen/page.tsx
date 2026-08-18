import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "Peppol-factuur voorbereiden — UBL downloaden zonder boekhoudpakket",
 description: "Maak een Peppol BIS 3.0 UBL-bestand zonder boekhoudpakket. Download je UBL of verzend via Peppol na bedrijfsverificatie met een verzendbundel.",
 alternates: { canonical: "https://peppolpro.nl/peppol-factuur-versturen" },
};

export default function PeppolFactuurVersturenPage() {
 return (
 <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" }}>
 <nav style={{ marginBottom: "2rem" }}>
 <Link href="/" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}>
 Terug naar PeppolPro
 </Link>
 </nav>

 <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" }}>
 Peppol-factuur voorbereiden zonder boekhoudpakket
 </h1>

 <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "2rem", lineHeight: 1.7 }}>
 Je hoeft geen duur boekhoudpakket te hebben om een Peppol BIS 3.0 UBL-bestand te maken. PeppolPro helpt je de UBL te genereren en downloaden.
 </p>

 <h2 style={h2Style}>Wat heb je nodig?</h2>
 <ul style={{ lineHeight: 2.2, color: "#cbd5e1", paddingLeft: "1.5rem" }}>
 <li>Je KvK-nummer (NL) of KBO-nummer (BE)</li>
 <li>BTW-nummer van jou en de ontvanger</li>
 <li>IBAN voor de betaalreferentie</li>
 <li>Een PeppolPro account (gratis aan te maken)</li>
 </ul>

 <h2 style={h2Style}>Hoe werkt het netwerk?</h2>
 <p style={pStyle}>
 Peppol is een Europees netwerk van access points. Je kunt de UBL downloaden en verzenden via je eigen access point of boekhoudpakket. PeppolPro activeert verzendbundels binnenkort; UBL genereren en downloaden werkt nu al.
 </p>

 <h2 style={h2Style}>Wat kost het?</h2>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", margin: "1rem 0 2rem" }}>
 {[
 { plan: "Gratis", prijs: "€0", detail: "3 gratis UBL-generaties bij registratie" },
 { plan: "Verzenden 25", prijs: "€12/mnd", detail: "25 verzendingen incl., €0,45 extra" },
 { plan: "Verzenden 100", prijs: "€39/mnd", detail: "100 verzendingen incl., €0,35 extra" },
  ].map((p) => (
 <div key={p.plan} style={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, padding: "1.25rem" }}>
 <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{p.plan}</div>
 <div style={{ color: "#6366f1", fontSize: "1.4rem", fontWeight: 800, margin: "0.5rem 0" }}>{p.prijs}</div>
 <div style={{ color: "#94a3b8", fontSize: 13 }}>{p.detail}</div>
 </div>
 ))}
 </div>

 <div style={{ background: "#1e1b4b", border: "1px solid #6366f1", borderRadius: 12, padding: "2rem", marginTop: "2rem", textAlign: "center" }}>
 <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>
 Eerste 3 UBL-generaties gratis
 </h3>
 <p style={{ color: "#a5b4fc", marginBottom: "1.5rem" }}>
 Account aanmaken, gegevens invullen, UBL downloaden of na bedrijfsverificatie verzenden via Peppol met een verzendbundel.
 </p>
 <Link href="/login" style={buttonStyle}>
 Start gratis
 </Link>
 </div>
 </main>
 );
}

const h2Style = { fontSize: "1.35rem", fontWeight: 700, margin: "2rem 0 0.75rem" };
const pStyle = { lineHeight: 1.8, color: "#cbd5e1" };
const buttonStyle = { background: "#6366f1", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-block" };
