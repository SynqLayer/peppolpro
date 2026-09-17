import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "E-facturatie verplicht in België — wat geldt in 2026?",
 description: "Actuele uitleg over de Belgische verplichting voor gestructureerde B2B e-facturen sinds 1 januari 2026, uitzonderingen, Peppol en sancties.",
 alternates: { canonical: "https://peppolpro.nl/peppol-verplicht-belgie" },
 openGraph: {
 title: "E-facturatie in België sinds 2026",
 description: "Actuele uitleg over de Belgische B2B e-facturatieplicht en Peppol.",
 url: "https://peppolpro.nl/peppol-verplicht-belgie",
 },
};

export default function PeppolVerplichtBelgiePage() {
 return (
 <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" }}>
 <nav style={{ marginBottom: "2rem" }}>
 <Link href="/" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 14 }}>Terug naar PeppolPro</Link>
 </nav>

 <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" }}>
 Belgische B2B e-facturatie: wat geldt in 2026?
 </h1>

 <p style={{ color: "#34d399", fontWeight: 600, marginBottom: "2rem" }}>Bijgewerkt: 17 september 2026</p>

 <div style={{ background: "#172554", border: "1px solid #3b82f6", borderRadius: 8, padding: "1.25rem", marginBottom: "2rem" }}>
 <strong style={{ color: "#bfdbfe" }}>Kort samengevat:</strong>
 <span style={{ color: "#dbeafe", marginLeft: 8 }}>
 Sinds 1 januari 2026 moeten Belgische btw-plichtige ondernemingen voor transacties die binnen het toepassingsgebied vallen onderling gestructureerde elektronische facturen gebruiken. De algemene tolerantieperiode van de eerste drie maanden van 2026 is voorbij.
 </span>
 </div>

 <h2 style={h2Style}>Wat is de verplichting precies?</h2>
 <p style={pStyle}>
 Voor binnenlandse B2B-transacties tussen ondernemingen die onder de Belgische regeling vallen is een gewone PDF per e-mail niet de vereiste gestructureerde elektronische factuur. Peppol BIS via het Peppol-netwerk is de standaardroute. Een alternatief formaat en een alternatieve overdrachtswijze kunnen onder voorwaarden en met onderling akkoord mogelijk zijn als de Europese norm EN 16931 wordt gerespecteerd.
 </p>
 <p style={pStyle}>Er bestaan uitzonderingen en bijzondere situaties. Controleer daarom altijd of jouw onderneming én de concrete transactie binnen het toepassingsgebied vallen.</p>

 <h2 style={h2Style}>Geldt dit ook voor Nederlandse bedrijven?</h2>
 <p style={pStyle}>
 Niet automatisch. De Belgische binnenlandse B2B-verplichting is beperkt tot het toepassingsgebied in België. Niet in België gevestigde belastingplichtigen zonder vaste inrichting vallen volgens de Belgische overheid buiten die verplichting, ook als zij in België voor btw-doeleinden zijn geïdentificeerd. Internationale facturatie valt dus niet alleen vanwege een Belgische klant automatisch onder deze binnenlandse verplichting.
 </p>
 <p style={pStyle}>Een Belgische klant kan uiteraard contractueel of operationeel alsnog om een gestructureerde factuur of Peppol-verzending vragen.</p>

 <h2 style={h2Style}>Peppol en ontvangen</h2>
 <p style={pStyle}>Belgische ondernemingen die onder de verplichting vallen moeten de vereiste technische mogelijkheden hebben om gestructureerde elektronische facturen te kunnen uitreiken en ontvangen. De precieze oplossing hoeft niet PeppolPro te zijn; aansluiting verloopt via geschikte e-facturatiesoftware en/of een Peppol-serviceprovider.</p>

 <h2 style={h2Style}>Sancties: geen simpele “€5.000-boete”</h2>
 <p style={pStyle}>De Belgische FAQ noemt verschillende bestaande fiscale boetes voor ontbrekende, te late of niet-conforme facturen. Daarnaast bestaat voor het niet beschikken over de vereiste technische middelen een niet-proportionele boete van €1.500 bij de eerste overtreding, €3.000 bij een tweede en €5.000 bij volgende overtredingen, met voorwaarden voor wanneer een inbreuk als volgende overtreding telt. De concrete sanctie hangt af van de overtreding en omstandigheden.</p>

 <h2 style={h2Style}>Wat kan PeppolPro doen?</h2>
 <ol style={{ lineHeight: 2, color: "#cbd5e1", paddingLeft: "1.5rem" }}>
 <li>factuurgegevens uitlezen of handmatig laten controleren;</li>
 <li>UBL/XML genereren volgens de geïmplementeerde Peppol BIS Billing 3.0-regels;</li>
 <li>na bedrijfsverificatie en met verzendtegoed via de aangesloten Peppol-serviceprovider verzenden;</li>
 <li>gepubliceerde deelnemers en documenttypen in de Peppol Directory controleren en monitoren.</li>
 </ol>
 <p style={pStyle}>PeppolPro biedt momenteel geen eigen inkomende Peppol-inbox voor het ontvangen van leveranciersfacturen. Controleer daarom apart hoe jouw onderneming aan een eventuele ontvangstplicht voldoet.</p>

 <div style={{ background: "#1e1b4b", border: "1px solid #6366f1", borderRadius: 12, padding: "2rem", marginTop: "3rem", textAlign: "center" }}>
 <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>UBL maken of Peppol-verzending voorbereiden</h3>
 <p style={{ color: "#c7d2fe", marginBottom: "1.5rem" }}>Nieuwe zakelijke accounts krijgen eenmalig 3 UBL-generaties. Voor verzending zijn bedrijfsverificatie en verzendtegoed nodig.</p>
 <Link href="/register" style={buttonStyle}>Start gratis</Link>
 </div>

 <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
 "@context": "https://schema.org",
 "@type": "Article",
 "headline": "Belgische B2B e-facturatie: wat geldt in 2026?",
 "dateModified": "2026-09-17",
 "author": { "@type": "Organization", "name": "SynqLayer" },
 "publisher": { "@type": "Organization", "name": "PeppolPro", "url": "https://peppolpro.nl" },
 }) }} />
 </main>
 );
}

const h2Style = { fontSize: "1.35rem", fontWeight: 700, margin: "2rem 0 0.75rem" };
const pStyle = { lineHeight: 1.8, color: "#cbd5e1" };
const buttonStyle = { background: "#6366f1", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-block" };
