import Link from "next/link";
import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">{eyebrow}</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p>
      </section>
      <section className="prose prose-slate mt-8 max-w-none rounded-3xl border border-slate-200 bg-white p-6 shadow-sm prose-a:text-blue-700 sm:p-10">
        {children}
      </section>
    </main>
  );
}

export function CheckCta({ text = "Doe direct de gratis Peppol-check." }: { text?: string }) {
  return (
    <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white not-prose">
      <h2 className="text-2xl font-bold">Gratis check en monitoring</h2>
      <p className="mt-2 text-slate-200">{text}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href="/monitor" className="rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700">
          Start gratis check
        </Link>
        <Link href="/register?redirect=/upgrade" className="rounded-2xl border border-white/30 px-5 py-3 text-center font-semibold text-white hover:bg-white/10">
          Monitoring instellen
        </Link>
        <Link href="/login?redirect=/upgrade" className="rounded-2xl border border-white/30 px-5 py-3 text-center font-semibold text-white hover:bg-white/10">
          Ik heb al een account
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-400">Monitoring loopt via de bestaande PeppolPro-upgradeflow.</p>
    </div>
  );
}
