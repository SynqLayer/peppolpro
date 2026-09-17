import Link from "next/link";

export default function GDPRPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 12 };
 const li = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 6 };

 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#93c5fd", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>AVG/GDPR en gegevensbescherming</h1>
 <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 32 }}>Laatst bijgewerkt: 17 september 2026</p>

 <h2 style={h2}>Privacy by design</h2>
 <p style={p}>PeppolPro probeert gegevensverwerking te beperken tot wat nodig is voor de gekozen functionaliteit. Concrete doeleinden, grondslagen, bewaartermijnen en ontvangers staan in de <Link href="/privacy" style={{ color: "#93c5fd" }}>privacyverklaring</Link>.</p>

 <h2 style={h2}>Rechten van betrokkenen</h2>
 <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
 <li style={li}>inzage in persoonsgegevens;</li>
 <li style={li}>correctie of aanvulling;</li>
 <li style={li}>verwijdering wanneer daarvoor geen geldige reden tot bewaren meer bestaat;</li>
 <li style={li}>beperking van verwerking;</li>
 <li style={li}>dataportabiliteit waar van toepassing;</li>
 <li style={li}>bezwaar waar de AVG dat recht geeft.</li>
 </ul>
 <p style={p}>Een verwijderingsverzoek kan via <Link href="/privacy/verwijderen" style={{ color: "#93c5fd" }}>/privacy/verwijderen</Link>. We vragen niet standaard om een kopie van een identiteitsbewijs; als aanvullende verificatie echt nodig is, kiezen we een proportionele methode.</p>

 <h2 style={h2}>Verwerkersovereenkomst</h2>
 <p style={p}>Zakelijke klanten kunnen contact opnemen via legal@synqlayer.com om te bepalen of voor hun gebruik een verwerkersovereenkomst nodig is en welke AVG-rollen gelden.</p>

 <h2 style={h2}>Belangrijkste dienstverleners</h2>
 <p style={p}>Afhankelijk van de gebruikte functie werken we onder meer met:</p>
 <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
 <li style={li}>Google — Gemini voor AI-ondersteunde factuurverwerking;</li>
 <li style={li}>Supabase — database en authenticatie;</li>
 <li style={li}>Vercel — applicatiehosting;</li>
 <li style={li}>Mollie — betalingsverwerking;</li>
 <li style={li}>PDOK/BAG — adresvalidatie voor Nederlandse adressen;</li>
 <li style={li}>EU VIES — btw-nummercontrole;</li>
 <li style={li}>Brevo — transactionele e-mail;</li>
 <li style={li}>Recommand — Peppol-serviceprovider voor bedrijfsregistratie en verzending.</li>
 </ul>
 <p style={p}>We stellen niet categorisch dat elke leverancier uitsluitend in de EU verwerkt. Voor internationale doorgifte gebruiken we waar nodig een geldige overdrachtsgrondslag en contractuele of andere passende waarborgen.</p>

 <h2 style={h2}>Datalekken</h2>
 <p style={p}>We beoordelen beveiligingsincidenten volgens de AVG. Een meldingsplichtig datalek melden we waar vereist zonder onredelijke vertraging en, voor de toezichthouder, zo mogelijk binnen 72 uur nadat we ervan kennis hebben genomen. Betrokkenen worden geïnformeerd wanneer de AVG dat vanwege het risico vereist.</p>

 <h2 style={h2}>Privacycontact</h2>
 <p style={p}>PeppolPro claimt niet dat een formele Functionaris Gegevensbescherming is aangesteld. Voor privacyvragen en rechten: privacy@synqlayer.com.</p>

 <h2 style={h2}>Certificeringen en claims</h2>
 <p style={p}>We claimen geen ISO 27001- of andere beveiligingscertificering tenzij die daadwerkelijk is behaald, geldig is en publiek verifieerbaar kan worden onderbouwd. Product- en beveiligingsclaims worden daarom zo concreet mogelijk geformuleerd.</p>
 </div>
 </div>
 );
}
