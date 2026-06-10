import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "PDF naar UBL converter — Gratis Peppol XML maken",
 description: "Zet een PDF-factuur om naar UBL 2.1 / Peppol BIS 3.0 XML. Gratis proberen zonder boekhoudpakket.",
 alternates: { canonical: "https://peppolpro.nl/pdf-naar-ubl" },
 openGraph: {
 title: "PDF naar UBL converter",
 description: "Maak van je factuurdata een Peppol-ready UBL XML-bestand.",
 url: "https://peppolpro.nl/pdf-naar-ubl",
 },
};

export default function PdfNaarUblPage() {
 return (
 <main style={pageStyle}>
 <nav style={{ marginBottom: "2rem" }}><Link href="/" style={linkStyle}>Terug naar PeppolPro</Link></nav>
 <article>
 <p style={eyebrowStyle}>PDF naar UBL</p>
 <h1 style={h1Style}>Van factuur naar UBL XML zonder boekhoudpakket</h1>
 <p style={leadStyle}>
 PeppolPro helpt je factuurgegevens omzetten naar UBL 2.1 XML die geschikt is voor Peppol BIS 3.0 workflows. Ideaal als je snel digitaal wilt factureren zonder nieuw boekhoudsysteem.
 </p>

 <section style={gridStyle}>
 <InfoCard title="UBL 2.1 output" text="Genereer gestructureerde XML met leverancier, klant, factuurregels, btw-totalen en betaalgegevens." />
 <InfoCard title="Peppol BIS 3.0 basis" text="De generator gebruikt Peppol-profielen, endpoint-ID's en btw-subtotalen zodat je bestand Peppol-ready is." />
 <InfoCard title="Gratis starten" text="Maak en download UBL-facturen gratis. Verzenden en ontvangen kan via de betaalde pakketten." />
 </section>

 <h2 style={h2Style}>Wanneer gebruik je PDF naar UBL?</h2>
 <p style={paragraphStyle}>
 Gebruik deze flow wanneer je facturen nu nog als PDF maakt, maar klanten om e-facturatie vragen. Je hoeft niet meteen je hele administratie te vervangen: je maakt eerst een correcte UBL-factuur en kunt daarna verzenden via Peppol.
 </p>

 <h2 style={h2Style}>Wat heb je nodig?</h2>
 <ul style={listStyle}>
 <li>Je bedrijfsnaam, adres, KvK/KBO, btw-nummer en IBAN.</li>
 <li>Klantgegevens, inclusief btw-nummer en eventueel Peppol-ID.</li>
 <li>Factuurregels met aantallen, prijzen en btw-tarieven.</li>
 </ul>

 <div style={ctaStyle}>
 <h2 style={{ ...h2Style, marginTop: 0 }}>Maak gratis een UBL-factuur</h2>
 <p style={{ ...paragraphStyle, marginBottom: 18 }}>Start met het formulier en download direct je PeppolPro XML-bestand.</p>
 <Link href="/nieuw" style={buttonStyle}>Open factuurformulier</Link>
 </div>
 </article>
 </main>
 );
}

function InfoCard({ title, text }: { title: string; text: string }) {
 return (
 <div style={cardStyle}>
 <h2 style={{ fontSize: 18, margin: "0 0 8px", letterSpacing: 0 }}>{title}</h2>
 <p style={{ color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>{text}</p>
 </div>
 );
}

const pageStyle = { maxWidth: 980, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" };
const eyebrowStyle = { color: "#38bdf8", fontWeight: 800, marginBottom: "1rem" };
const h1Style = { fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "1rem", letterSpacing: 0 };
const h2Style = { fontSize: "1.35rem", fontWeight: 800, margin: "2rem 0 0.75rem", letterSpacing: 0 };
const leadStyle = { lineHeight: 1.8, color: "#cbd5e1", fontSize: 18, maxWidth: 760 };
const paragraphStyle = { lineHeight: 1.8, color: "#cbd5e1", fontSize: 16 };
const listStyle = { lineHeight: 2, color: "#cbd5e1", paddingLeft: "1.5rem", margin: 0 };
const linkStyle = { color: "#818cf8", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, margin: "2rem 0" };
const cardStyle = { background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "1.25rem" };
const ctaStyle = { background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "1.5rem", marginTop: "2.5rem" };
const buttonStyle = { display: "inline-block", background: "#6366f1", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", fontWeight: 800 };
