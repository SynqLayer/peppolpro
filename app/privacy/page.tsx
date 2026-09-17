import Link from "next/link";

export default function PrivacyPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 12 };
 const li = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 6 };

 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#93c5fd", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacyverklaring</h1>
 <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 32 }}>Laatst bijgewerkt: 17 september 2026</p>

 <h2 style={h2}>1. Wie zijn wij?</h2>
 <p style={p}>PeppolPro is een product van SynqLayer, een eenmanszaak van Artur Bagdasarjan, De Akker 39, 2743 DR Waddinxveen, Nederland. KvK: 42041391. Btw-id: NL005450830B62. Voor de verwerkingen die wij zelf bepalen is SynqLayer verwerkingsverantwoordelijke.</p>

 <h2 style={h2}>2. Welke gegevens verwerken wij?</h2>
 <p style={p}>We verwerken alleen gegevens die nodig zijn om PeppolPro te leveren, te beveiligen, te factureren en aan wettelijke verplichtingen te voldoen. Afhankelijk van wat je gebruikt kan dit gaan om:</p>
 <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
  <li style={li}>accountgegevens zoals e-mailadres, naam en authenticatiegegevens via Supabase;</li>
  <li style={li}>bedrijfs- en factuurgegevens, waaronder KvK/KBO-nummer, btw-nummer, adres en contactgegevens;</li>
  <li style={li}>geüploade facturen, uitgelezen factuurdata, UBL/XML, ontvangergegevens en verzendstatussen;</li>
  <li style={li}>betaal-, abonnements- en factuurgegevens;</li>
  <li style={li}>monitoringtargets, statuswijzigingen, teamuitnodigingen en door jou ingestelde webhookconfiguratie;</li>
  <li style={li}>beperkte technische gegevens zoals IP-adres, sessie- en beveiligingsgegevens en serverlogs.</li>
 </ul>

 <h2 style={h2}>3. Waarom en op welke grondslag?</h2>
 <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
  <li style={li}><strong>Overeenkomst / precontractuele stappen:</strong> accountbeheer, conversies, UBL-generatie, Peppol-verzending, monitoring, support en betalingen.</li>
  <li style={li}><strong>Wettelijke verplichting:</strong> gegevens die we moeten bewaren voor administratie, belasting en facturatie.</li>
  <li style={li}><strong>Gerechtvaardigd belang:</strong> beveiliging, misbruikpreventie, foutanalyse en het betrouwbaar houden van de dienst, waarbij we de impact op gebruikers beperken.</li>
  <li style={li}><strong>Toestemming:</strong> alleen wanneer een verwerking daar daadwerkelijk op is gebaseerd. PeppolPro gebruikt momenteel geen advertentie- of marketingtracking waarvoor cookie-toestemming wordt gevraagd.</li>
 </ul>

 <h2 style={h2}>4. Bewaartermijnen</h2>
 <p style={p}>We bewaren gegevens niet langer dan nodig. De huidige uitgangspunten zijn: accountgegevens zolang het account actief is; geüploade PDF-bestanden maximaal 14 dagen na conversie; PeppolPro-verkoopfacturen en andere fiscaal relevante administratie 7 jaar; monitoring-events maximaal 12 maanden; pending teamuitnodigingen maximaal 30 dagen waarna het e-mailadres uit de uitnodigingsrij wordt verwijderd; beveiligings- en technische logs maximaal 90 dagen. Factuur- en transactiegegevens kunnen langer moeten blijven staan wanneer een wettelijke bewaarplicht, fraudeonderzoek of geschil dat vereist.</p>

 <h2 style={h2}>5. Dienstverleners en ontvangers</h2>
 <p style={p}>Voor onderdelen van de dienst gebruiken we onder meer Google (Gemini voor AI-ondersteunde factuurverwerking), Supabase (database en authenticatie), Vercel (applicatiehosting), Mollie (betalingen), Brevo (transactionele e-mail), PDOK/BAG (adresvalidatie), EU VIES (btw-nummercontrole) en Recommand (Peppol-serviceprovider voor bedrijfsregistratie en verzending). Deze partijen ontvangen alleen gegevens die nodig zijn voor hun taak of die jij expliciet laat verwerken.</p>
 <p style={p}>Bij het activeren van Peppol-verzending kan een vertegenwoordiger van je bedrijf via Recommand een externe identiteitscontrole doorlopen. PeppolPro ontvangt of bewaart zelf geen kopie van het identiteitsbewijs uit die externe controle.</p>

 <h2 style={h2}>6. Doorgifte buiten de EER</h2>
 <p style={p}>Sommige leveranciers kunnen gegevens buiten de Europese Economische Ruimte verwerken of toegankelijk maken. Als dat gebeurt, gebruiken we een geldige AVG-grondslag voor internationale doorgifte, bijvoorbeeld een adequaatheidsbesluit of passende contractuele waarborgen. De feitelijke verwerkingslocatie kan afhangen van de gekozen dienst, accountconfiguratie en leverancier.</p>

 <h2 style={h2}>7. Beveiliging</h2>
 <p style={p}>We gebruiken onder meer TLS, toegangscontrole, Supabase Row Level Security waar van toepassing, server-side autorisatie en dataminimalisatie. Geen enkel online systeem is volledig risicoloos; we claimen daarom geen absolute beveiligingsgarantie.</p>

 <h2 style={h2}>8. Jouw privacyrechten</h2>
 <p style={p}>Afhankelijk van de situatie heb je recht op inzage, correctie, verwijdering, beperking, overdraagbaarheid en bezwaar. Je kunt een verzoek sturen naar privacy@synqlayer.com of de <Link href="/privacy/verwijderen" style={{ color: "#93c5fd" }}>pagina voor een verwijderingsverzoek</Link> gebruiken. We reageren in beginsel binnen één maand. Soms moeten bepaalde gegevens blijven staan vanwege een wettelijke bewaarplicht of voor de instelling, uitoefening of onderbouwing van rechtsvorderingen.</p>
 <p style={p}>Ben je het niet eens met hoe we je persoonsgegevens behandelen, dan kun je ook een klacht indienen bij de Autoriteit Persoonsgegevens.</p>

 <h2 style={h2}>9. Kinderen</h2>
 <p style={p}>PeppolPro is een zakelijke dienst en is niet bedoeld voor kinderen. We vragen minderjarigen niet om een account te maken of factuurgegevens te uploaden. Registratie is bedoeld voor personen van 18 jaar of ouder die voor zichzelf als ondernemer of namens een organisatie mogen handelen. Denk je dat een minderjarige toch persoonsgegevens heeft verstrekt, neem dan contact op via privacy@synqlayer.com.</p>

 <h2 style={h2}>10. Geautomatiseerde verwerking en AI</h2>
 <p style={p}>AI kan factuurvelden voorstellen, maar PeppolPro gebruikt die AI-uitvoer niet om zelfstandig juridische of vergelijkbaar ingrijpende beslissingen over personen te nemen. De gebruiker moet factuurdata en UBL-output controleren voordat deze wordt gebruikt of verzonden.</p>

 <h2 style={h2}>11. Cookies en lokale opslag</h2>
 <p style={p}>PeppolPro gebruikt noodzakelijke authenticatie- en beveiligingscookies en een tijdelijke checkout-intentcookie om een gekozen product na inloggen te onthouden. We gebruiken momenteel geen advertentie- of marketingcookies. Lees de details in ons <Link href="/cookiebeleid" style={{ color: "#93c5fd" }}>cookiebeleid</Link>. Als we later niet-noodzakelijke tracking toevoegen, wordt die niet geplaatst voordat de daarvoor vereiste keuze is gemaakt.</p>

 <h2 style={h2}>12. Contact</h2>
 <p style={p}>Privacy: privacy@synqlayer.com<br />Algemeen: info@synqlayer.com<br />SynqLayer, De Akker 39, 2743 DR Waddinxveen, Nederland</p>
 </div>
 </div>
 );
}
