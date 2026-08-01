import Link from "next/link";

export default function VoorwaardenPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 12 };

 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Algemene Voorwaarden</h1>
 <p style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>Laatst bijgewerkt: april 2026</p>

 <h2 style={h2}>1. Definities</h2>
 <p style={p}>PeppolPro: het online platform voor PDF-factuur naar UBL/Peppol conversie, aangeboden door SynqLayer. Gebruiker: iedere natuurlijke of rechtspersoon die gebruik maakt van PeppolPro. Dienst: de conversie van PDF-facturen naar UBL 2.1 XML-formaat.</p>

 <h2 style={h2}>2. Toepasselijkheid</h2>
 <p style={p}>Deze voorwaarden zijn van toepassing op elk gebruik van PeppolPro. Door gebruik te maken van de dienst ga je akkoord met deze voorwaarden.</p>

 <h2 style={h2}>3. Dienstverlening</h2>
 <p style={p}>PeppolPro biedt AI-gestuurde conversie van PDF-facturen naar UBL 2.1 XML. Wij garanderen geen 100% nauwkeurigheid van de AI-verwerking. De gebruiker is verantwoordelijk voor het controleren van de gegenereerde output voordat deze wordt verzonden.</p>

 <h2 style={h2}>4. Account en credits</h2>
 <p style={p}>Gratis accounts ontvangen 3 credits per maand. Betaalde credits vervallen niet. Abonnementen worden maandelijks gefactureerd en zijn maandelijks opzegbaar.</p>

 <h2 style={h2}>5. Prijzen en betaling</h2>
 <p style={p}>Prijzen zijn in euro en exclusief BTW tenzij anders vermeld. Betaling via iDEAL, creditcard of Bancontact. Bij niet-betaling kan de toegang worden opgeschort.</p>

 <h2 style={h2}>6. Aansprakelijkheid</h2>
 <p style={p}>PeppolPro is niet aansprakelijk voor schade door onjuiste conversies, technische storingen, of verlies van data. De maximale aansprakelijkheid is beperkt tot het bedrag dat de gebruiker in de afgelopen 12 maanden heeft betaald.</p>

 <h2 style={h2}>7. Intellectueel eigendom</h2>
 <p style={p}>De gebruiker behoudt alle rechten op geüploade facturen. PeppolPro claimt geen eigendom over input of output van de conversie.</p>

 <h2 style={h2}>8. Beëindiging</h2>
 <p style={p}>Beide partijen kunnen het gebruik op elk moment beëindigen. Bij beëindiging worden accountgegevens binnen 30 dagen verwijderd op verzoek.</p>

 <h2 style={h2}>9. Toepasselijk recht</h2>
 <p style={p}>Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.</p>

 <h2 style={h2}>10. Contact</h2>
 <p style={p}>SynqLayer — info@synqlayer.com</p>
 </div>
 </div>
 );
}
