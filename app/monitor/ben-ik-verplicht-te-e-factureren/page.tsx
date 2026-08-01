import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Ben ik verplicht te e-factureren? | Peppol-Check",
  description: "Lees wanneer e-facturatie relevant kan zijn voor Nederlandse bedrijven. NL-mandaat in consultatie, ViDA 2030 voor EU B2B.",
  path: "/monitor/ben-ik-verplicht-te-e-factureren",
});

export default function Page() {
  return (
    <InfoPage eyebrow="E-facturatie" title="Ben ik verplicht te e-factureren?" intro="Voor Nederlandse ondernemers is het eerlijke antwoord: soms nu al praktisch of contractueel, maar een breed NL-mandaat is in consultatie / nog niet definitief.">
      <h2>Wanneer is het nu al relevant?</h2>
      <p>Lever je aan een overheid of grote organisatie, dan kan e-facturatie via Peppol of een vergelijkbaar kanaal al gevraagd worden. Kijk daarom altijd naar de inkoopvoorwaarden van je klant.</p>
      <h2>Nederland: voorzichtig formuleren</h2>
      <p>Een Nederlandse verplichting voor bredere B2B e-facturatie is in consultatie / nog niet definitief. Noem daarom geen vaste datum alsof die al wettelijk vaststaat.</p>
      <h2>EU: ViDA 2030</h2>
      <p>Voor grensoverschrijdende B2B binnen de EU is ViDA 2030 een relevante ontwikkeling. Dat betekent dat voorbereiding verstandig kan zijn, vooral als je internationaal factureert.</p>
      <h2>Praktische eerste stap</h2>
      <p>Controleer of jouw bedrijf, klant of leverancier al vindbaar is op Peppol. Dat zegt niet alles over verplichtingen, maar het geeft snel technisch inzicht.</p>
      <CheckCta text="Controleer gratis of een bedrijf al in de Peppol Directory staat." />
    </InfoPage>
  );
}
