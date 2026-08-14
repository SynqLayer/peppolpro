import Link from "next/link";

export default function PrivacyPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 12 };

 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacyverklaring</h1>
 <p style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>Laatst bijgewerkt: augustus 2026</p>

 <h2 style={h2}>1. Wie zijn wij</h2>
 <p style={p}>PeppolPro is een product van SynqLayer, gevestigd in Nederland. KvK-nummer: 42041391. BTW-nummer: NL005450830B62. Wij zijn verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in deze privacyverklaring.</p>

 <h2 style={h2}>2. Welke gegevens verwerken wij</h2>
 <p style={p}>Bij registratie: e-mailadres, bedrijfsnaam, KvK/KBO-nummer, BTW-nummer. Bij gebruik: geüploade PDF-facturen (tijdelijk), gegenereerde UBL XML-bestanden, Peppol-monitoringgegevens, team-uitnodigingen, webhook-configuratie, IP-adres en browsergegevens voor beveiliging.</p>

 <h2 style={h2}>3. Doel van verwerking</h2>
 <p style={p}>Wij verwerken gegevens voor: het leveren van onze dienst (PDF naar UBL conversie), accountbeheer, facturatie, monitoring van Peppol-registraties, teamtoegang, webhook-doorgifte op eigen verzoek van de gebruiker, en wettelijke verplichtingen. Factuurdata wordt opgeslagen in je account voor conversie, factuurhistorie en dashboardweergave, totdat je deze verwijdert of verwijdering aanvraagt.</p>

 <h2 style={h2}>4. Bewaartermijnen</h2>
 <p style={p}>Accountgegevens: zolang je account actief is. Geüploade PDF-facturen: maximaal 14 dagen na conversie, daarna automatisch verwijderd. Monitoring-events voor Peppol-bewaking: maximaal 12 maanden. Team-uitnodigingen: maximaal 30 dagen als pending uitnodiging; daarna wordt het e-mailadres uit de uitnodigingsrij verwijderd en blijft alleen beperkte auditmetadata over. Betalingsgegevens: 7 jaar (wettelijke bewaarplicht). Loggegevens: maximaal 90 dagen.</p>

 <h2 style={h2}>5. Delen met derden</h2>
 <p style={p}>Wij delen gegevens met: Google (Gemini AI, voor factuurverwerking), Supabase (database hosting, EU), Vercel (website hosting), Mollie (betalingsverwerking) en Brevo (transactionele e-mail, verwerkt naam en e-mailadres). Conversions en invoices, waaronder UBL, bedragen, klantgegevens en het e-mailadres van de ontvanger, bewaren wij zolang je account actief is, tenzij je een factuur zelf verwijdert. Als je zelf een webhook-URL instelt, sturen wij monitoring-events op jouw verzoek door naar dat door jou gekozen eindpunt. Wij verkopen nooit persoonsgegevens aan derden.</p>

 <h2 style={h2}>6. Beveiliging</h2>
 <p style={p}>Wij gebruiken encryptie (TLS/SSL), row-level security in onze database, en verwerken zo min mogelijk persoonsgegevens (dataminimalisatie).</p>

 <h2 style={h2}>7. Jouw rechten</h2>
 <p style={p}>Je hebt recht op inzage, correctie, verwijdering, beperking en overdraagbaarheid van je gegevens. Neem contact op via privacy@synqlayer.com. Wij reageren binnen 30 dagen.</p>

 <h2 style={h2}>8. Cookies</h2>
 <p style={p}>Wij gebruiken alleen functionele cookies voor authenticatie. Geen tracking cookies, geen advertentie cookies.</p>

 <h2 style={h2}>9. Contact</h2>
 <p style={p}>Voor vragen over privacy: privacy@synqlayer.com</p>
 </div>
 </div>
 );
}
