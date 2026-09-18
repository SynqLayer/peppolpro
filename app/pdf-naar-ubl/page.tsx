import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "PDF naar UBL converteren — online tool",
 description: "Maak UBL 2.1 / Peppol BIS 3.0 XML uit gecontroleerde factuurgegevens. Controleer de gegevens en download de XML.",
 alternates: { canonical: "https://peppolpro.nl/pdf-naar-ubl" },
};

export default function PdfNaarUblPage() {
 return (
 <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" }}>
 <nav style={{ marginBottom: "2rem" }}>
 <Link href="/" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 14 }}>
 Terug naar PeppolPro
 </Link>
 </nav>

 <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" }}>
 PDF naar UBL converteren
 </h1>

 <p style={{ fontSize: "1.1rem", color: "#cbd5e1", marginBottom: "2rem", lineHeight: 1.7 }}>
 Zet gecontroleerde factuurgegevens om naar UBL/XML volgens de door PeppolPro gebruikte Peppol BIS Billing 3.0-regels. Controleer altijd de inhoud voordat je het bestand boekt of verzendt.
 </p>

 <h2 style={h2Style}>Wat is een UBL-factuur?</h2>
 <p style={pStyle}>
 UBL (Universal Business Language) is een XML-formaat dat wordt gebruikt voor gestructureerde elektronische facturen. Peppol BIS Billing 3.0 is een profiel dat aansluit op EN 16931. In België is sinds 1 januari 2026 voor veel binnenlandse B2B-transacties een gestructureerde e-factuur verplicht; internationale facturen vallen niet automatisch onder die specifieke binnenlandse verplichting.
 </p>

 <h2 style={h2Style}>Hoe werkt het bij PeppolPro?</h2>
 <ol style={{ lineHeight: 2.2, color: "#cbd5e1", paddingLeft: "1.5rem" }}>
 <li>Vul of controleer je bedrijfs- en klantgegevens op <Link href="/nieuw" style={{ color: "#93c5fd" }}>/nieuw</Link></li>
 <li>Controleer factuurregels, bedragen en btw-behandeling</li>
 <li>PeppolPro genereert UBL/XML volgens de geïmplementeerde Peppol BIS 3.0- en EN 16931-regels</li>
 <li>Valideer en controleer de output voordat je deze gebruikt</li>
 <li>Wil je direct versturen via Peppol? Maak een zakelijk account aan, rond bedrijfsverificatie af en gebruik verzendtegoed</li>
 </ol>

 <h2 style={h2Style}>AI kan helpen, maar controle blijft nodig</h2>
 <p style={pStyle}>
 PeppolPro kan AI gebruiken om gegevens uit veel gangbare PDF-facturen voor te stellen. Bij scans, bijzondere layouts, slechte beeldkwaliteit of onvolledige broninformatie kunnen gegevens verkeerd of onvolledig worden herkend. Daarom blijft een menselijke controle vóór gebruik of verzending onderdeel van de flow.
 </p>

 <div style={{ background: "#1e1b4b", border: "1px solid #6366f1", borderRadius: 12, padding: "2rem", marginTop: "3rem", textAlign: "center" }}>
 <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>
 Maak een UBL-factuur
 </h3>
 <p style={{ color: "#c7d2fe", marginBottom: "1.5rem" }}>
 Controleer je factuurgegevens en genereer vervolgens de XML.
 </p>
 <Link href="/nieuw" style={buttonStyle}>
 Start
 </Link>
 </div>
 </main>
 );
}

const h2Style = { fontSize: "1.35rem", fontWeight: 700, margin: "2rem 0 0.75rem" };
const pStyle = { lineHeight: 1.8, color: "#cbd5e1" };
const buttonStyle = { background: "#6366f1", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-block" };
