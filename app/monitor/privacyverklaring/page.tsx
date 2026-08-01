import { InfoPage } from "../_components/Page";
import { pageMetadata, site } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Privacyverklaring | Peppol-Check",
  description: "Privacyverklaring van Peppol-Check: zoekopdrachten worden niet opgeslagen, bron is de officiële Peppol Directory, hosting via Vercel EU.",
  path: "/monitor/privacyverklaring",
});

export default function Page() {
  return (
    <InfoPage eyebrow="Privacy" title="Privacyverklaring" intro="Peppol-Check is ontworpen als eenvoudige live lookup met zo min mogelijk gegevensverwerking.">
      <h2>Wie is verantwoordelijk?</h2>
      <p>{site.company}, KvK {site.kvk}, gevestigd in {site.city}. Contact: <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
      <h2>Welke gegevens verwerken we?</h2>
      <p>Je voert een KvK-nummer of bedrijfsnaam in. Die zoekopdracht wordt gebruikt om live de officiële Peppol Directory te raadplegen.</p>
      <h2>Opslag van zoekopdrachten</h2>
      <p>Zoekopdrachten worden in deze MVP niet opgeslagen in een database. Er is alleen tijdelijke rate-limit informatie per IP-adres in memory om misbruik en overbelasting te beperken.</p>
      <h2>Bron van resultaten</h2>
      <p>De resultaten komen uit de officiële Peppol Directory van OpenPeppol via <code>directory.peppol.eu</code>. De Directory wordt door externe bronnen gevuld en kan wijzigen.</p>
      <h2>Subverwerker</h2>
      <p>Voor hosting is Vercel voorzien als subverwerker. Voor deze MVP gaan we uit van Vercel EU-instellingen waar beschikbaar. Er is nog geen Supabase-, Mollie- of Brevo-verwerking actief.</p>
      <h2>Bewaartermijn</h2>
      <p>Omdat zoekopdrachten niet worden opgeslagen, is er geen inhoudelijke bewaartermijn voor zoekopdrachten. Tijdelijke rate-limit data verdwijnt uit memory.</p>
      <h2>Vragen</h2>
      <p>Mail naar <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
    </InfoPage>
  );
}
