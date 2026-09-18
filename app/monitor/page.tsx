import { CheckTool } from "./_components/CheckTool";
import { RelatedLinks } from "./_components/Page";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Peppol checker | Gratis Peppol ID opzoeken",
  description: "Gebruik de gratis Peppol checker om via de officiële Peppol Directory te controleren of een Nederlands bedrijf een gepubliceerde Peppol-ID en documenttypen heeft.",
  path: "/monitor",
});

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">SynqLayer Peppol-Check</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Check of een NL-bedrijf gepubliceerd is in de Peppol Directory.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Vul een KvK-nummer of bedrijfsnaam in. We doen een live lookup bij de officiële Peppol Directory en tonen Peppol-ID&apos;s en ondersteunde documenttypen als die beschikbaar zijn.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Let op: OpenPeppol vermeldt dat publicatie in de Directory niet verplicht is voor iedere geregistreerde ontvanger. Een niet-gevonden resultaat bewijst dus niet dat een organisatie niet op Peppol kan ontvangen.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Nederland: het kabinet heeft op 11 september 2026 gekozen voor verplichte e-facturatie per 1 juli 2030 voor nationale en internationale B2B-transacties. De nationale wetgeving en uitvoeringsdetails worden nog uitgewerkt; voor KOR-ondernemers is in het kabinetsplan een uitzondering opgenomen.
        </p>
      </section>
      <CheckTool />
      <RelatedLinks links={[
        { href: "/monitor/peppol-verplicht-zzp", title: "Peppol verplicht voor zzp?", description: "Uitleg voor zelfstandigen met onderscheid tussen huidige en geplande regels." },
        { href: "/monitor/peppol-verplicht-webshop", title: "Peppol verplicht voor webshops?", description: "Wanneer e-facturatie relevant wordt voor B2B-webshops." },
        { href: "/monitor/peppol-niet-aangesloten-wat-nu", title: "Niet gevonden: wat nu?", description: "Welke stappen je kunt nemen na een niet-gevonden Directory-resultaat." },
        { href: "/monitor/klanten-controleren-op-peppol", title: "Klanten controleren op Peppol", description: "Voor accountants en kantoren die meerdere klantdossiers willen controleren." },
      ]} />
    </main>
  );
}
