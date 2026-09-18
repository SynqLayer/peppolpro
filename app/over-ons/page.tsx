import Link from "next/link";

export default function OverOnsPage() {
 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 740, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#93c5fd", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Over PeppolPro</h1>
 <p style={{ fontSize: 15, color: "#cbd5e1", marginBottom: 32 }}>Een praktische tool voor UBL-generatie, Peppol-verzending en Peppol-monitoring.</p>

 <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.8 }}>
 <p style={{ marginBottom: 16 }}>PeppolPro is gebouwd door SynqLayer, een Nederlandse eenmanszaak die digitale tools ontwikkelt voor ondernemers en accountants.</p>

 <p style={{ marginBottom: 16 }}>België verplicht sinds 1 januari 2026 in beginsel gestructureerde e-facturatie voor binnenlandse B2B-transacties tussen Belgische btw-plichtige ondernemingen, met uitzonderingen. Voor internationale facturatie geldt die specifieke Belgische binnenlandse verplichting niet automatisch.</p>

 <p style={{ marginBottom: 16 }}>In Nederland heeft het kabinet op 11 september 2026 gekozen voor verplichte e-facturatie per 1 juli 2030 voor nationale en internationale B2B-transacties, met volgens het kabinetsplan een uitzondering voor KOR-ondernemers. De nationale wetgeving en uitvoeringsdetails worden nog verder uitgewerkt.</p>

 <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#f8fafc" }}>Onze technologie</h2>
 <p style={{ marginBottom: 16 }}>PeppolPro gebruikt Google Gemini om factuurgegevens uit veel gangbare PDF&apos;s voor te stellen. Scans, bijzondere layouts en onvolledige brondata kunnen handmatige correctie vereisen. De gebruiker controleert de gegevens voordat UBL/XML wordt gebruikt of via Peppol wordt verzonden.</p>
 <p style={{ marginBottom: 16 }}>De generator bouwt UBL/XML volgens de gebruikte Peppol BIS Billing 3.0- en EN 16931-regels. PeppolPro belooft niet dat elke mogelijke factuur of ontvanger zonder aanvullende eisen wordt geaccepteerd. Voor netwerkregistratie en verzending gebruiken we een externe Peppol-serviceprovider.</p>

 <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#f8fafc" }}>Privacy en beveiliging</h2>
 <p style={{ marginBottom: 16 }}>We werken met dataminimalisatie, toegangscontrole en technische beveiligingsmaatregelen en documenteren verwerkingen in onze <Link href="/privacy" style={{ color: "#93c5fd" }}>privacyverklaring</Link>. We gebruiken geen algemene certificerings- of beveiligingsclaim als die niet concreet en verifieerbaar kan worden onderbouwd.</p>

 <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#f8fafc" }}>Bedrijfsgegevens</h2>
 <p>PeppolPro is een product van SynqLayer</p>
 <p>Eenmanszaak van Artur Bagdasarjan</p>
 <p>De Akker 39, 2743 DR Waddinxveen, Nederland</p>
 <p>E-mail: info@synqlayer.com</p>
 <p>Privacy: privacy@synqlayer.com</p>
 <p>Website: synqlayer.com</p>
 <p>KvK: 42041391</p>
 <p>BTW: NL005450830B62</p>
 </div>
 </div>
 </div>
 );
}
