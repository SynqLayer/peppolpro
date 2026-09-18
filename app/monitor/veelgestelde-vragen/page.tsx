import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Veelgestelde vragen over Peppol en e-facturatie",
  description: "Antwoorden op veelgestelde vragen over Peppol, Peppol-ID's, e-facturatie, Nederlandse plannen voor 2030 en ViDA.",
  path: "/monitor/veelgestelde-vragen",
});

const faqs = [
  ["Ben ik in Nederland nu verplicht om B2B te e-factureren?", "In 2026 geldt nog geen brede algemene verplichting voor alle Nederlandse B2B-facturen. Het kabinet heeft op 11 september 2026 gekozen voor verplichte e-facturatie per 1 juli 2030 voor nationale en internationale B2B-transacties. De nationale wetgeving en uitvoeringsdetails worden nog uitgewerkt."],
  ["Wat verandert door ViDA in 2030?", "ViDA introduceert vanaf 1 juli 2030 digitale rapportage op basis van e-facturatie voor grensoverschrijdende B2B-transacties binnen de EU. Dat betekent niet automatisch dat iedere transactie via Peppol moet verlopen."],
  ["Geldt de Belgische 2026-plicht als ik vanuit Nederland aan België factureer?", "Niet automatisch. De Belgische verplichting sinds 1 januari 2026 ziet in beginsel op binnenlandse B2B-facturatie tussen Belgische btw-plichtige ondernemingen. Internationale facturatie valt buiten die specifieke binnenlandse verplichting."],
  ["Wat is een Peppol-ID?", "Een Peppol-ID is een deelnemer-identificatie waarmee een organisatie op het Peppol-netwerk kan worden geïdentificeerd, bijvoorbeeld op basis van een registratienummer of ander toegestaan schema."],
  ["Kan ik met een KvK-nummer zoeken?", "Ja, Peppol-Check probeert een 8-cijferig KvK-nummer als Nederlandse identifier en gebruikt daarna veilige fallback-zoekopdrachten."],
  ["Waarom vind ik een bedrijf niet?", "Mogelijk is de deelnemer niet in de Directory gepubliceerd, gebruikt de organisatie een andere identificatie of is de naam anders geregistreerd. OpenPeppol vermeldt dat publicatie in de Directory niet voor iedere geregistreerde ontvanger verplicht is."],
  ["Is dit juridisch bewijs?", "Nee. De uitkomst is een technische indicatie op basis van de officiële Directory, geen juridisch advies en geen contractuele bevestiging van verzend- of ontvangstcapaciteit."],
  ["Slaan jullie zoekopdrachten op?", "De Peppol-Check is ontworpen om zoekopdrachten niet als monitoringtarget of zoekhistorie op te slaan. Technische beveiligings- en rate-limitgegevens kunnen wel tijdelijk worden verwerkt zoals beschreven in de privacyverklaring."],
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
