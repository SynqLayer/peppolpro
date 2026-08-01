import { InfoPage, CheckCta } from "../_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Peppol verplicht voor webshops? | B2B e-facturatie check",
  description: "Wanneer Peppol relevant wordt voor webshops met zakelijke klanten, overheidsklanten of EU B2B-facturatie.",
  path: "/monitor/peppol-verplicht-webshop",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Webshops" title="Peppol verplicht voor webshops?" intro="Een webshop merkt Peppol meestal niet door een abstract mandaat, maar doordat zakelijke klanten anders willen inkopen en facturen ontvangen.">
      <h2>Wanneer speelt dit voor een webshop?</h2>
      <p>Voor pure consumentenverkoop is Peppol meestal niet de eerste zorg. Voor B2B-webshops ligt dat anders: grotere klanten, publieke instellingen of internationale afnemers kunnen gestructureerde e-facturen verlangen in plaats van pdf-bijlagen.</p>
      <h2>Het probleem zit vaak na de bestelling</h2>
      <p>De checkout kan prima werken terwijl de factuurstroom achteraf handmatig blijft. Als een zakelijke klant om Peppol vraagt, moet je weten of je eigen administratie en je klant technisch vindbaar zijn.</p>
      <h2>Controleer klantgroepen, niet alleen jezelf</h2>
      <p>Een webshop met terugkerende B2B-klanten kan periodiek controleren welke klanten al op Peppol staan. Dat helpt om verkoop, finance en support dezelfde informatie te geven.</p>
      <h2>Geen harde datum nodig om te starten</h2>
      <p>Je hoeft geen definitieve verplichtingsdatum te hebben om voorbereid te zijn. Begin met een gratis Peppol-check en bepaal daarna of monitoring voor je belangrijkste zakelijke klanten zinvol is.</p>
      <CheckCta text="Check gratis of je webshop, klant of leverancier al vindbaar is op Peppol." />
    </InfoPage>
  );
}
