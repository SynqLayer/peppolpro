import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Niet aangesloten op Peppol: wat nu? | Praktische vervolgstappen",
  description: "Wat je kunt doen als een bedrijf niet vindbaar is in de Peppol Directory, zonder de uitkomst juridisch te overschatten.",
  path: "/monitor/peppol-niet-aangesloten-wat-nu",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Niet gevonden" title="Niet aangesloten op Peppol: wat nu?" intro="Een niet-gevonden Peppol-resultaat is vervelend, maar het betekent niet automatisch dat er niets mogelijk is of dat iemand juridisch fout zit.">
      <h2>Controleer eerst de zoekterm</h2>
      <p>Zoek met KvK-nummer, handelsnaam en eventueel de naam waaronder de organisatie factureert. Directory-registraties kunnen afwijken van de naam die op een website of factuur staat.</p>
      <h2>Vraag de juiste vraag aan de andere partij</h2>
      <p>Vraag niet alleen “hebben jullie Peppol?”, maar vraag welk Peppol-ID of welke e-factuurroute gebruikt moet worden. Soms is er een access point actief, maar staat de publicatie anders geregistreerd.</p>
      <h2>Leg het resultaat vast als momentopname</h2>
      <p>Een lookup is een momentopname. Als het om een belangrijke klant of leverancier gaat, wil je later opnieuw controleren in plaats van vertrouwen op één oude zoekactie.</p>
      <h2>Wanneer opschalen naar monitoring?</h2>
      <p>Monitoring is vooral nuttig wanneer een wijziging impact heeft op je factuurproces: terugkerende klanten, leveranciers met veel volume of dossiers waar een accountant toezicht op houdt.</p>
      <CheckCta text="Start met een gratis hercheck en stel monitoring in als deze partij belangrijk is voor je factuurproces." />
    </InfoPage>
  );
}
