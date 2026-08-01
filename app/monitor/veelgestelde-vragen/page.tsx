import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Veelgestelde vragen over Peppol en e-facturatie",
  description: "Antwoorden op veelgestelde vragen over Peppol, Peppol-ID's, e-facturatie, Nederlandse verplichtingen en ViDA 2030.",
  path: "/monitor/veelgestelde-vragen",
});

const faqs = [
  ["Ben ik verplicht om te e-factureren?", "Dat hangt af van je klant, sector en actuele regelgeving. Voor Nederland is een breder mandaat in consultatie / nog niet definitief. Leveringen aan overheden kunnen nu al praktische of contractuele eisen hebben."],
  ["Is ViDA 2030 een Nederlandse deadline?", "Nee. ViDA 2030 is een EU-ontwikkeling voor onder meer grensoverschrijdende B2B e-facturatie en rapportage. Nationale invoering en details moeten per land worden uitgewerkt."],
  ["Wat is een Peppol-ID?", "Een Peppol-ID is een deelnemer-identificatie waarmee een organisatie op het Peppol-netwerk kan worden gevonden, bijvoorbeeld op basis van een registratienummer of ander schema."],
  ["Kan ik met een KvK-nummer zoeken?", "Ja, Peppol-Check probeert een 8-cijferig KvK-nummer als Nederlandse identifier en gebruikt daarna veilige fallback-zoekopdrachten."],
  ["Waarom vind ik een bedrijf niet?", "Mogelijk staat het bedrijf niet gepubliceerd in de Directory, gebruikt het een andere identificatie of is de naam anders geregistreerd."],
  ["Is dit juridisch bewijs?", "Nee. De uitkomst is een technische indicatie op basis van de officiële Directory, geen juridisch advies en geen contractuele bevestiging."],
  ["Slaan jullie zoekopdrachten op?", "Nee. In deze MVP worden zoekopdrachten niet opgeslagen. Alleen tijdelijke rate-limit telling per IP blijft in memory om misbruik te beperken."],
  ["Welke documenttypen worden getoond?", "We tonen documenttypen zoals die door de Directory terugkomen, bijvoorbeeld UBL Invoice of CreditNote varianten als ze bij een match staan."],
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function Page() {
  return (
    <InfoPage eyebrow="FAQ" title="Veelgestelde vragen" intro="Korte antwoorden voor ondernemers die willen weten wat Peppol betekent voor e-facturatie en mogelijke verplichtingen.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="space-y-6">
        {faqs.map(([question, answer]) => (
          <section key={question}>
            <h2>{question}</h2>
            <p>{answer}</p>
          </section>
        ))}
      </div>
      <CheckCta />
    </InfoPage>
  );
}
