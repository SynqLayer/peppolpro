import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Hoe werkt Peppol-Check? | Gratis Peppol lookup",
  description: "Lees hoe Peppol-Check live zoekt in de officiële Peppol Directory en waarom de uitkomst een technische indicatie is.",
  path: "/monitor/hoe-het-werkt",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Uitleg" title="Hoe werkt Peppol-Check?" intro="Peppol-Check is een eenvoudige gratis lookup voor Nederlandse bedrijven. De tool zoekt live in de officiële Peppol Directory.">
      <h2>Stap voor stap</h2>
      <ol>
        <li>Je vult een KvK-nummer of bedrijfsnaam in.</li>
        <li>Peppol-Check stuurt een korte live zoekvraag naar de officiële Peppol Directory.</li>
        <li>Als er matches zijn, tonen we Peppol-ID&apos;s en ondersteunde documenttypen.</li>
        <li>De verplicht-indicatie blijft bewust voorzichtig en is geen juridisch advies.</li>
      </ol>
      <h2>Waarom geen bulk-cache?</h2>
      <p>Voor deze MVP gebruiken we live lookups zonder eigen opslag van zoekopdrachten. Dat houdt het simpel, privacyvriendelijk en dicht bij de officiële bron.</p>
      <h2>Wat betekent “niet gevonden”?</h2>
      <p>Niet gevonden betekent alleen dat deze zoekopdracht geen match gaf in de Directory. Het is geen juridisch bewijs dat een bedrijf nooit via Peppol kan ontvangen.</p>
      <CheckCta />
    </InfoPage>
  );
}
