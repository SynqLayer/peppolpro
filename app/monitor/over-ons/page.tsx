import Link from "next/link";
import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata, site } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Over SynqLayer en PeppolPro Monitor",
  description: "Lees wie PeppolPro Monitor bouwt, vanuit welk bedrijf de dienst wordt aangeboden en hoe je contact opneemt met SynqLayer.",
  path: "/monitor/over-ons",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Over ons" title="Peppol-Check is een SynqLayer-tool" intro="SynqLayer bouwt praktische software en automatisering voor ondernemers. Peppol-Check is gestart als gratis hulpmiddel rond e-facturatie.">
      <h2>Bedrijfsgegevens</h2>
      <ul>
        <li>Naam: {site.company}</li>
        <li>KvK: {site.kvk}</li>
        <li>Plaats: {site.city}</li>
        <li>E-mail: <a href={`mailto:${site.email}`}>{site.email}</a></li>
      </ul>
      <h2>Waarom deze tool?</h2>
      <p>Peppol en e-facturatie worden voor steeds meer organisaties belangrijk. Ondernemers willen snel weten of een klant of leverancier vindbaar is op het netwerk, zonder direct een volledig boekhoudpakket te openen.</p>
      <p>Wil je een bedrijf controleren? Gebruik dan de <Link href="/monitor">Peppol checker</Link>.</p>
      <h2>Geen juridisch advies</h2>
      <p>We formuleren verplichtingen bewust als indicatie. Het Nederlandse mandaat is in consultatie / nog niet definitief en kan veranderen.</p>
      <CheckCta />
    </InfoPage>
  );
}
