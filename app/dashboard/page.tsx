import { createServerSupabase } from "@/lib/supabase-server";
import { C } from "@/lib/constants";
import { redirect } from "next/navigation";
import Link from "next/link";

type Profile = {
 email?: string | null;
 company_name?: string | null;
 full_name?: string | null;
 plan?: string | null;
 credits?: number | null;
 onboarding_complete?: boolean | null;
 kvk_number?: string | null;
 kvk_kbo?: string | null;
 kbo_number?: string | null;
 btw_number?: string | null;
 btw_nr?: string | null;
 address?: string | null;
 iban?: string | null;
};

type Conversion = {
 id?: string | null;
 filename?: string | null;
 original_filename?: string | null;
 status?: string | null;
 invoice_number?: string | null;
 total_amount?: number | string | null;
 invoice_date?: string | null;
 currency?: string | null;
 customer_name?: string | null;
 seller_name?: string | null;
 ubl_xml?: string | null;
 created_at?: string | null;
};

type Task = {
 title: string;
 detail: string;
 href: string;
 tone: "amber" | "red" | "blue";
};

const statusMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
 draft: { label: "Concept", bg: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "rgba(148,163,184,0.22)" },
 concept: { label: "Concept", bg: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "rgba(148,163,184,0.22)" },
 processing: { label: "Verzonden", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)" },
 sent: { label: "Verzonden", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)" },
 success: { label: "Afgeleverd", bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.24)" },
 done: { label: "Afgeleverd", bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.24)" },
 delivered: { label: "Afgeleverd", bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.24)" },
 failed: { label: "Mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)" },
 error: { label: "Mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)" },
};

const formatCurrency = (value: number, currency = "EUR") => {
 return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(value || 0);
};

const formatDate = (value?: string | null) => {
 if (!value) return "-";
 return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

const numberValue = (value?: number | string | null) => {
 if (typeof value === "number") return value;
 if (typeof value === "string") return Number(value) || 0;
 return 0;
};

const normalizedStatus = (status?: string | null) => {
 const key = (status || "draft").toLowerCase();
 return statusMap[key] ? key : "draft";
};

const isDelivered = (status?: string | null) => ["success", "done", "delivered", "paid", "afgeleverd", "betaald"].includes((status || "").toLowerCase());
const isFailed = (status?: string | null) => ["failed", "error", "mislukt"].includes((status || "").toLowerCase());
const isDraft = (status?: string | null) => ["draft", "concept"].includes((status || "").toLowerCase());
const isOpen = (status?: string | null) => ["draft", "concept", "processing", "sent", "verzonden"].includes((status || "").toLowerCase());

const profileComplete = (profile: Profile | null) => {
 if (!profile) return false;
 const kvk = profile.kvk_number || profile.kvk_kbo || profile.kbo_number;
 const vat = profile.btw_number || profile.btw_nr;
 return Boolean(profile.company_name && kvk && vat && profile.address);
};

const cardStyle = {
 background: "linear-gradient(180deg, rgba(15,23,42,0.86), rgba(15,23,42,0.62))",
 border: "1px solid rgba(148,163,184,0.13)",
 boxShadow: "0 18px 60px rgba(0,0,0,0.26)",
 borderRadius: 8,
} as const;

function StatusBadge({ status }: { status?: string | null }) {
 const item = statusMap[normalizedStatus(status)];
 return (
 <span style={{ display: "inline-flex", alignItems: "center", minWidth: 84, justifyContent: "center", padding: "5px 9px", borderRadius: 999, background: item.bg, border: `1px solid ${item.border}`, color: item.color, fontSize: 12, fontWeight: 800 }}>
 {item.label}
 </span>
 );
}

function KpiCard({ label, value, caption, accent }: { label: string; value: string; caption: string; accent: string }) {
 return (
 <div style={{ ...cardStyle, padding: 18 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
 <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 800 }}>{label}</span>
 <span style={{ width: 8, height: 8, borderRadius: 999, background: accent, boxShadow: `0 0 18px ${accent}` }} />
 </div>
 <div style={{ color: C.white, fontSize: 28, lineHeight: 1, fontWeight: 900 }}>{value}</div>
 <div style={{ color: "#64748b", fontSize: 12, marginTop: 9 }}>{caption}</div>
 </div>
 );
}

export default async function DashboardPage({
 searchParams,
}: {
 searchParams: Promise<{ betaald?: string; alles?: string }>;
}) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 const params = await searchParams;

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("*")
 .eq("id", user.id)
 .single<Profile>();

 const { data: conversionsData } = await supabase
 .from("conversions")
 .select("id, filename, created_at, status, ubl_xml, customer_name, total_amount, invoice_number, currency")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(100);

 const conversions = (conversionsData || []) as Conversion[];
 const showAll = params.alles === "1";
 const latestConversions = showAll ? conversions : conversions.slice(0, 10);
 const isFree = !profile?.plan || profile.plan === "free";
 const hasInvoices = conversions.length > 0;
 const now = new Date();
 const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
 const invoicesThisMonth = conversions.filter((conversion) => conversion.created_at && new Date(conversion.created_at) >= monthStart).length;
 const openAmount = conversions.reduce((sum, conversion) => sum + (isOpen(conversion.status) ? numberValue(conversion.total_amount) : 0), 0);
 const deliveredCount = conversions.filter((conversion) => isDelivered(conversion.status)).length;
 const deliveredAmount = conversions.reduce((sum, conversion) => sum + (isDelivered(conversion.status) ? numberValue(conversion.total_amount) : 0), 0);
 const failedCount = conversions.filter((conversion) => isFailed(conversion.status)).length;
 const currency = conversions.find((conversion) => conversion.currency)?.currency || "EUR";
 const completeProfile = profileComplete(profile);

 const tasks: Task[] = [];
 const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
 const oldDrafts = conversions.filter((conversion) => isDraft(conversion.status) && conversion.created_at && new Date(conversion.created_at).getTime() < threeDaysAgo).length;
 if (oldDrafts > 0) {
 tasks.push({ title: `${oldDrafts} concept${oldDrafts === 1 ? "" : "en"} ouder dan 3 dagen`, detail: "Rond deze facturen af of verwijder ze uit je workflow.", href: "/nieuw", tone: "amber" });
 }
 if (failedCount > 0) {
 tasks.push({ title: `${failedCount} verzending${failedCount === 1 ? "" : "en"} mislukt`, detail: "Controleer de gegevens en verstuur opnieuw.", href: "/convert", tone: "red" });
 }
 if (!completeProfile) {
 tasks.push({ title: "Profiel onvolledig", detail: "KvK/KBO, BTW-nummer of adres ontbreekt nog.", href: "/onboarding", tone: "blue" });
 }
 if (isFree) {
 tasks.push({ title: "Peppol Inbox niet geactiveerd", detail: "Activeer Compleet om inkomende Peppol-facturen te ontvangen.", href: "/prijzen", tone: "blue" });
 }

 const onboardingSteps = [
 { title: "Bedrijfsgegevens invullen", done: completeProfile, href: "/onboarding", cta: "Bedrijfsgegevens" },
 { title: "Eerste klant toevoegen", done: false, href: "/nieuw", cta: "Klant invoeren" },
 { title: "Eerste factuur maken & verzenden", done: hasInvoices, href: "/nieuw", cta: "Factuur maken" },
 ];
 const progress = onboardingSteps.filter((step) => step.done).length;

 return (
 <main style={{ minHeight: "100vh", background: `radial-gradient(circle at 30% 0%, rgba(59,130,246,0.12), transparent 32%), ${C.bg}`, color: C.white, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
 <style>{`
 .dashboard-shell { max-width: 1180px; margin: 0 auto; padding: 28px 20px 64px; }
 .topbar { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
 .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
 .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 38px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 800; text-decoration: none; transition: transform .16s ease, border-color .16s ease, background .16s ease; }
 .btn:hover { transform: translateY(-1px); }
 .btn-primary { color: #fff; background: linear-gradient(135deg, ${C.blue}, ${C.indigo}); border: 1px solid rgba(255,255,255,0.08); }
 .btn-green { color: #03120d; background: #34d399; border: 1px solid #34d399; }
 .btn-ghost { color: #cbd5e1; background: rgba(15,23,42,0.62); border: 1px solid rgba(148,163,184,0.16); }
 .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
 .content-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, .85fr); gap: 18px; align-items: start; }
 .table-wrap { overflow-x: auto; }
 .invoice-table { width: 100%; border-collapse: collapse; min-width: 760px; font-size: 13px; }
 .invoice-table th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0; text-align: left; padding: 12px 16px; border-bottom: 1px solid rgba(148,163,184,0.12); }
 .invoice-table td { padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.09); vertical-align: middle; }
 .invoice-table tr:hover td { background: rgba(30,41,59,0.32); }
 .action-link { color: #93c5fd; text-decoration: none; font-size: 12px; font-weight: 800; }
 .action-muted { color: #64748b; font-size: 12px; font-weight: 800; }
 .task-link { display: block; padding: 14px; border-radius: 8px; text-decoration: none; border: 1px solid rgba(148,163,184,0.12); background: rgba(2,6,23,0.34); transition: background .16s ease, transform .16s ease; }
 .task-link:hover { background: rgba(30,41,59,0.5); transform: translateY(-1px); }
 .onboarding-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
 @media (max-width: 900px) {
 .topbar { flex-direction: column; }
 .header-actions { justify-content: flex-start; }
 .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
 .content-grid { grid-template-columns: 1fr; }
 .onboarding-grid { grid-template-columns: 1fr; }
 }
 @media (max-width: 520px) {
 .dashboard-shell { padding: 22px 14px 48px; }
 .kpi-grid { gap: 10px; }
 .btn { width: 100%; }
 .header-actions { width: 100%; }
 }
 `}</style>

 <div className="dashboard-shell">
 {params.betaald === "1" && (
 <div style={{ ...cardStyle, background: "rgba(6,78,59,0.72)", border: "1px solid rgba(16,185,129,0.42)", padding: 14, marginBottom: 18, color: "#6ee7b7", fontSize: 14, fontWeight: 800 }}>
 Betaling ontvangen. Je account is bijgewerkt.
 </div>
 )}

 <header className="topbar">
 <div>
 <div style={{ color: "#64748b", fontSize: 12, fontWeight: 900, marginBottom: 8 }}>PeppolPro</div>
 <h1 style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 900, margin: 0 }}>Dashboard</h1>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", color: "#94a3b8", marginTop: 10, fontSize: 13 }}>
 <span>{user.email}</span>
 <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 999, background: isFree ? "rgba(148,163,184,0.12)" : "rgba(99,102,241,0.16)", border: "1px solid rgba(148,163,184,0.16)", color: isFree ? "#cbd5e1" : "#c4b5fd", fontWeight: 900, textTransform: "capitalize" }}>
 {isFree ? "Gratis plan" : profile?.plan}
 </span>
 </div>
 </div>
 <div className="header-actions">
 <Link href="/prijzen" className="btn btn-primary">Upgrade</Link>
 <Link href="/nieuw" className="btn btn-green">+ Nieuwe factuur</Link>
 </div>
 </header>

 <section className="kpi-grid">
 <KpiCard label="Facturen deze maand" value={String(invoicesThisMonth)} caption={`${conversions.length} totaal in archief`} accent="#38bdf8" />
 <KpiCard label="Openstaand bedrag" value={formatCurrency(openAmount, currency)} caption="Concepten en verzendingen in behandeling" accent="#f59e0b" />
 <KpiCard label="Betaald/afgeleverd" value={formatCurrency(deliveredAmount, currency)} caption={`${deliveredCount} succesvol verwerkt`} accent="#34d399" />
 <KpiCard label="Resterende verzendingen" value={isFree ? String(profile?.credits ?? 0) : "Onbeperkt"} caption={isFree ? "Gratis plan" : "Betaald plan actief"} accent="#818cf8" />
 </section>

 {!hasInvoices ? (
 <section style={{ ...cardStyle, padding: 22, marginBottom: 18 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
 <div>
 <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Start met je eerste Peppol-factuur</h2>
 <p style={{ margin: "7px 0 0", color: "#94a3b8", fontSize: 14 }}>Checklist {progress}/3 afgerond</p>
 </div>
 <div style={{ width: 180, height: 8, borderRadius: 999, background: "rgba(148,163,184,0.13)", overflow: "hidden" }}>
 <div style={{ width: `${(progress / 3) * 100}%`, height: "100%", background: "#34d399", borderRadius: 999 }} />
 </div>
 </div>
 <div className="onboarding-grid">
 {onboardingSteps.map((step, index) => (
 <div key={step.title} style={{ border: "1px solid rgba(148,163,184,0.13)", background: "rgba(2,6,23,0.32)", borderRadius: 8, padding: 16 }}>
 <div style={{ color: step.done ? "#34d399" : "#64748b", fontSize: 12, fontWeight: 900, marginBottom: 12 }}>Stap {index + 1} {step.done ? "✓" : ""}</div>
 <div style={{ fontWeight: 900, marginBottom: 14 }}>{step.title}</div>
 <Link href={step.href} className={step.done ? "btn btn-ghost" : "btn btn-primary"}>{step.cta}</Link>
 </div>
 ))}
 </div>
 </section>
 ) : null}

 <div className="content-grid">
 <section style={{ ...cardStyle, overflow: "hidden" }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", padding: "18px 18px 6px", flexWrap: "wrap" }}>
 <div>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Factuurhistorie</h2>
 <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Nieuwste facturen eerst</p>
 </div>
 {conversions.length > 10 && !showAll && <Link href="/dashboard?alles=1" className="action-link">Toon alles</Link>}
 {showAll && <Link href="/dashboard" className="action-link">Toon minder</Link>}
 </div>

 {!hasInvoices ? (
 <div style={{ padding: "22px 18px 24px", color: "#94a3b8", fontSize: 14 }}>
 Je factuurhistorie verschijnt hier zodra je de eerste factuur maakt.
 </div>
 ) : (
 <div className="table-wrap">
 <table className="invoice-table">
 <thead>
 <tr>
 <th>Factuurnummer</th>
 <th>Klant</th>
 <th>Bedrag</th>
 <th>Datum</th>
 <th>Status</th>
 <th>Acties</th>
 </tr>
 </thead>
 <tbody>
 {latestConversions.map((conversion, index) => {
 const invoiceNumber = conversion.invoice_number || conversion.filename || conversion.original_filename || `Factuur ${index + 1}`;
 const amount = numberValue(conversion.total_amount);
 return (
 <tr key={conversion.id || `${invoiceNumber}-${index}`}>
 <td style={{ color: "#f8fafc", fontWeight: 900 }}>{invoiceNumber}</td>
 <td style={{ color: "#cbd5e1" }}>{conversion.customer_name || "Onbekende klant"}</td>
 <td style={{ color: "#f8fafc", fontWeight: 800 }}>{formatCurrency(amount, conversion.currency || currency)}</td>
 <td style={{ color: "#94a3b8" }}>{formatDate(conversion.invoice_date || conversion.created_at)}</td>
 <td><StatusBadge status={conversion.status} /></td>
 <td>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <Link href="/dashboard" className="action-link">Bekijken</Link>
 <Link href="/convert" className="action-link">PDF</Link>
 {isFailed(conversion.status) ? <Link href="/convert" className="action-link">Opnieuw verzenden</Link> : <span className="action-muted">Opnieuw verzenden</span>}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </section>

 <aside style={{ display: "grid", gap: 18 }}>
 <section style={{ ...cardStyle, padding: 18 }}>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Actiepunten</h2>
 <p style={{ margin: "6px 0 16px", color: "#64748b", fontSize: 13 }}>Automatisch op basis van je account en facturen</p>
 {tasks.length === 0 ? (
 <div style={{ border: "1px solid rgba(16,185,129,0.24)", background: "rgba(16,185,129,0.1)", color: "#6ee7b7", borderRadius: 8, padding: 14, fontWeight: 900 }}>
 Alles op orde ✓
 </div>
 ) : (
 <div style={{ display: "grid", gap: 10 }}>
 {tasks.map((task) => {
 const color = task.tone === "red" ? "#f87171" : task.tone === "amber" ? "#fbbf24" : "#60a5fa";
 return (
 <Link href={task.href} className="task-link" key={task.title}>
 <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
 <span style={{ width: 8, height: 8, borderRadius: 999, marginTop: 5, background: color, boxShadow: `0 0 16px ${color}` }} />
 <span>
 <span style={{ display: "block", color: "#f8fafc", fontSize: 14, fontWeight: 900 }}>{task.title}</span>
 <span style={{ display: "block", color: "#94a3b8", fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>{task.detail}</span>
 </span>
 </div>
 </Link>
 );
 })}
 </div>
 )}
 </section>

 <section style={{ ...cardStyle, padding: 18 }}>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Account</h2>
 <div style={{ display: "grid", gap: 12, marginTop: 16, fontSize: 13 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span style={{ color: "#64748b" }}>Bedrijf</span><strong>{profile?.company_name || "Niet ingevuld"}</strong></div>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span style={{ color: "#64748b" }}>Plan</span><strong style={{ textTransform: "capitalize" }}>{isFree ? "Gratis" : profile?.plan}</strong></div>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span style={{ color: "#64748b" }}>Profiel</span><strong style={{ color: completeProfile ? "#34d399" : "#fbbf24" }}>{completeProfile ? "Compleet" : "Aanvullen"}</strong></div>
 </div>
 </section>
 </aside>
 </div>
 </div>
 </main>
 );
}
