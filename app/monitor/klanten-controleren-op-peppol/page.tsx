import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Klanten controleren op Peppol | Voor accountants en kantoren",
  description: "Controleer klantdossiers op Peppol-vindbaarheid en schaal periodieke monitoring op met de accountant-tier van PeppolPro.",
  path: "/monitor/klanten-controleren-op-peppol",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Accountants" title="Klanten controleren op Peppol" intro="Voor accountants gaat Peppol-monitoring niet om één losse lookup, maar om overzicht houden over meerdere klantdossiers zonder handmatig herhalen.">
      <h2>Waarom dit anders is dan een losse check</h2>
      <p>Een ondernemer wil weten of één klant vindbaar is. Een accountant wil zien welke dossiers aandacht nodig hebben, welke klanten al gepubliceerd zijn en waar communicatie richting de klant verstandig is.</p>
      <h2>Gebruik dit als signalering, niet als juridisch advies</h2>
      <p>Peppol-vindbaarheid is technische informatie. Het zegt niet automatisch of een klant wettelijk verplicht is om e-facturen te sturen of ontvangen. Gebruik de uitkomst als gesprekstarter en dossiernotitie.</p>
      <h2>Welke klanten eerst?</h2>
      <p>Begin met klanten die leveren aan overheden, grotere B2B-afnemers of internationaal werken. Daarna kun je bredere klantgroepen toevoegen als monitoring in het kantoorproces past.</p>
      <h2>Waarom de accountant-tier?</h2>
      <p>De gratis check is geschikt voor losse vragen. De accountant-tier is bedoeld voor structureel controleren van meerdere klanten en past beter bij kantoren die dit periodiek willen aanbieden.</p>
      <CheckCta audience="accountant" text="Doe een gratis proefcheck en bekijk daarna de €39 accountant-tier voor meerdere klantcontroles." />
    </InfoPage>
  );
}
