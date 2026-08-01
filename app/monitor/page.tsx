import { CheckTool } from "./_components/CheckTool";
import { pageMetadata } from "@/lib/monitor/site";

export const metadata = pageMetadata({
  title: "Peppol-Check | Gratis Peppol ID opzoeken",
  description: "Zoek gratis via de officiële Peppol Directory of een Nederlands bedrijf een Peppol-ID en documenttypen heeft.",
  path: "/monitor",
});

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">SynqLayer Peppol-Check</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Check of een NL-bedrijf vindbaar is op Peppol.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Vul een KvK-nummer of bedrijfsnaam in. We doen een live lookup bij de officiële Peppol Directory en tonen Peppol-ID&apos;s en ondersteunde documenttypen als die beschikbaar zijn.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
          De verplicht-indicatie is bewust voorzichtig: het Nederlandse mandaat is in consultatie / nog niet definitief. ViDA 2030 is relevant voor grensoverschrijdende B2B binnen de EU.
        </p>
      </section>
      <CheckTool />
    </main>
  );
}
