import Link from "next/link";

export const metadata = {
 title: "Opzeggen en terugbetalingen | PeppolPro",
 description: "Regels voor het opzeggen van PeppolPro Monitoring, verzendbundels, foutieve betalingen en terugbetalingsverzoeken.",
 alternates: { canonical: "/annuleren-terugbetaling" },
};

export default function RefundPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 12 };
 const li = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 7 };

 return (
  <main style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
   <article style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 60px" }}>
    <Link href="/" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 13 }}>← Terug naar home</Link>
    <h1 style={{ marginTop: 20, fontSize: 32, fontWeight: 800 }}>Opzeggen en terugbetalingen</h1>
    <p style={{ marginTop: 8, color: "#94a3b8", fontSize: 13 }}>Laatst bijgewerkt: 17 september 2026</p>

    <h2 style={h2}>Zakelijk product</h2>
    <p style={p}>PeppolPro is bedoeld voor ondernemers en organisaties. Deze pagina beschrijft ons normale beleid voor zakelijke accounts. Als in een uitzonderlijk geval dwingend consumentenrecht van toepassing is, gaat dat recht vóór op strijdige onderdelen van dit beleid.</p>

    <h2 style={h2}>Monitoring-abonnement opzeggen</h2>
    <p style={p}>Een Monitoring-abonnement kun je online vanuit je account opzeggen. Na een succesvolle opzegging wordt de volgende verlenging gestopt. Je reeds betaalde periode loopt in beginsel door tot de huidige periodedatum. Voor het opzeggen rekenen we geen aparte opzegkosten.</p>

    <h2 style={h2}>Verzendbundels</h2>
    <p style={p}>Verzendbundels zijn eenmalige aankopen, geen abonnementen. De credits zijn 12 maanden geldig vanaf aankoop. Ongebruikte credits worden niet automatisch terugbetaald alleen omdat je ze niet meer nodig hebt.</p>

    <h2 style={h2}>Mislukte Peppol-verzending</h2>
    <p style={p}>PeppolPro bevat logica om een gebruikte UBL/verzendcredit bij bepaalde herkende technische fouten vóór succesvolle verzending idempotent terug te boeken. Dit is een creditcorrectie binnen PeppolPro en niet automatisch een terugbetaling van de oorspronkelijke betaaltransactie.</p>

    <h2 style={h2}>Wanneer kun je een terugbetaling vragen?</h2>
    <ul style={{ paddingLeft: 20 }}>
     <li style={li}>een aantoonbare dubbele of verkeerde afschrijving;</li>
     <li style={li}>een betaling voor een product dat door een technische fout niet aan je account is toegekend en niet alsnog kan worden geleverd;</li>
     <li style={li}>een situatie waarin terugbetaling wettelijk verplicht is;</li>
     <li style={li}>een andere concrete fout die na onderzoek redelijkerwijs door SynqLayer moet worden hersteld.</li>
    </ul>
    <p style={p}>Stuur je verzoek naar info@synqlayer.com met het e-mailadres van je PeppolPro-account, de betaaldatum en indien beschikbaar het betalings- of factuurnummer. Stuur geen wachtwoorden, volledige betaalkaartgegevens of identiteitsdocumenten mee.</p>

    <h2 style={h2}>Terugbetaling en creditfactuur</h2>
    <p style={p}>Als een betaling via Mollie wordt terugbetaald, verwerken we de bijbehorende betaalstatus en financiële administratie. Waar nodig wordt een creditfactuur gekoppeld aan de oorspronkelijke PeppolPro-factuur. De feitelijke terugboektijd naar je betaalmiddel wordt mede bepaald door Mollie en de gebruikte betaalmethode.</p>

    <h2 style={h2}>Klachten</h2>
    <p style={p}>Denk je dat een aankoop, opzegging of factuur niet klopt? Mail info@synqlayer.com. Vermeld voldoende gegevens om de transactie te vinden, maar deel geen onnodige gevoelige gegevens. Zie ook de <Link href="/voorwaarden" style={{ color: "#93c5fd" }}>algemene voorwaarden</Link>.</p>
   </article>
  </main>
 );
}
