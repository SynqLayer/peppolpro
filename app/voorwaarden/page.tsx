import Link from "next/link";

export default function VoorwaardenPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 12 };
 const li = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 6 };

 return (
 <div style={{ background: "#020617", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "#f8fafc" }}>
 <div style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 60px" }}>
 <Link href="/" style={{ fontSize: 13, color: "#93c5fd", textDecoration: "none", marginBottom: 20, display: "block" }}>← Terug naar home</Link>
 <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Algemene voorwaarden PeppolPro</h1>
 <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 32 }}>Versie 2026.09 — laatst bijgewerkt: 17 september 2026</p>

 <h2 style={h2}>1. Aanbieder en toepasselijkheid</h2>
 <p style={p}>PeppolPro wordt aangeboden door SynqLayer, een eenmanszaak van Artur Bagdasarjan, De Akker 39, 2743 DR Waddinxveen, Nederland, KvK 42041391, btw-id NL005450830B62, info@synqlayer.com.</p>
 <p style={p}>PeppolPro is bedoeld voor zakelijk gebruik door ondernemers en organisaties. Wie een account maakt of een betaald product bestelt, verklaart 18 jaar of ouder te zijn en bevoegd te zijn voor de betreffende onderneming of organisatie te handelen. Als dwingend consumentenrecht toch van toepassing is, gaat dat recht vóór op strijdige bepalingen in deze voorwaarden.</p>

 <h2 style={h2}>2. Wat PeppolPro levert</h2>
 <p style={p}>PeppolPro biedt onder meer AI-ondersteunde factuuruitlezing, UBL/XML-generatie, factuurhistorie, Peppol Directory-monitoring en — na bedrijfsverificatie en met voldoende verzendtegoed — verzending via een aangesloten Peppol-serviceprovider. Beschikbaarheid en functionaliteit kunnen per productonderdeel verschillen.</p>
 <p style={p}>PeppolPro is zelf geen Peppol-netwerk of zelfstandig Peppol Access Point. Voor netwerkregistratie en verzending wordt een externe Peppol-serviceprovider gebruikt.</p>

 <h2 style={h2}>3. Controle door de gebruiker</h2>
 <p style={p}>AI, PDF-uitlezing, validatie en conversie kunnen fouten of ontbrekende gegevens bevatten. De gebruiker controleert vóór downloaden, boeken of verzenden ten minste partijen, factuurnummers, data, btw-behandeling, bedragen, bankgegevens en ontvangergegevens. We geven geen garantie dat elke PDF zonder correctie kan worden verwerkt of dat iedere gegenereerde factuur door iedere ontvanger wordt geaccepteerd.</p>

 <h2 style={h2}>4. Account en beveiliging</h2>
 <p style={p}>Je houdt inloggegevens vertrouwelijk en meldt vermoed misbruik zo snel mogelijk. SynqLayer mag toegang tijdelijk beperken als dit redelijkerwijs nodig is voor beveiliging, misbruikpreventie, onderhoud of naleving van wet- en regelgeving. We proberen onnodige onderbreking te voorkomen.</p>

 <h2 style={h2}>5. Gratis gebruik en verzendtegoed</h2>
 <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
  <li style={li}>Een nieuw gratis account ontvangt het op de website vermelde eenmalige UBL-starttegoed; dit wordt niet maandelijks aangevuld.</li>
  <li style={li}>Verzendbundels zijn eenmalige aankopen en geen abonnement.</li>
  <li style={li}>Gekocht verzendtegoed is 12 maanden geldig vanaf aankoop, tenzij bij de aankoop uitdrukkelijk anders staat.</li>
  <li style={li}>Als een verzending aantoonbaar vóór verzending faalt door een door PeppolPro herkende technische/providerfout, kan de gebruikte verzendcredit volgens de productlogica automatisch worden teruggeboekt.</li>
 </ul>

 <h2 style={h2}>6. Monitoring-abonnementen</h2>
 <p style={p}>Monitoring-producten zijn maandabonnementen tegen de op het moment van aankoop getoonde prijs en functionaliteit. Het abonnement loopt door totdat het wordt opgezegd. Opzeggen kan online vanuit de accountomgeving. Na opzegging stopt de volgende verlenging en blijft toegang in beginsel beschikbaar tot het einde van de reeds betaalde periode, tenzij anders vermeld.</p>
 <p style={p}>Een Peppol Directory-resultaat is een technische indicatie. OpenPeppol vermeldt dat publicatie in de Directory niet voor elke geregistreerde ontvanger verplicht is; een niet-gevonden resultaat bewijst daarom niet dat een organisatie niet op Peppol kan ontvangen.</p>

 <h2 style={h2}>7. Prijzen, btw en betaling</h2>
 <p style={p}>De prijzen die op de PeppolPro-prijzenpagina en in de checkout als consumenten-/eindprijs worden getoond zijn inclusief btw, tenzij bij het aanbod uitdrukkelijk anders staat. De checkout toont het bedrag dat voor die aankoop wordt geïncasseerd. Betaling verloopt via Mollie met de daar aangeboden betaalmethoden.</p>
 <p style={p}>De juiste fiscale behandeling kan afhangen van onder meer vestigingsland, btw-status en type transactie. De gebruiker is verantwoordelijk voor correcte bedrijfs- en btw-gegevens. SynqLayer past de voor de eigen verkoop geldende facturatieregels toe.</p>

 <h2 style={h2}>8. Annuleren, opzeggen en terugbetalingen</h2>
 <p style={p}>De praktische regels voor opzeggingen, dubbele/onjuiste betalingen en terugbetalingsverzoeken staan op <Link href="/annuleren-terugbetaling" style={{ color: "#93c5fd" }}>Opzeggen en terugbetalingen</Link>. Een terugbetaling is niet automatisch verschuldigd omdat ongebruikt verzendtegoed resteert. Wettelijke rechten en correctie van aantoonbare dubbele of foutieve afschrijvingen blijven onverlet.</p>

 <h2 style={h2}>9. Peppol, regelgeving en externe diensten</h2>
 <p style={p}>Peppol- en e-facturatieregels verschillen per land en transactietype en kunnen veranderen. Informatie op PeppolPro is algemene productinformatie en geen fiscaal of juridisch advies. Externe diensten zoals Peppol Directory, Recommand, Mollie, Supabase, Google, Vercel, Brevo, VIES en PDOK kunnen eigen voorwaarden, beschikbaarheid en technische beperkingen hebben.</p>

 <h2 style={h2}>10. Privacy en verwerkersafspraken</h2>
 <p style={p}>Persoonsgegevens worden verwerkt zoals beschreven in de <Link href="/privacy" style={{ color: "#93c5fd" }}>privacyverklaring</Link>. Voor zakelijke klanten die PeppolPro gebruiken om persoonsgegevens voor eigen doeleinden te verwerken, kan afhankelijk van de rollen onder de AVG een verwerkersovereenkomst nodig zijn. Neem daarvoor contact op via legal@synqlayer.com.</p>

 <h2 style={h2}>11. Intellectuele eigendom</h2>
 <p style={p}>De gebruiker behoudt rechten op eigen aangeleverde facturen, bedrijfsgegevens en eigen inhoud. SynqLayer claimt geen eigendom op de inhoud van door de gebruiker aangeleverde facturen. Rechten op PeppolPro-software, vormgeving, documentatie en merk blijven bij SynqLayer of de betreffende rechthebbende.</p>

 <h2 style={h2}>12. Beschikbaarheid en wijzigingen</h2>
 <p style={p}>We streven naar een betrouwbare dienst, maar garanderen geen ononderbroken beschikbaarheid. We mogen functionaliteit wijzigen voor beveiliging, onderhoud, wettelijke wijzigingen of productontwikkeling. Bij een materiële verslechtering van een betaald doorlopend product informeren we gebruikers waar redelijkerwijs mogelijk vooraf.</p>

 <h2 style={h2}>13. Aansprakelijkheid</h2>
 <p style={p}>Voor zover wettelijk toegestaan is SynqLayer niet aansprakelijk voor indirecte schade zoals gevolgschade, gemiste winst of gemiste besparingen. Voor directe schade die aantoonbaar aan SynqLayer kan worden toegerekend, is de aansprakelijkheid beperkt tot het bedrag dat voor het betreffende betaalde product in de 12 maanden vóór de schadeveroorzakende gebeurtenis aan SynqLayer is betaald. Deze beperkingen gelden niet waar uitsluiting of beperking wettelijk niet is toegestaan, waaronder bij opzet of bewuste roekeloosheid van SynqLayer.</p>

 <h2 style={h2}>14. Beëindiging en gegevens</h2>
 <p style={p}>Na beëindiging kun je verwijdering van daarvoor in aanmerking komende persoonsgegevens aanvragen via <Link href="/privacy/verwijderen" style={{ color: "#93c5fd" }}>/privacy/verwijderen</Link>. Gegevens waarvoor een wettelijke bewaarplicht geldt, zoals delen van de financiële administratie, worden niet voortijdig verwijderd.</p>

 <h2 style={h2}>15. Toepasselijk recht en contact</h2>
 <p style={p}>Op de overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de volgens de wet bevoegde rechter. Neem bij een klacht of vraag eerst contact op via info@synqlayer.com zodat we die kunnen onderzoeken.</p>
 </div>
 </div>
 );
}
