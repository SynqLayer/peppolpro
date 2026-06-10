import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "Peppol factuur versturen — UBL BIS 3.0 in minuten",
 description: "Verstuur Peppol-facturen zonder boekhoudpakket. Maak UBL BIS 3.0 XML, beheer credits en upgrade wanneer je wilt ontvangen.",
 alternates: { canonical: "https://peppolpro.nl/peppol-factuur-versturen" },
 openGraph: {
 title: "Peppol factuur versturen",
 description: "Maak en verstuur Peppol-facturen zonder zwaar boekhoudpakket.",
 url: "https://peppolpro.nl/peppol-factuur-versturen",
 },
};

export default function PeppolFactuurVersturenPage() {
 return (
 <main style={pageStyle}>
 <nav style={{ marginBottom: "2rem" }}><Link href="/" style={linkStyle}>Terug naar PeppolPro</Link></nav>
 <article>
 <p style={eyebrowStyle}>Peppol factuur versturen</p>
 <h1 style={h1Style}>Peppol-facturen versturen zonder boekhoudpakket</h1>
 <p style={leadStyle}>
 Maak een Peppol BIS 3.0 factuur, download de XML en verzend via Peppol wanneer je klant daarom vraagt. PeppolPro is gebouwd voor ondernemers die snel compliant willen zijn.
 </p>

 <section style={stepsStyle}>
 <Step number="1" title="Vul je factuur in" text="Leverancier, klant, factuurregels, btw en betaalgegevens staan in één overzichtelijk formulier." />
 <Step number="2" title="Genereer Peppol XML" text="PeppolPro maakt UBL 2.1 met Peppol BIS 3.0 profiel, btw-totalen en endpointgegevens." />
 <Step number="3" title="Download of verzend" text="Download gratis je XML of gebruik een pakket voor verzending, inbox en archief." />
 </section>

 <h2 style={h2Style}>Waarom Peppol?</h2>
 <p style={paragraphStyle}>
 Peppol zorgt dat facturen niet als losse PDF in een mailbox verdwijnen, maar als gestructureerde data bij de ontvanger binnenkomen. Dat vermindert handwerk, afkeur en vertraging in de betaling.
 </p>

 <h2 style={h2Style}>Voor wie is dit handig?</h2>
 <ul style={listStyle}>
 <li>Nederlandse bedrijven met Belgische klanten.</li>
 <li>ZZP'ers en MKB-bedrijven die geen groot boekhoudpakket willen.</li>
 <li>Teams die snel UBL/Peppol-ready moeten zijn voor aanbestedingen of overheidsklanten.</li>
 </ul>

 <div style={ctaStyle}>
 <h2 style={{ ...h2Style, marginTop: 0 }}>Start met 3 gratis Peppol-verzendingen</h2>
 <p style={{ ...paragraphStyle, marginBottom: 18 }}>Maak je eerste factuur vandaag en upgrade pas wanneer je structureel wilt verzenden of ontvangen.</p>
 <Link href="/login" style={buttonStyle}>Start gratis</Link>
 </div>
 </article>
 </main>
 );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
 return (
 <div style={cardStyle}>
 <span style={numberStyle}>{number}</span>
 <h2 style={{ fontSize: 18, margin: "12px 0 8px", letterSpacing: 0 }}>{title}</h2>
 <p style={{ color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>{text}</p>
 </div>
 );
}

const pageStyle = { maxWidth: 980, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" };
const eyebrowStyle = { color: "#818cf8", fontWeight: 800, marginBottom: "1rem" };
const h1Style = { fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "1rem", letterSpacing: 0 };
const h2Style = { fontSize: "1.35rem", fontWeight: 800, margin: "2rem 0 0.75rem", letterSpacing: 0 };
const leadStyle = { lineHeight: 1.8, color: "#cbd5e1", fontSize: 18, maxWidth: 760 };
const paragraphStyle = { lineHeight: 1.8, color: "#cbd5e1", fontSize: 16 };
const listStyle = { lineHeight: 2, color: "#cbd5e1", paddingLeft: "1.5rem", margin: 0 };
const linkStyle = { color: "#818cf8", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const stepsStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, margin: "2rem 0" };
const cardStyle = { background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "1.25rem" };
const numberStyle = { display: "inline-flex", width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, background: "#312e81", color: "#c4b5fd", fontWeight: 800 };
const ctaStyle = { background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "1.5rem", marginTop: "2.5rem" };
const buttonStyle = { display: "inline-block", background: "#6366f1", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", fontWeight: 800 };
