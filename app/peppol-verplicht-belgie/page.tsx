import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "Peppol verplicht in België — Wat moet je weten in 2026?",
 description: "Sinds 1 januari 2026 is e-facturatie via Peppol verplicht voor alle Belgische btw-plichtige bedrijven. Lees wat je moet doen.",
 alternates: { canonical: "https://peppolpro.nl/peppol-verplicht-belgie" },
 openGraph: {
 title: "Peppol verplicht in België 2026",
 description: "Alles over de Belgische e-facturatieplicht en hoe je snel Peppol-ready bent.",
 url: "https://peppolpro.nl/peppol-verplicht-belgie",
 },
};

export default function PeppolVerplichtBelgiePage() {
 return (
 <main style={pageStyle}>
 <BackLink />
 <article>
 <p style={eyebrowStyle}>Bijgewerkt: juni 2026</p>
 <h1 style={h1Style}>Peppol verplicht in België: alles wat je moet weten in 2026</h1>
 <Notice>
 Belgische btw-plichtige ondernemingen moeten vanaf 2026 gestructureerd elektronisch factureren voor B2B. Een gewone PDF per e-mail is daarvoor niet genoeg.
 </Notice>

 <Section title="Wat is de verplichting precies?">
 Sinds 1 januari 2026 moeten Belgische btw-plichtige ondernemingen onderling elektronisch factureren via een gestructureerd formaat. Peppol BIS 3.0 is de praktische standaard om facturen veilig te verzenden en ontvangen.
 </Section>

 <Section title="Geldt dit ook voor Nederlandse bedrijven?">
 Nederlandse bedrijven hebben geen algemene B2B Peppol-verplichting. Maar Belgische klanten vragen steeds vaker om Peppol-facturen omdat zij hun administratie verplicht digitaal moeten verwerken. Lever je nog alleen PDF, dan kan dat vertraging geven.
 </Section>

 <Section title="Hoe word je snel compliant?">
 <ol style={listStyle}>
 <li>Maak een account aan bij een Peppol-oplossing.</li>
 <li>Leg btw-nummer, KvK/KBO en bedrijfsgegevens vast.</li>
 <li>Genereer facturen als UBL 2.1 / Peppol BIS 3.0 XML.</li>
 <li>Gebruik een Peppol Inbox voor inkomende facturen.</li>
 </ol>
 </Section>

 <Section title="Wat kost het?">
 PeppolPro start gratis voor UBL-generatie. Verzenden en ontvangen via Peppol kan vanaf Compleet, inclusief archief en inbox. Zo heb je geen zwaar boekhoudpakket nodig om Peppol-ready te zijn.
 </Section>

 <Cta />
 </article>
 </main>
 );
}

function BackLink() {
 return <nav style={{ marginBottom: "2rem" }}><Link href="/" style={linkStyle}>Terug naar PeppolPro</Link></nav>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <section>
 <h2 style={h2Style}>{title}</h2>
 <div style={paragraphStyle}>{children}</div>
 </section>
 );
}

function Notice({ children }: { children: React.ReactNode }) {
 return <div style={noticeStyle}><strong>Let op:</strong> <span>{children}</span></div>;
}

function Cta() {
 return (
 <div style={ctaStyle}>
 <h2 style={{ ...h2Style, marginTop: 0 }}>Maak je eerste Peppol-factuur</h2>
 <p style={{ ...paragraphStyle, marginBottom: 18 }}>Genereer gratis een Peppol BIS 3.0 XML-factuur en schaal op wanneer je wilt verzenden of ontvangen.</p>
 <Link href="/nieuw" style={buttonStyle}>Start gratis</Link>
 </div>
 );
}

const pageStyle = { maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "sans-serif", color: "#e2e8f0", background: "#0a0a0f", minHeight: "100vh" };
const eyebrowStyle = { color: "#10b981", fontWeight: 700, marginBottom: "1rem" };
const h1Style = { fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "1.5rem", letterSpacing: 0 };
const h2Style = { fontSize: "1.35rem", fontWeight: 800, margin: "2rem 0 0.75rem", letterSpacing: 0 };
const paragraphStyle = { lineHeight: 1.8, color: "#cbd5e1", fontSize: 16 };
const listStyle = { lineHeight: 2, color: "#cbd5e1", paddingLeft: "1.5rem", margin: 0 };
const linkStyle = { color: "#818cf8", textDecoration: "none", fontSize: 14, fontWeight: 700 };
const noticeStyle = { background: "#1a1a2e", border: "1px solid #ef4444", borderRadius: 8, padding: "1.25rem", marginBottom: "2rem", color: "#fca5a5", lineHeight: 1.7 };
const ctaStyle = { background: "#111827", border: "1px solid #334155", borderRadius: 8, padding: "1.5rem", marginTop: "2.5rem" };
const buttonStyle = { display: "inline-block", background: "#6366f1", color: "#fff", padding: "12px 22px", borderRadius: 8, textDecoration: "none", fontWeight: 800 };
