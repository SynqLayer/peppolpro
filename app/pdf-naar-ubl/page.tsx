import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "PDF naar UBL converteren — Gratis online tool",
 description: "Converteer je PDF-factuur naar een geldige UBL 2.1 / Peppol BIS 3.0 XML. Gratis online, geen installatie, direct downloaden.",
 alternates: { canonical: "https://peppolpro.nl/pdf-naar-ubl" },
};

export default function PdfNaarUblPage() {
 return (
 <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" }}>
 <nav style={{ marginBottom: "2rem" }}>
 <Link href="/" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}>
 Terug naar PeppolPro
 </Link>
 </nav>

 <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" }}>
 PDF naar UBL converteren — gratis en direct
 </h1>

 <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "2rem", lineHeight: 1.7 }}>
 Maak een geldige Peppol BIS 3.0 UBL-factuur zonder technische kennis. Vul je factuurgegevens in, download de XML — klaar.
 </p>

 <h2 style={h2Style}>Wat is een UBL-factuur?</h2>
 <p style={pStyle}>
 UBL (Universal Business Language) is de XML-standaard voor elektronische facturen. Peppol BIS 3.0 is het profiel dat in Europa — en verplicht in België — wordt gebruikt voor B2B e-facturatie. Een gewone PDF is geen geldige e-factuur.
 </p>

 <h2 style={h2Style}>Hoe werkt het bij PeppolPro?</h2>
 <ol style={{ lineHeight: 2.2, color: "#cbd5e1", paddingLeft: "1.5rem" }}>
 <li>Vul je bedrijfs- en klantgegevens in op <Link href="/nieuw" style={{ color: "#6366f1" }}>/nieuw</Link></li>
 <li>Voeg je factuurregels toe met bedrag en BTW-tarief</li>
 <li>PeppolPro genereert een 100% conforme Peppol BIS 3.0 XML</li>
 <li>Download de XML — gratis, geen account vereist voor de download</li>
 <li>Wil je direct versturen via Peppol? Maak een gratis account aan</li>
 </ol>

 <h2 style={h2Style}>Waarom geen AI-parsing van PDF?</h2>
 <p style={pStyle}>
 Veel tools proberen je PDF automatisch uit te lezen met AI. Dat klinkt handig, maar voor juridisch geldige facturen is nauwkeurigheid belangrijker dan gemak. Een fout in de XML kan leiden tot een afgewezen factuur. Bij PeppolPro vul je de gegevens zelf in — de output is altijd 100% correct.
 </p>

 <div style={{ background: "#1e1b4b", border: "1px solid #6366f1", borderRadius: 12, padding: "2rem", marginTop: "3rem", textAlign: "center" }}>
 <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>
 Maak nu een gratis UBL-factuur
 </h3>
 <p style={{ color: "#a5b4fc", marginBottom: "1.5rem" }}>
 Geen account nodig voor genereren en downloaden.
 </p>
 <Link href="/nieuw" style={buttonStyle}>
 Start gratis
 </Link>
 </div>
 </main>
 );
}

const h2Style = { fontSize: "1.35rem", fontWeight: 700, margin: "2rem 0 0.75rem" };
const pStyle = { lineHeight: 1.8, color: "#cbd5e1" };
const buttonStyle = { background: "#6366f1", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-block" };
