import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "Peppol verplicht in België — Wat moet je weten in 2026?",
 description: "Sinds 1 januari 2026 is e-facturatie via Peppol verplicht voor alle Belgische btw-plichtige bedrijven. Boetes tot €5.000. Lees wat je moet doen.",
 alternates: { canonical: "https://peppolpro.nl/peppol-verplicht-belgie" },
 openGraph: {
 title: "Peppol verplicht in België 2026",
 description: "Alles over de Belgische e-facturatieplicht en hoe je in 5 minuten compliant bent.",
 url: "https://peppolpro.nl/peppol-verplicht-belgie",
 },
};

export default function PeppolVerplichtBelgiePage() {
 return (
 <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" }}>
 <nav style={{ marginBottom: "2rem" }}>
 <Link href="/" style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}>
 Terug naar PeppolPro
 </Link>
 </nav>

 <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" }}>
 Peppol verplicht in België: alles wat je moet weten in 2026
 </h1>

 <p style={{ color: "#10b981", fontWeight: 600, marginBottom: "2rem" }}>
 Bijgewerkt: juni 2026
 </p>

 <div style={{ background: "#1a1a2e", border: "1px solid #ef4444", borderRadius: 8, padding: "1.25rem", marginBottom: "2rem" }}>
 <strong style={{ color: "#ef4444" }}>Let op:</strong>
 <span style={{ color: "#fca5a5", marginLeft: 8 }}>
 De tolerantieperiode is afgelopen. Belgische bedrijven die nog geen Peppol-facturen versturen of ontvangen riskeren boetes tot <strong>€5.000</strong>.
 </span>
 </div>

 <h2 style={h2Style}>Wat is de verplichting precies?</h2>
 <p style={pStyle}>
 Sinds 1 januari 2026 moeten alle Belgische btw-plichtige ondernemingen onderling elektronisch factureren via het Peppol-netwerk. Een gewone PDF per e-mail volstaat niet meer voor B2B-transacties. Elk bedrijf moet minimaal Peppol-facturen kunnen <strong>ontvangen</strong> — ook als je zelf weinig factureert.
 </p>

 <h2 style={h2Style}>Geldt dit ook voor Nederlandse bedrijven?</h2>
 <p style={pStyle}>
 Nederlandse bedrijven zijn niet wettelijk verplicht via Peppol te factureren. Maar als je Belgische klanten hebt, eisen die steeds vaker een Peppol-factuur — omdat zij verplicht zijn die te ontvangen. Stuur je nog een PDF, dan loop je kans de factuur afgewezen te krijgen.
 </p>

 <h2 style={h2Style}>Hoe word je snel compliant?</h2>
 <ol style={{ lineHeight: 2, color: "#cbd5e1", paddingLeft: "1.5rem" }}>
 <li>Maak een account aan bij een Peppol Access Point</li>
 <li>Registreer je btw-nummer (KBO) in het Peppol-netwerk</li>
 <li>Verstuur facturen als UBL 2.1 / Peppol BIS 3.0 XML</li>
 <li>Stel je inbox in zodat je inkomende Peppol-facturen ontvangt</li>
 </ol>
 <p style={pStyle}>
 Met PeppolPro doe je dit in minder dan 5 minuten — zonder boekhoudpakket of technische kennis.
 </p>

 <h2 style={h2Style}>Wat kost het?</h2>
 <p style={pStyle}>
 PeppolPro kost <strong>€9/maand</strong> voor verzenden én ontvangen inclusief 7 jaar fiscaal archief. Facturen genereren en downloaden is altijd gratis. De Belgische fiscus geeft bovendien <strong>120% kostenaftrek</strong> op e-facturatiesoftware.
 </p>

 <div style={{ background: "#1e1b4b", border: "1px solid #6366f1", borderRadius: 12, padding: "2rem", marginTop: "3rem", textAlign: "center" }}>
 <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>
 Klaar in 5 minuten
 </h3>
 <p style={{ color: "#a5b4fc", marginBottom: "1.5rem" }}>
 Gratis proberen — 3 Peppol-verzendingen inbegrepen, geen creditcard.
 </p>
 <Link href="/login" style={buttonStyle}>
 Start gratis
 </Link>
 </div>

 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify({
 "@context": "https://schema.org",
 "@type": "Article",
 "headline": "Peppol verplicht in België: alles wat je moet weten in 2026",
 "dateModified": new Date().toISOString(),
 "author": { "@type": "Organization", "name": "SynqLayer" },
 "publisher": { "@type": "Organization", "name": "PeppolPro", "url": "https://peppolpro.nl" },
 }) }}
 />
 </main>
 );
}

const h2Style = { fontSize: "1.35rem", fontWeight: 700, margin: "2rem 0 0.75rem" };
const pStyle = { lineHeight: 1.8, color: "#cbd5e1" };
const buttonStyle = { background: "#6366f1", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-block" };
