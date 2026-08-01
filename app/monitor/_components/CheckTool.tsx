"use client";

import { FormEvent, useMemo, useState } from "react";
import { getMandateIndication } from "@/lib/monitor/mandate";
import type { PeppolLookupResult } from "@/lib/monitor/types";

export function CheckTool() {
  const [query, setQuery] = useState("");
  const [suppliesGovernment, setSuppliesGovernment] = useState(false);
  const [tradesB2bEu, setTradesB2bEu] = useState(false);
  const [result, setResult] = useState<PeppolLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const indication = useMemo(
    () => getMandateIndication({ suppliesGovernment, tradesB2bEu }),
    [suppliesGovernment, tradesB2bEu],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/monitor-lookup?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Lookup mislukt.");
      setResult(data as PeppolLookupResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Onbekende fout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" id="gratis-check">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">Gratis Peppol-check</h2>
        <p className="mt-3 text-slate-600">Zoek live in de officiële Peppol Directory. Zoekopdrachten worden niet opgeslagen.</p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="query">KvK-nummer of bedrijfsnaam</label>
          <input
            id="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Bijv. 76440656 of Gemeente Rotterdam"
            className="min-h-14 flex-1 rounded-2xl border border-slate-300 bg-white px-5 text-base outline-none ring-blue-200 transition focus:border-blue-600 focus:ring-4"
          />
          <button type="submit" disabled={loading} className="min-h-14 rounded-2xl bg-blue-700 px-6 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">
            {loading ? "Bezig..." : "Check Peppol"}
          </button>
        </form>
        {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

        {!result && <p className="mt-6 text-slate-600">Nog geen zoekopdracht uitgevoerd.</p>}
        {result && (
          <div className="mt-6 space-y-5">
            <div className={`rounded-2xl p-5 ${result.found ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
              <p className="text-sm font-semibold uppercase tracking-wide">{result.found ? "Gevonden" : "Niet gevonden"}</p>
              <p className="mt-2 text-lg font-bold">
                {result.found ? "Dit bedrijf heeft ten minste één vermelding in de Peppol Directory." : "Geen Peppol-vermelding gevonden voor deze zoekopdracht."}
              </p>
            </div>
            {result.peppolIds.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-950">Peppol-ID&apos;s</h3>
                <ul className="mt-2 space-y-2">
                  {result.peppolIds.map((id) => <li key={id} className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">{id}</li>)}
                </ul>
              </div>
            )}
            {result.supportedDocumentTypes.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-950">Ondersteunde documenttypen</h3>
                <ul className="mt-2 space-y-2">
                  {result.supportedDocumentTypes.slice(0, 8).map((doctype) => (
                    <li key={`${doctype.scheme}-${doctype.value}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">{doctype.label}</span>
                      <span className="mt-1 block break-all font-mono text-xs text-slate-500">{doctype.value}</span>
                    </li>
                  ))}
                </ul>
                {result.supportedDocumentTypes.length > 8 && <p className="mt-2 text-sm text-slate-500">+ {result.supportedDocumentTypes.length - 8} extra documenttype(n).</p>}
              </div>
            )}
            <div className="text-xs text-slate-500">Bron: {result.source.name} · live opgehaald: {new Date(result.source.fetchedAt).toLocaleString("nl-NL")}</div>
          </div>
        )}
      </div>

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">Verplicht-indicatie</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Geen juridisch advies. Het Nederlandse mandaat is in consultatie / nog niet definitief. ViDA 2030 is relevant voor EU-ontwikkelingen bij grensoverschrijdende B2B.</p>
        <div className="mt-5 space-y-3">
          <label className="flex gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
            <input type="checkbox" checked={suppliesGovernment} onChange={(event) => setSuppliesGovernment(event.target.checked)} />
            Lever je aan overheid of semioverheid?
          </label>
          <label className="flex gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
            <input type="checkbox" checked={tradesB2bEu} onChange={(event) => setTradesB2bEu(event.target.checked)} />
            Handel je B2B met klanten/leveranciers in andere EU-landen?
          </label>
        </div>
        <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Indicatie: {indication.level}</p>
          <h3 className="mt-2 text-lg font-bold">{indication.title}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
            {indication.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        </div>
      </aside>
    </section>
  );
}
