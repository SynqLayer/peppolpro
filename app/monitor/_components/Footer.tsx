import Link from "next/link";
import { site } from "@/lib/monitor/site";

const links = [
  ["Hoe het werkt", "/monitor/hoe-het-werkt"],
  ["FAQ", "/monitor/veelgestelde-vragen"],
  ["Over ons", "/monitor/over-ons"],
  ["Privacy", "/monitor/privacyverklaring"],
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 px-5 py-8 text-sm text-slate-600 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{site.company} · {site.name}</p>
          <p>KvK {site.kvk} · {site.city}</p>
          <p>
            Contact: <a className="text-blue-700 underline" href={`mailto:${site.email}`}>{site.email}</a>
          </p>
        </div>
        <nav className="flex flex-wrap gap-3" aria-label="Footer navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-slate-700 hover:text-blue-700">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
