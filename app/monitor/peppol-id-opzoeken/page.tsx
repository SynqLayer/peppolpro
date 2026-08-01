import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Peppol ID opzoeken | Gratis lookup voor NL bedrijven",
  description: "Zoek gratis een Peppol-ID op met KvK-nummer of bedrijfsnaam via de officiële Peppol Directory.",
  path: "/monitor/peppol-id-opzoeken",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Peppol lookup" title="Peppol ID opzoeken" intro="Met Peppol-Check zoek je live of een Nederlands bedrijf in de officiële Peppol Directory staat.">
      <h2>Wat zoek je precies?</h2>
      <p>Een Peppol-ID identificeert een deelnemer op het Peppol-netwerk. Bij een match tonen we de gevonden Peppol-ID&apos;s en documenttypen die de Directory teruggeeft.</p>
      <h2>Zoeken met KvK-nummer</h2>
      <p>Bij een 8-cijferig KvK-nummer probeert de tool een Nederlandse Peppol identifier. Als dat niets oplevert, kunnen alternatieve Directory-velden relevant zijn.</p>
      <h2>Zoeken met bedrijfsnaam</h2>
      <p>Bij bedrijfsnamen zoeken we op naam binnen Nederland. Let op spelling, handelsnamen en concernnamen: die kunnen afwijken van de naam die je verwacht.</p>
      <h2>Beperkingen</h2>
      <p>Een niet-gevonden resultaat is geen juridisch bewijs. Het betekent alleen dat deze live zoekopdracht geen match gaf in de officiële Directory.</p>
      <CheckCta text="Vul een KvK-nummer of bedrijfsnaam in en zoek direct het Peppol-ID op." />
    </InfoPage>
  );
}
