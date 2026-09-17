import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Wat is Peppol? | Uitleg voor ondernemers",
  description: "Korte Nederlandse uitleg over Peppol, Peppol-ID's, e-facturatie en actuele Nederlandse en Europese ontwikkelingen.",
  path: "/monitor/wat-is-peppol",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Basisuitleg" title="Wat is Peppol?" intro="Peppol is een interoperabiliteitsnetwerk en afsprakenstelsel voor de gestandaardiseerde uitwisseling van zakelijke documenten, waaronder e-facturen.">
      <h2>Peppol in normale taal</h2>
      <p>Bedrijven en overheden sluiten via Peppol-serviceproviders aan op een netwerk met vaste technische afspraken. Peppol is dus niet één centrale factuurwebsite en PeppolPro is zelf niet het Peppol-netwerk of een zelfstandig Access Point.</p>
      <h2>Waarom ondernemers ernaar kijken</h2>
      <p>Peppol kan relevant zijn als klanten gestructureerde e-facturen vragen, als je aan overheden levert of als je je voorbereidt op toekomstige B2B-e-facturatieregels.</p>
      <h2>Peppol-ID en Directory</h2>
      <p>Een Peppol-ID identificeert een deelnemer. De officiële Peppol Directory kan gepubliceerde IDs en documenttypen tonen, maar OpenPeppol vermeldt dat publicatie door SMP-serviceproviders niet verplicht is. Niet iedere geregistreerde ontvanger is daarom in de Directory vindbaar.</p>
      <h2>Nederlandse ontwikkeling</h2>
      <p>Het kabinet heeft op 11 september 2026 gekozen voor verplichte e-facturatie per 1 juli 2030 voor nationale en internationale B2B-transacties. De nationale wetgeving en praktische uitwerking volgen nog. Voor grensoverschrijdende B2B is ook ViDA vanaf 1 juli 2030 relevant.</p>
      <CheckCta text="Check gratis of een bedrijf gepubliceerd is in de Peppol Directory." />
    </InfoPage>
  );
}
