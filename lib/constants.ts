export const C = {
 bg: "#020617",
 card: "rgba(15,23,42,0.6)",
 input: "rgba(15,23,42,0.8)",
 blue: "#3b82f6",
 cyan: "#06b6d4",
 indigo: "#6366f1",
 white: "#f8fafc",
 gray: "#94a3b8",
 dim: "#94a3b8",
 border: "rgba(59,130,246,0.18)",
 glow: "rgba(59,130,246,0.15)",
};

export const STEPS = [
 { n: "01", icon: "📄", t: "Upload je PDF", d: "Upload een gangbare PDF-factuur. Bij scans, bijzondere layouts of onduidelijke brondata kan handmatige correctie nodig zijn." },
 { n: "02", icon: "🧠", t: "AI doet een voorstel", d: "Gemini AI probeert relevante factuurvelden te herkennen. Controleer leverancier, klant, btw-nummers, bedragen en regels voordat je de output gebruikt." },
 { n: "03", icon: "📥", t: "Controleer, download of verzend", d: "Controleer de gegevens en download UBL/XML. Verzenden via Peppol kan na bedrijfsverificatie met vooraf gekocht verzendtegoed." },
];

export const FEATURES = [
 { icon: "🧠", t: "AI-ondersteunde parsing", d: "PeppolPro kan gegevens uit veel gangbare PDF-facturen voorstellen. De gebruiker blijft verantwoordelijk voor controle en correctie vóór gebruik of verzending." },
 { icon: "📋", t: "Peppol BIS 3.0 / UBL 2.1", d: "PeppolPro bouwt UBL/XML volgens de gebruikte Peppol BIS 3.0- en EN 16931-regels en valideert gegevens vóór verzending. Ontvangende systemen kunnen aanvullende eisen hanteren." },
 { icon: "📡", t: "Peppol-verzending", d: "Verzend via een aangesloten Peppol-serviceprovider na bedrijfsverificatie met een eenmalig gekochte verzendbundel. Geen maandelijks verzendabonnement nodig." },
 { icon: "✅", t: "BTW-checks binnenkort", d: "Automatische BTW-validatie staat op de roadmap. Controleer BTW-nummers voorlopig zelf vóór je de UBL gebruikt." },
 { icon: "🇳🇱", t: "NL + BE context", d: "De productuitleg houdt rekening met Nederlandse en Belgische e-facturatieregels. Controleer altijd welke verplichting voor jouw transactie geldt." },
 { icon: "🔐", t: "Privacybewuste verwerking", d: "Factuurdata wordt opgeslagen zodat je deze in je factuurhistorie kunt terugzien. Je kunt opgeslagen facturen en conversies verwijderen en privacyrechten uitoefenen." },
];

export const FAQ = [
 { q: "Wat is Peppol?", a: "Peppol is een internationaal interoperabiliteitsnetwerk voor het uitwisselen van gestructureerde documenten. In België geldt sinds 1 januari 2026 in beginsel verplichte gestructureerde e-facturatie voor binnenlandse B2B-transacties tussen Belgische btw-plichtige ondernemingen, met uitzonderingen." },
 { q: "Wat is UBL?", a: "UBL 2.1 is een XML-formaat dat wordt gebruikt voor gestructureerde e-facturen. Peppol BIS Billing 3.0 sluit aan op de Europese norm EN 16931. Een ontvanger of serviceprovider kan daarnaast technische of procesmatige eisen stellen." },
 { q: "Moet ik als NL-ondernemer al Peppol gebruiken?", a: "Niet automatisch omdat je aan een Belgische klant factureert: internationale facturatie valt niet onder de Belgische binnenlandse B2B-verplichting. Voor Nederland heeft het kabinet op 11 september 2026 gekozen voor verplichte e-facturatie per 1 juli 2030 voor nationale en internationale B2B-transacties; de nationale wetgeving wordt nog uitgewerkt en KOR-ondernemers zijn volgens het kabinetsplan uitgezonderd." },
 { q: "Welke PDF-facturen worden ondersteund?", a: "PeppolPro kan veel gangbare tekst-PDF's verwerken. Scans, bijzondere layouts, slechte beeldkwaliteit of onvolledige brongegevens kunnen aanvullende controle en handmatige correctie vereisen." },
 { q: "Wat gebeurt er met mijn data?", a: "We slaan factuurdata op in je account voor factuurhistorie en dienstverlening, inclusief UBL, klantgegevens en bedragen waar nodig. Bewaartermijnen en betrokken dienstverleners staan in de privacyverklaring. Opgeslagen facturen en conversies kun je verwijderen." },
 { q: "Kan ik PeppolPro koppelen aan mijn boekhoudpakket?", a: "API-toegang en boekhoudintegraties staan op de roadmap." },
];
