import Link from "next/link";
import type { ReactNode } from "react";

type RelatedLink = {
  href: string;
  title: string;
  description: string;
};

const defaultRelatedLinks: RelatedLink[] = [
  {
    href: "/monitor/peppol-niet-aangesloten-wat-nu",
    title: "Niet aangesloten op Peppol: wat nu?",
    description: "Praktische stappen als een klant of leverancier nog niet vindbaar is.",
  },
  {
    href: "/monitor/peppol-verplicht-zzp",
    title: "Peppol verplicht voor zzp?",
    description: "Wanneer e-facturatie voor zelfstandigen relevant wordt zonder harde datums te verzinnen.",
  },
  {
    href: "/monitor/klanten-controleren-op-peppol",
    title: "Klanten controleren op Peppol",
    description: "Voor accountants die meerdere klanten proactief willen bewaken.",
  },
];

export function InfoPage({ eyebrow, title, intro, children, relatedLinks = defaultRelatedLinks }: { eyebrow: string; title: string; intro: string; children: ReactNode; relatedLinks?: RelatedLink[] }) {
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
      <RelatedLinks links={relatedLinks} />
    </main>
  );
}

export function RelatedLinks({ links }: { links: RelatedLink[] }) {
  if (!links.length) return null;
  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8" aria-labelledby="gerelateerd">
      <h2 id="gerelateerd" className="text-2xl font-bold text-slate-950">Gerelateerd</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-2xl border border-slate-200 p-4 text-slate-700 no-underline transition hover:border-blue-300 hover:bg-blue-50">
            <span className="block font-semibold text-slate-950">{link.title}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-600">{link.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CheckCta({ text = "Doe direct de gratis Peppol-check.", audience = "business" }: { text?: string; audience?: "business" | "accountant" }) {
  const isAccountant = audience === "accountant";
  return (
    <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white not-prose">
      <h2 className="text-2xl font-bold">{isAccountant ? "Controleer klanten en schaal monitoring op" : "Gratis check en monitoring"}</h2>
      <p className="mt-2 text-slate-200">{text}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href="/monitor" className="rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700">
          Start gratis check
        </Link>
        <Link href="/register?redirect=/upgrade" className="rounded-2xl border border-white/30 px-5 py-3 text-center font-semibold text-white hover:bg-white/10">
          {isAccountant ? "Accountant-upgrade bekijken" : "Monitoring instellen"}
        </Link>
        <Link href="/login?redirect=/upgrade" className="rounded-2xl border border-white/30 px-5 py-3 text-center font-semibold text-white hover:bg-white/10">
          Ik heb al een account
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-400">{isAccountant ? "De accountant-tier is bedoeld voor meerdere klantcontroles en monitoring op schaal." : "Monitoring loopt via de bestaande PeppolPro-upgradeflow."}</p>
    </div>
  );
}
