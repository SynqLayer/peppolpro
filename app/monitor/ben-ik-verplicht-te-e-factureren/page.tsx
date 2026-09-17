import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Ben ik verplicht te e-factureren? | Peppol-Check",
  description: "Actuele uitleg over Nederlandse e-facturatie: kabinetskeuze voor 1 juli 2030, huidige B2G-eisen en ViDA voor grensoverschrijdende B2B.",
  path: "/monitor/ben-ik-verplicht-te-e-factureren",
});

export default function Page() {
  return (
    <InfoPage eyebrow="E-facturatie" title="Ben ik verplicht te e-factureren?" intro="In 2026 geldt nog geen brede algemene verplichting voor alle Nederlandse B2B-facturen. Het kabinet heeft op 11 september 2026 wel gekozen voor verplichte e-facturatie vanaf 1 juli 2030 voor nationale en internationale B2B-transacties; de nationale wetgeving wordt nog uitgewerkt.">
      <h2>Wanneer is het nu al relevant?</h2>
      <p>Lever je aan een overheid of grote organisatie, dan kan gestructureerde e-facturatie via Peppol of een ander kanaal al worden gevraagd of verplicht zijn op basis van inkoopvoorwaarden of bestaande regels. Controleer daarom altijd de eisen van je afnemer.</p>
      <h2>Nederland: kabinetskeuze voor 1 juli 2030</h2>
      <p>Het kabinet heeft op 11 september 2026 aangekondigd e-facturatie per 1 juli 2030 verplicht te willen stellen voor zowel binnenlandse als internationale transacties tussen bedrijven. Voor binnenlandse digitale rapportage is 1 juli 2031 gekozen. Volgens het kabinetsplan blijven ondernemers in de KOR met maximaal €20.000 omzet per kalenderjaar vrijgesteld. Het nationale wetsvoorstel wordt nog uitgewerkt en wordt naar verwachting vóór de zomer van 2027 bij de Tweede Kamer ingediend.</p>
      <h2>EU: ViDA vanaf 1 juli 2030</h2>
      <p>ViDA introduceert vanaf 1 juli 2030 digitale rapportage op basis van e-facturatie voor grensoverschrijdende B2B-transacties binnen de EU. Dat is niet hetzelfde als zeggen dat iedere factuur in iedere lidstaat vanaf die datum via Peppol moet lopen.</p>
      <h2>België is een ander regime</h2>
      <p>België verplicht sinds 1 januari 2026 gestructureerde e-facturatie voor veel binnenlandse B2B-transacties tussen Belgische btw-plichtige ondernemingen. Een Nederlandse leverancier die internationaal aan een Belgische klant factureert valt niet automatisch onder die specifieke binnenlandse Belgische B2B-verplichting.</p>
      <h2>Praktische eerste stap</h2>
      <p>Controleer of jouw bedrijf, klant of leverancier gepubliceerd is in de Peppol Directory. Let op: niet iedere geregistreerde Peppol-ontvanger hoeft in de Directory te staan, dus een niet-gevonden resultaat is geen bewijs dat een organisatie niet op Peppol kan ontvangen.</p>
      <CheckCta text="Controleer gratis of een bedrijf gepubliceerd is in de Peppol Directory." />
    </InfoPage>
  );
}
