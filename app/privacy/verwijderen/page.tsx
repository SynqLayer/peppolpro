import Link from "next/link";

export const metadata = {
 title: "Gegevens verwijderen | PeppolPro",
 description: "Dien een verzoek in om persoonsgegevens uit PeppolPro te laten verwijderen voor zover geen bewaarplicht geldt.",
 robots: { index: false, follow: true },
};

const mailto = "mailto:privacy@synqlayer.com?subject=Verwijderingsverzoek%20PeppolPro&body=E-mailadres%20van%20mijn%20PeppolPro-account%3A%0A%0AEventuele%20toelichting%20of%20relevante%20factuur%2Ftransactiereferentie%3A%0A%0AIk%20verzoek%20SynqLayer%20om%20mijn%20persoonsgegevens%20te%20verwijderen%20voor%20zover%20geen%20wettelijke%20bewaarplicht%20of%20andere%20geldige%20grond%20voor%20bewaring%20geldt.";

export default function VerwijderenPage() {
 return (
  <main style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
   <section style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px 60px" }}>
    <Link href="/privacy" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 13 }}>← Privacyverklaring</Link>
    <h1 style={{ marginTop: 20, fontSize: 32, fontWeight: 800 }}>Verzoek om gegevens te verwijderen</h1>
    <p style={{ marginTop: 16, color: "#cbd5e1", lineHeight: 1.8 }}>Je kunt SynqLayer vragen persoonsgegevens uit PeppolPro te verwijderen voor zover we die niet meer nodig hebben en geen wettelijke bewaarplicht of andere geldige AVG-grond voor verdere bewaring geldt.</p>

    <div style={{ marginTop: 28, padding: 24, borderRadius: 14, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(15,23,42,0.75)" }}>
     <h2 style={{ fontSize: 20, fontWeight: 800 }}>Wat hebben we nodig?</h2>
     <ul style={{ marginTop: 12, paddingLeft: 20, color: "#cbd5e1", lineHeight: 1.9 }}>
      <li>het e-mailadres waarmee je PeppolPro gebruikt;</li>
      <li>optioneel een factuur-, aanvraag- of transactiereferentie als die helpt om het verzoek af te bakenen;</li>
      <li>alleen aanvullende verificatie als dat redelijkerwijs nodig is om misbruik te voorkomen.</li>
     </ul>
     <p style={{ marginTop: 12, color: "#fbbf24", lineHeight: 1.7 }}>Stuur niet uit jezelf een kopie van je identiteitsbewijs, wachtwoord, volledige betaalkaartgegevens of andere onnodige gevoelige gegevens.</p>
     <a href={mailto} style={{ marginTop: 20, display: "inline-flex", padding: "12px 18px", borderRadius: 10, background: "#2563eb", color: "white", fontWeight: 800, textDecoration: "none" }}>Verwijderingsverzoek opstellen</a>
    </div>

    <h2 style={{ marginTop: 32, fontSize: 20, fontWeight: 800 }}>Wat blijft mogelijk bewaard?</h2>
    <p style={{ marginTop: 10, color: "#cbd5e1", lineHeight: 1.8 }}>PeppolPro-verkoopfacturen, betaaladministratie en andere gegevens waarop een fiscale of andere wettelijke bewaarplicht rust kunnen niet voortijdig worden verwijderd. Ook kunnen beperkte gegevens tijdelijk noodzakelijk blijven voor fraudepreventie, beveiliging of een lopend geschil. We beperken zulke bewaring tot wat nodig is.</p>

    <h2 style={{ marginTop: 32, fontSize: 20, fontWeight: 800 }}>Reactietermijn</h2>
    <p style={{ marginTop: 10, color: "#cbd5e1", lineHeight: 1.8 }}>We reageren in beginsel binnen één maand op een AVG-verzoek. Als een verzoek complex is of veel verzoeken tegelijk binnenkomen, kan de AVG onder voorwaarden een verlenging toestaan; als dat nodig is informeren we je daarover.</p>
   </section>
  </main>
 );
}
