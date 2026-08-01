import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Peppol verplicht voor boekhouders? | Praktische voorbereiding",
  description: "Wat boekhouders moeten weten over Peppol, e-facturatievragen van klanten en het controleren van Peppol-bereikbaarheid.",
  path: "/monitor/peppol-verplicht-boekhouder",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Boekhouders" title="Peppol verplicht voor boekhouders?" intro="Voor boekhouders is de vraag vaak niet alleen of Peppol juridisch verplicht is, maar vooral wanneer klanten er praktisch last van krijgen.">
      <h2>Waarom deze vraag bij boekhouders terechtkomt</h2>
      <p>Klanten vragen hun boekhouder meestal om duidelijkheid zodra een afnemer, leverancier of overheid een e-factuurroute noemt. De boekhouder moet dan snel kunnen uitleggen wat technisch nodig is, zonder een wettelijke datum te beloven die nog niet definitief is.</p>
      <h2>Wat je nu veilig kunt controleren</h2>
      <p>Begin met vindbaarheid: staat de klant of diens belangrijkste afnemer in de Peppol Directory, en welke documenttypen worden gepubliceerd? Dat is geen juridisch oordeel, maar wel een bruikbare technische eerste stap.</p>
      <h2>Wanneer wordt monitoring nuttig?</h2>
      <p>Bij één losse vraag is een gratis check genoeg. Komen dezelfde vragen terug voor meerdere klanten, dan wil je wijzigingen bijhouden: vandaag niet gevonden kan later wel gevonden zijn, en andersom kan een publicatie wijzigen.</p>
      <h2>Hoe communiceer je dit naar klanten?</h2>
      <p>Formuleer voorzichtig: “we controleren of je technisch vindbaar bent op Peppol” in plaats van “je bent verplicht vanaf datum X”. Daarmee voorkom je schijnzekerheid en blijft het advies praktisch.</p>
      <CheckCta audience="accountant" text="Controleer eerst gratis een klant en bekijk daarna of monitoring voor meerdere dossiers logisch is." />
    </InfoPage>
  );
}
