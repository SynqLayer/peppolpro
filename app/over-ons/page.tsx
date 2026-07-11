import { C } from "../../lib/constants";

export default function OverOnsPage() {
 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px 60px" }}>
 <a href="/" style={{ fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</a>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Over PeppolPro</h1>
 <p style={{ fontSize: 15, color: "#94a3b8", marginBottom: 32 }}>De simpelste manier om e-facturatie-compliant te worden.</p>

 <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>
 <p style={{ marginBottom: 16 }}>PeppolPro is gebouwd door SynqLayer, een Nederlands technologiebedrijf dat zich richt op AI-gestuurde financiële tools voor ondernemers en accountants.</p>

 <p style={{ marginBottom: 16 }}>Met de verplichting van Peppol e-facturatie in België (2026) en de komende EU-brede ViDA-regelgeving (2030), zagen we een probleem: duizenden kleine ondernemers hebben geen eenvoudige manier om hun PDF-facturen om te zetten naar het verplichte UBL-formaat.</p>

 <p style={{ marginBottom: 16 }}>Bestaande oplossingen zijn of te duur, of te complex, of vereisen een volledig boekhoudpakket. PeppolPro lost dit op in drie klikken: upload, controleer, download.</p>

 <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#f8fafc" }}>Onze technologie</h2>
 <p style={{ marginBottom: 16 }}>We gebruiken Google Gemini AI om facturen te lezen — ongeacht het formaat of de layout. De output voldoet aan de Europese EN 16931 standaard en is compatibel met elk Peppol access point.</p>

 <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#f8fafc" }}>SynqLayer</h2>
 <p style={{ marginBottom: 16 }}>SynqLayer ontwikkelt meerdere AI-tools voor de financiële sector, waaronder BSCPro (bankafschrift-conversie) en PeppolPro (factuur-conversie). We zijn gevestigd in Nederland en bouwen AVG/GDPR-compliant producten.</p>

 <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#f8fafc" }}>Contact</h2>
 <p>Email: info@synqlayer.com</p>
 <p>Website: synqlayer.com</p>
 <p>KvK: 42041391</p>
 <p>BTW: NL005450830B62</p>
 </div>
 </div>
 </div>
 );
}
