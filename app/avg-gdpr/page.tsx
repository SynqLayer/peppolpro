import Link from "next/link";

export default function GDPRPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 12 };

 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>AVG/GDPR Compliance</h1>
 <p style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>Laatst bijgewerkt: april 2026</p>

 <h2 style={h2}>Data Protection by Design</h2>
 <p style={p}>PeppolPro is ontworpen met privacy als uitgangspunt. Wij verwerken zo min mogelijk persoonsgegevens, alleen wat strikt noodzakelijk is voor de dienst.</p>

 <h2 style={h2}>Rechten van betrokkenen</h2>
 <p style={p}>Als gebruiker heb je het recht op:</p>
 <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Inzage in je gegevens</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Correctie of aanvulling</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Verwijdering (&quot;recht op vergetelheid&quot;)</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Beperking van verwerking</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Dataportabiliteit</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Bezwaar tegen verwerking</li>
 </ul>

 <h2 style={h2}>Data Processing Agreement (DPA)</h2>
 <p style={p}>Voor zakelijke klanten bieden wij een Data Processing Agreement aan die voldoet aan AVG/GDPR vereisten. Neem contact op via legal@synqlayer.com.</p>

 <h2 style={h2}>Subprocessors</h2>
 <p style={p}>Wij werken met de volgende subprocessors die voldoen aan AVG/GDPR:</p>
 <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Google (Gemini AI, voor factuurverwerking) — verwerking onder Google&apos;s standaard AVG-voorwaarden en modelcontracten</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Supabase — Database hosting in EU</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Vercel — Website hosting met EU edge</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Mollie — Betalingsverwerking in EU</li>
 <li style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 6 }}>Brevo — Transactionele e-mail, verwerkt naam en e-mailadres</li>
 </ul>

 <h2 style={h2}>Data Breach Protocol</h2>
 <p style={p}>Bij een datalek volgen wij een strikt protocol: binnen 72 uur melding aan de Autoriteit Persoonsgegevens en betrokkenen indien nodig.</p>

 <h2 style={h2}>Contact Functionaris Gegevensbescherming</h2>
 <p style={p}>Voor vragen over gegevensbescherming: privacy@synqlayer.com</p>

 <h2 style={h2}>Certificeringen</h2>
 <p style={p}>Wij streven naar ISO 27001 certificering in Q3 2026.</p>
 </div>
 </div>
 );
}
