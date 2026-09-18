import { Metadata } from "next";
import Link from "next/link";
import { CREDIT_BUNDLES, PLANS } from "@/lib/plans";

export const metadata: Metadata = {
 title: "Peppol-factuur voorbereiden — UBL downloaden zonder boekhoudpakket",
 description: "Maak een Peppol BIS 3.0 UBL-bestand zonder boekhoudpakket. Download je UBL of verzend via Peppol na bedrijfsverificatie met een verzendbundel.",
 alternates: { canonical: "https://peppolpro.nl/peppol-factuur-versturen" },
};

export default function PeppolFactuurVersturenPage() {
 return (
 <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" }}>
 <nav style={{ marginBottom: "2rem" }}>
 <Link href="/" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 14 }}>Terug naar PeppolPro</Link>
 </nav>

 <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" }}>Peppol-factuur voorbereiden zonder boekhoudpakket</h1>
 <p style={{ fontSize: "1.1rem", color: "#cbd5e1", marginBottom: "2rem", lineHeight: 1.7 }}>PeppolPro helpt je gecontroleerde factuurgegevens om te zetten naar UBL/XML en kan na bedrijfsverificatie via een aangesloten Peppol-serviceprovider verzenden.</p>

 <h2 style={h2Style}>Wat heb je nodig?</h2>
 <ul style={{ lineHeight: 2.2, color: "#cbd5e1", paddingLeft: "1.5rem" }}>
 <li>Je KvK-nummer (NL) of KBO-nummer (BE)</li>
 <li>BTW-nummer waar dat voor de transactie nodig is</li>
 <li>IBAN en overige factuurgegevens die op de factuur horen</li>
 <li>Een zakelijk PeppolPro-account voor Peppol-verzending</li>
 </ul>

 <h2 style={h2Style}>Hoe werkt het netwerk?</h2>
 <p style={pStyle}>Peppol is een internationaal interoperabiliteitsnetwerk. Eindgebruikers sluiten via serviceproviders/access points aan. Je kunt een UBL-bestand downloaden en elders gebruiken, of met een actieve verzendbundel en afgeronde bedrijfsverificatie via de door PeppolPro aangesloten serviceprovider verzenden.</p>

 <h2 style={h2Style}>Wat kost het?</h2>
 <p style={pStyle}>Onderstaande bedragen zijn de getoonde eindprijzen inclusief btw. Er worden geen extra verzendabonnementen aan een bundel toegevoegd.</p>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", margin: "1rem 0 2rem" }}>
 {[
 { plan: PLANS.free.name, prijs: PLANS.free.price, detail: PLANS.free.features[0] },
 ...Object.values(CREDIT_BUNDLES).map((bundle) => ({ plan: bundle.name, prijs: `${bundle.price} ${bundle.period}`, detail: `${bundle.credits} Peppol-verzendingen, ${bundle.validMonths} maanden geldig` })),
  ].map((p) => (
 <div key={p.plan} style={{ background: "#1a1a2e", border: "1px solid #475569", borderRadius: 8, padding: "1.25rem" }}>
 <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{p.plan}</div>
 <div style={{ color: "#a5b4fc", fontSize: "1.4rem", fontWeight: 800, margin: "0.5rem 0 0" }}>{p.prijs}</div>
 <div style={{ color: "#cbd5e1", fontSize: 12, marginBottom: 8 }}>incl. btw</div>
 <div style={{ color: "#cbd5e1", fontSize: 13 }}>{p.detail}</div>
 </div>
 ))}
 </div>

 <div style={{ background: "#1e1b4b", border: "1px solid #6366f1", borderRadius: 12, padding: "2rem", marginTop: "2rem", textAlign: "center" }}>
 <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>Eerste 3 UBL-generaties gratis</h3>
 <p style={{ color: "#c7d2fe", marginBottom: "1.5rem" }}>Account aanmaken, gegevens controleren, UBL downloaden of na bedrijfsverificatie verzenden met een verzendbundel.</p>
 <Link href="/register" style={buttonStyle}>Start gratis</Link>
 </div>
 </main>
 );
}

const h2Style = { fontSize: "1.35rem", fontWeight: 700, margin: "2rem 0 0.75rem" };
const pStyle = { lineHeight: 1.8, color: "#cbd5e1" };
const buttonStyle = { background: "#6366f1", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-block" };
