import Link from "next/link";

const links = [
  ["Hoe het werkt", "/monitor/hoe-het-werkt"],
  ["FAQ", "/monitor/veelgestelde-vragen"],
  ["Peppol ID", "/monitor/peppol-id-opzoeken"],
];

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/monitor" className="text-lg font-bold text-slate-950">Peppol-Check</Link>
        <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-700" aria-label="Hoofdnavigatie">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-blue-700">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
