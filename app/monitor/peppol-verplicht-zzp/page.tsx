import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Peppol verplicht voor zzp? | Nuchtere uitleg zonder paniek",
  description: "Peppol en e-facturatie voor zzp'ers: wanneer is het relevant, wat kun je controleren en wat is geen juridisch bewijs?",
  path: "/monitor/peppol-verplicht-zzp",
});

export default function Page() {
  return (
    <InfoPage eyebrow="ZZP" title="Peppol verplicht voor zzp?" intro="Voor zzp'ers is de belangrijkste vraag: vraagt mijn klant erom, en kan ik zonder gedoe aantonen of een partij op Peppol vindbaar is?">
      <h2>Niet elke zzp&apos;er heeft direct actie nodig</h2>
      <p>Werk je alleen voor kleine particuliere klanten, dan is Peppol waarschijnlijk niet je eerste prioriteit. Werk je voor overheid, grotere bedrijven of internationale B2B-klanten, dan kan e-facturatie sneller praktisch relevant worden.</p>
      <h2>Wat kun je vandaag controleren?</h2>
      <p>Je kunt nagaan of je eigen bedrijf of een klant in de Peppol Directory staat. Een gevonden resultaat toont technische vindbaarheid; een niet-gevonden resultaat is geen juridisch bewijs dat Peppol nooit nodig is.</p>
      <h2>Voorkom paniekverkoop</h2>
      <p>Er worden online snel harde conclusies getrokken over verplichtingen. Blijf voorzichtig: regels, contracten en klantvoorwaarden verschillen. Gebruik de check als startpunt, niet als juridisch advies.</p>
      <h2>Wanneer is monitoring handig?</h2>
      <p>Als je afhankelijk bent van een paar grote opdrachtgevers, kan het nuttig zijn wijzigingen bij die opdrachtgevers te volgen. Dan zie je eerder wanneer een klant technisch Peppol-ready lijkt te worden.</p>
      <CheckCta text="Doe eerst een gratis check voor jezelf of een opdrachtgever. Monitoring kun je daarna instellen als het echt relevant is." />
    </InfoPage>
  );
}
