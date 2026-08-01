import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Wat is Peppol? | Uitleg voor ondernemers",
  description: "Korte Nederlandse uitleg over Peppol, Peppol-ID's, e-facturatie en waarom bedrijven zich voorbereiden.",
  path: "/monitor/wat-is-peppol",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Basisuitleg" title="Wat is Peppol?" intro="Peppol is een netwerk voor veilige en gestandaardiseerde uitwisseling van zakelijke documenten, waaronder e-facturen.">
      <h2>Peppol in normale taal</h2>
      <p>Peppol helpt bedrijven en overheden om facturen en andere documenten digitaal uit te wisselen via vaste technische afspraken. Daardoor hoeven partijen minder losse PDF&apos;s en handmatige invoer te gebruiken.</p>
      <h2>Waarom ondernemers ernaar kijken</h2>
      <p>Peppol kan relevant zijn als klanten e-facturen vragen, als je aan overheden levert of als je B2B met EU-landen doet. ViDA 2030 maakt grensoverschrijdende B2B e-facturatie een belangrijker onderwerp.</p>
      <h2>Peppol-ID</h2>
      <p>Een Peppol-ID is de manier waarop een organisatie op het netwerk vindbaar is. De officiële Peppol Directory kan laten zien welke IDs en documenttypen gepubliceerd zijn.</p>
      <h2>Nederlandse verplichting</h2>
      <p>Voor Nederland moet je het bredere mandaat voorzichtig formuleren: in consultatie / nog niet definitief. Peppol-ready worden kan wel alvast praktisch zijn.</p>
      <CheckCta text="Check gratis of een bedrijf al vindbaar is op Peppol." />
    </InfoPage>
  );
}
