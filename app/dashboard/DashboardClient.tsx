"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BellRing, FilePlus2, Filter, KeyRound, Search, UsersRound, XCircle } from "lucide-react";
import { C } from "@/lib/constants";

export type Profile = {
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

export type Conversion = {
 id?: string | null;
 filename?: string | null;
 status?: string | null;
 invoice_number?: string | null;
 total_amount?: number | string | null;
 currency?: string | null;
 customer_name?: string | null;
 ubl_xml?: string | null;
 created_at?: string | null;
 recommand_document_id?: string | null;
 recommand_status?: string | null;
 verified_recipient?: boolean | null;
 sent_via_recommand_at?: string | null;
};

export type InboxMessage = {
 id?: string | null;
 sender_name?: string | null;
 amount?: number | string | null;
 status?: string | null;
 received_at?: string | null;
};

export type MonitoringTarget = {
 id?: string | null;
 identifier_type?: string | null;
 identifier_value?: string | null;
 label?: string | null;
 status?: string | null;
 last_checked_at?: string | null;
 created_at?: string | null;
};

export type MonitoringEvent = {
 id?: string | null;
 event_type?: string | null;
 severity?: string | null;
 payload?: Record<string, unknown> | null;
 created_at?: string | null;
 monitoring_targets?: {
  label?: string | null;
  identifier_value?: string | null;
 } | null;
};

export type TeamMember = {
 id?: string | null;
 invite_email?: string | null;
 role?: string | null;
 invited_at?: string | null;
 accepted_at?: string | null;
 member_user_id?: string | null;
};

export type WebhookConfig = {
 id?: string | null;
 webhook_url?: string | null;
 updated_at?: string | null;
 revoked_at?: string | null;
};

export type ApiKeyRecord = {
 id?: string | null;
 key_hash?: string | null;
 created_at?: string | null;
 last_used_at?: string | null;
 revoked_at?: string | null;
};

export type SubscriptionState = {
 id?: string | null;
 subscription_status?: string | null;
 current_period_end?: string | null;
 cancel_at_period_end?: boolean | null;
 canceled_at?: string | null;
};

type Task = {
 title: string;
 detail: string;
 href: string;
 tone: "amber" | "red" | "blue";
};

const cardStyle = {
 background: "linear-gradient(180deg, rgba(15,23,42,0.86), rgba(15,23,42,0.62))",
 border: "1px solid rgba(148,163,184,0.13)",
 boxShadow: "0 18px 60px rgba(0,0,0,0.26)",
 borderRadius: 8,
} as const;

const statusMap: Record<string, { label: string; bg: string; color: string; border: string; group: string }> = {
 draft: { label: "Concept", bg: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "rgba(148,163,184,0.22)", group: "concept" },
 concept: { label: "Concept", bg: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "rgba(148,163,184,0.22)", group: "concept" },
 processing: { label: "UBL genereren", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)", group: "in_behandeling" },
 success: { label: "UBL gegenereerd", bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.24)", group: "ubl_gegenereerd" },
 done: { label: "UBL gegenereerd", bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.24)", group: "ubl_gegenereerd" },
 sent: { label: "Klaar om te verzenden", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)", group: "klaar" },
 delivered: { label: "Klaar om te verzenden", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)", group: "klaar" },
 failed: { label: "Mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)", group: "mislukt" },
 error: { label: "Mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)", group: "mislukt" },
};

const generatedStatuses = ["success", "done"];
const openStatuses = ["draft", "concept", "processing", "sent", "delivered"];
const failedStatuses = ["failed", "error", "mislukt"];

const numberValue = (value?: number | string | null) => {
 if (typeof value === "number") return value;
 if (typeof value === "string") return Number(value) || 0;
 return 0;
};

const formatCurrency = (value: number, currency = "EUR") => {
 return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(value || 0);
};

const formatDate = (value?: string | null) => {
 if (!value) return "-";
 return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

const normalizeStatus = (status?: string | null) => {
 const key = (status || "draft").toLowerCase();
 return statusMap[key] ? key : "draft";
};

const statusGroup = (status?: string | null) => statusMap[normalizeStatus(status)].group;
const isGenerated = (status?: string | null) => generatedStatuses.includes((status || "").toLowerCase());
const isFailed = (status?: string | null) => failedStatuses.includes((status || "").toLowerCase());
const isDraft = (status?: string | null) => ["draft", "concept"].includes((status || "").toLowerCase());
const isOpen = (status?: string | null) => openStatuses.includes((status || "").toLowerCase());

const profileComplete = (profile: Profile | null) => {
 if (!profile) return false;
 const kvk = profile.kvk_number || profile.kvk_kbo || profile.kbo_number;
 const vat = profile.btw_number || profile.btw_nr;
 return Boolean(profile.company_name && kvk && vat && profile.address);
};

const relativeTime = (value?: string | null) => {
 if (!value) return "zojuist";
 const diff = Date.now() - new Date(value).getTime();
 const minutes = Math.max(1, Math.floor(diff / 60000));
 if (minutes < 60) return `${minutes} min geleden`;
 const hours = Math.floor(minutes / 60);
 if (hours < 24) return `${hours} uur geleden`;
 const days = Math.floor(hours / 24);
 if (days < 30) return `${days} dag${days === 1 ? "" : "en"} geleden`;
 const months = Math.floor(days / 30);
 return `${months} maand${months === 1 ? "" : "en"} geleden`;
};

function StatusBadge({ status }: { status?: string | null }) {
 const item = statusMap[normalizeStatus(status)];
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

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
 if (!active || !payload?.length) return null;
 return (
 <div style={{ background: "#020617", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 8, padding: "9px 11px", color: "#f8fafc", boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}>
 <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{label}</div>
 <strong>{formatCurrency(Number(payload[0].value || 0))}</strong>
 </div>
 );
}

function activityFor(conversion: Conversion) {
 const group = statusGroup(conversion.status);
 if (group === "mislukt") return { label: "Mislukt", color: "#f87171", icon: XCircle };
 if (group === "ubl_gegenereerd") return { label: "UBL gegenereerd", color: "#34d399", icon: FilePlus2 };
 if (group === "klaar") return { label: "Klaar om te verzenden", color: "#60a5fa", icon: FilePlus2 };
 if (group === "in_behandeling") return { label: "UBL genereren", color: "#60a5fa", icon: FilePlus2 };
 return { label: "Aangemaakt", color: "#cbd5e1", icon: FilePlus2 };
}

export default function DashboardClient({
 user,
 profile,
 conversions,
 conversionsError,
 paid,
 monitoringTargets,
 monitoringEvents,
 teamMembers,
 webhookConfig,
 apiKeys,
 subscription,
}: {
 user: { id: string; email: string };
 profile: Profile | null;
 conversions: Conversion[];
 conversionsError?: string | null;
 paid: boolean;
 monitoringTargets: MonitoringTarget[];
 monitoringEvents: MonitoringEvent[];
 teamMembers: TeamMember[];
 webhookConfig: WebhookConfig | null;
 apiKeys: ApiKeyRecord[];
 subscription: SubscriptionState | null;
}) {
 const [query, setQuery] = useState("");
 const [filter, setFilter] = useState("all");
 const [showAll, setShowAll] = useState(false);
 const [bulkStatus, setBulkStatus] = useState<string | null>(null);
 const [activeOpsTab, setActiveOpsTab] = useState<"team" | "api">("team");
 const [inviteEmail, setInviteEmail] = useState("");
 const [webhookUrl, setWebhookUrl] = useState(webhookConfig?.webhook_url || "");
 const [webhookDisclaimerAccepted, setWebhookDisclaimerAccepted] = useState(false);
 const [opsStatus, setOpsStatus] = useState<string | null>(null);

 const isFree = !profile?.plan || profile.plan === "free";
 const isMonitoring = profile?.plan === "monitoring" || profile?.plan === "monitoring_accountant";
 const isMonitoringAccountant = profile?.plan === "monitoring_accountant";
 const hasInvoices = conversions.length > 0;
 const now = useMemo(() => new Date(), []);
 const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
 const completeProfile = profileComplete(profile);
 const currency = conversions.find((conversion) => conversion.currency)?.currency || "EUR";

 const invoicesThisMonth = conversions.filter((conversion) => conversion.created_at && new Date(conversion.created_at) >= monthStart).length;
 const openAmount = conversions.reduce((sum, conversion) => sum + (isOpen(conversion.status) ? numberValue(conversion.total_amount) : 0), 0);
 const generatedCount = conversions.filter((conversion) => isGenerated(conversion.status)).length;
 const failedCount = conversions.filter((conversion) => isFailed(conversion.status)).length;

 const chartData = useMemo(() => {
 const formatter = new Intl.DateTimeFormat("nl-NL", { month: "short" });
 const fullFormatter = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" });
 const months = Array.from({ length: 6 }, (_, index) => {
 const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
 const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
 return { key, maand: formatter.format(date), naam: fullFormatter.format(date), omzet: 0 };
 });

 conversions.forEach((conversion) => {
 if (!conversion.created_at || !isGenerated(conversion.status)) return;
 const date = new Date(conversion.created_at);
 const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
 const month = months.find((item) => item.key === key);
 if (month) month.omzet += numberValue(conversion.total_amount);
 });

 return months;
 }, [conversions, now]);

 const filteredConversions = useMemo(() => {
 const term = query.trim().toLowerCase();
 return conversions.filter((conversion) => {
 const matchesQuery = !term
 || (conversion.customer_name || "").toLowerCase().includes(term)
 || (conversion.invoice_number || "").toLowerCase().includes(term)
 || (conversion.filename || "").toLowerCase().includes(term);
 const matchesStatus = filter === "all" || statusGroup(conversion.status) === filter;
 return matchesQuery && matchesStatus;
 });
 }, [conversions, filter, query]);

 const visibleConversions = showAll ? filteredConversions : filteredConversions.slice(0, 10);

 async function handleBulkImport(event: React.ChangeEvent<HTMLInputElement>) {
 const file = event.target.files?.[0];
 if (!file) return;
 setBulkStatus("Importeren...");
 const res = await fetch("/api/monitoring/bulk-import", {
 method: "POST",
 headers: { "Content-Type": "text/csv" },
 body: await file.text(),
 });
 const data = await res.json().catch(() => ({}));
 setBulkStatus(res.ok ? `${data.imported || 0} targets geïmporteerd. Ververs het dashboard voor de actuele lijst.` : data.error || "Bulk-import mislukt");
 event.target.value = "";
 }

 async function handleInviteMember(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault();
 setOpsStatus("Uitnodiging opslaan...");
 const res = await fetch("/api/account/members", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email: inviteEmail, role: "viewer" }),
 });
 const data = await res.json().catch(() => ({}));
 setOpsStatus(res.ok ? "Uitnodiging vastgelegd. Het teamlid kan later accepteren." : data.error || "Uitnodiging mislukt");
 if (res.ok) setInviteEmail("");
 }

 async function handleWebhookSave(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault();
 setOpsStatus("Webhook opslaan...");
 const res = await fetch("/api/monitoring/webhook-config", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ webhook_url: webhookUrl, disclaimer_accepted: webhookDisclaimerAccepted }),
 });
 const data = await res.json().catch(() => ({}));
 setOpsStatus(res.ok ? "Webhook opgeslagen." : data.error || "Webhook opslaan mislukt");
 }

 async function handleSubscriptionCancel() {
 if (!window.confirm("Weet je zeker dat je het Monitoring-abonnement wilt opzeggen? Toegang blijft actief tot het einde van de huidige periode.")) return;
 setOpsStatus("Abonnement opzeggen...");
 const res = await fetch("/api/subscription/cancel", { method: "POST" });
 const data = await res.json().catch(() => ({}));
 setOpsStatus(res.ok ? `Opgezegd. Actief tot ${formatDate(data.current_period_end || subscription?.current_period_end)}.` : data.error || "Opzegging mislukt");
 }

 const subscriptionCanceledAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);
 const subscriptionPeriodEndLabel = formatDate(subscription?.current_period_end);

 const tasks: Task[] = [];
 const threeDaysAgo = now.getTime() - 3 * 24 * 60 * 60 * 1000;
 const oldDrafts = conversions.filter((conversion) => isDraft(conversion.status) && conversion.created_at && new Date(conversion.created_at).getTime() < threeDaysAgo).length;
 if (oldDrafts > 0) tasks.push({ title: `${oldDrafts} concept${oldDrafts === 1 ? "" : "en"} ouder dan 3 dagen`, detail: "Rond deze facturen af of verwijder ze uit je workflow.", href: "/nieuw", tone: "amber" });
 if (failedCount > 0) tasks.push({ title: `${failedCount} factuur${failedCount === 1 ? "" : "en"} mislukt`, detail: "Controleer de gegevens en genereer de UBL opnieuw.", href: "/convert", tone: "red" });
 if (!completeProfile) tasks.push({ title: "Profiel onvolledig", detail: "KvK/KBO, BTW-nummer of adres ontbreekt nog.", href: "/onboarding", tone: "blue" });
 if (isFree) tasks.push({ title: "Peppol Inbox nog niet beschikbaar", detail: "Direct ontvangen via PeppolPro is nog niet beschikbaar.", href: "/upgrade", tone: "blue" });

 const onboardingSteps = [
 { title: "Bedrijfsgegevens invullen", done: completeProfile, href: "/onboarding", cta: "Bedrijfsgegevens" },
 { title: "Eerste klant toevoegen", done: false, href: "/nieuw", cta: "Klant invoeren" },
 { title: "Eerste UBL-factuur maken", done: hasInvoices, href: "/nieuw", cta: "Factuur maken" },
 ];
 const progress = onboardingSteps.filter((step) => step.done).length;
 const activityItems = conversions.slice(0, 8);

 return (
 <main style={{ minHeight: "100vh", background: `radial-gradient(circle at 30% 0%, rgba(59,130,246,0.12), transparent 32%), ${C.bg}`, color: C.white, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
 <style>{`
 .dashboard-shell { max-width: 1180px; margin: 0 auto; padding: 28px 20px 64px; }
 .topbar { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
 .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
 .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 38px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 800; text-decoration: none; transition: transform .16s ease, border-color .16s ease, background .16s ease; white-space: nowrap; }
 .btn:hover { transform: translateY(-1px); }
 .btn-primary { color: #fff; background: linear-gradient(135deg, ${C.blue}, ${C.indigo}); border: 1px solid rgba(255,255,255,0.08); }
 .btn-green { color: #03120d; background: #34d399; border: 1px solid #34d399; }
 .btn-ghost { color: #cbd5e1; background: rgba(15,23,42,0.62); border: 1px solid rgba(148,163,184,0.16); }
 .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
 .content-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, .85fr); gap: 18px; align-items: start; }
 .table-tools { display: grid; grid-template-columns: minmax(220px, 1fr) 180px; gap: 10px; margin-top: 16px; width: 100%; }
 .control { display: flex; align-items: center; gap: 8px; background: rgba(2,6,23,0.38); border: 1px solid rgba(148,163,184,0.14); border-radius: 8px; padding: 0 12px; min-height: 40px; color: #94a3b8; }
 .control input, .control select { width: 100%; background: transparent; border: 0; color: #f8fafc; outline: none; font: inherit; font-size: 13px; }
 .control select option { background: #020617; color: #f8fafc; }
 .table-wrap { overflow-x: auto; }
 .invoice-table { width: 100%; border-collapse: collapse; min-width: 760px; font-size: 13px; }
 .invoice-table th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0; text-align: left; padding: 12px 16px; border-bottom: 1px solid rgba(148,163,184,0.12); }
 .invoice-table td { padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.09); vertical-align: middle; }
 .invoice-table tr:hover td { background: rgba(30,41,59,0.32); }
 .action-link { color: #93c5fd; text-decoration: none; font-size: 12px; font-weight: 800; }
 .action-muted { color: #64748b; font-size: 12px; font-weight: 800; }
 .task-link { display: block; padding: 14px; border-radius: 8px; text-decoration: none; border: 1px solid rgba(148,163,184,0.12); background: rgba(2,6,23,0.34); transition: background .16s ease, transform .16s ease; }
 .task-link:hover { background: rgba(30,41,59,0.5); transform: translateY(-1px); }
 .ops-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
 .ops-tab { border: 1px solid rgba(148,163,184,0.16); background: rgba(2,6,23,0.38); color: #94a3b8; border-radius: 8px; min-height: 38px; font-weight: 900; cursor: pointer; }
 .ops-tab-active { background: rgba(59,130,246,0.16); border-color: rgba(96,165,250,0.38); color: #bfdbfe; }
 .small-input { width: 100%; min-height: 38px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.16); background: rgba(2,6,23,0.38); color: #f8fafc; padding: 0 12px; outline: none; }
 .onboarding-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
 @media (max-width: 900px) {
 .topbar { flex-direction: column; }
 .header-actions { justify-content: flex-start; }
 .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
 .content-grid { grid-template-columns: 1fr; }
 .onboarding-grid { grid-template-columns: 1fr; }
 }
 @media (max-width: 620px) {
 .dashboard-shell { padding: 22px 14px 48px; }
 .kpi-grid { gap: 10px; }
 .table-tools { grid-template-columns: 1fr; }
 .btn { width: 100%; }
 .header-actions { width: 100%; }
 }
 `}</style>

 <div className="dashboard-shell">
 {paid && (
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
 <Link href="/upgrade" className="btn btn-primary"><ArrowUpRight size={16} />Upgrade</Link>
 <Link href="/nieuw" className="btn btn-green"><FilePlus2 size={16} />Nieuwe factuur</Link>
 </div>
 </header>

 <section className="kpi-grid">
 <KpiCard label="Facturen deze maand" value={String(invoicesThisMonth)} caption={`${conversions.length} totaal in archief`} accent="#38bdf8" />
 <KpiCard label="Openstaand bedrag" value={formatCurrency(openAmount, currency)} caption="Concepten en UBL-bestanden in behandeling" accent="#f59e0b" />
 <KpiCard label="UBL gegenereerd" value={String(generatedCount)} caption={`${generatedCount} UBL-bestand${generatedCount === 1 ? "" : "en"} succesvol gegenereerd`} accent="#34d399" />
 <KpiCard label="Resterende UBL-generaties" value={isFree ? String(profile?.credits ?? 0) : "Betaald"} caption={isFree ? "Gratis starttegoed" : "Betaald plan actief"} accent="#818cf8" />
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

 {hasInvoices && (
 <section style={{ ...cardStyle, padding: 18, marginBottom: 18 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
 <div>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Omzet per maand</h2>
 <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Laatste 6 maanden, UBL-bestanden die succesvol zijn gegenereerd</p>
 </div>
 </div>
 <div style={{ width: "100%", height: 260 }}>
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
 <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
 <XAxis dataKey="maand" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
 <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `€${value}`} width={46} />
 <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(59,130,246,0.08)" }} labelFormatter={(_, payload) => payload?.[0]?.payload?.naam || ""} />
 <Bar dataKey="omzet" fill="#38bdf8" radius={[6, 6, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </section>
 )}

 <div className="content-grid">
 <section style={{ ...cardStyle, overflow: "hidden" }}>
 <div style={{ padding: "18px 18px 6px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
 <div>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Factuurhistorie</h2>
 <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Nieuwste facturen eerst</p>
 </div>
 {filteredConversions.length > 10 && !showAll && <button onClick={() => setShowAll(true)} className="action-link" style={{ background: "transparent", border: 0, cursor: "pointer" }}>Toon alles</button>}
 {showAll && <button onClick={() => setShowAll(false)} className="action-link" style={{ background: "transparent", border: 0, cursor: "pointer" }}>Toon minder</button>}
 </div>
 {conversionsError && (
 <div style={{ marginTop: 14, border: "1px solid rgba(248,113,113,0.32)", background: "rgba(127,29,29,0.18)", color: "#fecaca", borderRadius: 8, padding: 14, fontSize: 13, fontWeight: 800, lineHeight: 1.5 }}>
 {conversionsError}
 </div>
 )}
 {hasInvoices && (
 <div className="table-tools">
 <label className="control">
 <Search size={15} />
 <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek klant of factuurnummer" />
 </label>
 <label className="control">
 <Filter size={15} />
 <select value={filter} onChange={(event) => setFilter(event.target.value)}>
 <option value="all">Alle statussen</option>
 <option value="concept">Concept</option>
<option value="in_behandeling">UBL genereren</option>
<option value="ubl_gegenereerd">UBL gegenereerd</option>
<option value="klaar">Klaar om te verzenden</option>
 <option value="mislukt">Mislukt</option>
 </select>
 </label>
 </div>
 )}
 </div>

 {!hasInvoices ? (
 <div style={{ padding: "22px 18px 24px", color: "#94a3b8", fontSize: 14 }}>
 Je factuurhistorie verschijnt hier zodra je de eerste factuur maakt.
 </div>
 ) : visibleConversions.length === 0 ? (
 <div style={{ padding: "24px 18px", color: "#94a3b8", fontSize: 14 }}>Geen facturen gevonden voor deze zoekopdracht.</div>
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
 {visibleConversions.map((conversion, index) => {
 const invoiceNumber = conversion.invoice_number || conversion.filename || `Factuur ${index + 1}`;
 const amount = numberValue(conversion.total_amount);
 return (
 <tr key={conversion.id || `${invoiceNumber}-${index}`}>
 <td style={{ color: "#f8fafc", fontWeight: 900 }}>{invoiceNumber}</td>
 <td style={{ color: "#cbd5e1" }}>{conversion.customer_name || "Onbekende klant"}</td>
 <td style={{ color: "#f8fafc", fontWeight: 800 }}>{formatCurrency(amount, conversion.currency || currency)}</td>
 <td style={{ color: "#94a3b8" }}>{formatDate(conversion.created_at)}</td>
 <td><StatusBadge status={conversion.status} /></td>
 <td>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <Link href="/dashboard" className="action-link">Bekijken</Link>
 <Link href="/convert" className="action-link">PDF</Link>
 <span className="action-muted">Direct verzenden niet beschikbaar</span>
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
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Recente activiteit</h2>
 <p style={{ margin: "6px 0 16px", color: "#64748b", fontSize: 13 }}>Gebaseerd op factuurstatus en aanmaakdatum</p>
 {activityItems.length === 0 ? (
 <div style={{ color: "#94a3b8", fontSize: 14 }}>Nog geen activiteit.</div>
 ) : (
 <div style={{ display: "grid", gap: 13 }}>
 {activityItems.map((conversion, index) => {
 const item = activityFor(conversion);
 const Icon = item.icon;
 return (
 <div key={conversion.id || index} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, alignItems: "start" }}>
 <span style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}22`, color: item.color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
 <Icon size={15} />
 </span>
 <span>
 <span style={{ display: "block", color: "#f8fafc", fontSize: 13, fontWeight: 900 }}>{item.label} · {conversion.customer_name || "Onbekende klant"}</span>
 <span style={{ display: "block", color: "#64748b", fontSize: 12, marginTop: 3 }}>{conversion.invoice_number || conversion.filename || "Factuur"} · {relativeTime(conversion.created_at)}</span>
 </span>
 </div>
 );
 })}
 </div>
 )}
 </section>

 <section style={{ ...cardStyle, padding: 18 }}>
 <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
 <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(59,130,246,0.12)", color: "#93c5fd", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><BellRing size={16} /></span>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Monitoring</h2>
 <span style={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>{isMonitoringAccountant ? "Dagelijks · onbeperkt" : isMonitoring ? "Wekelijks · max 10" : "Upgrade nodig"}</span>
 </div>
 {isMonitoring && (
 <div style={{ border: "1px solid rgba(148,163,184,0.12)", background: subscriptionCanceledAtPeriodEnd ? "rgba(245,158,11,0.10)" : "rgba(16,185,129,0.08)", borderRadius: 8, padding: 10, marginBottom: 12, color: subscriptionCanceledAtPeriodEnd ? "#fbbf24" : "#86efac", fontSize: 12, lineHeight: 1.45 }}>
 {subscriptionCanceledAtPeriodEnd ? `Opgezegd, actief tot ${subscriptionPeriodEndLabel}.` : `Abonnement actief tot ${subscriptionPeriodEndLabel}.`}
 {!subscriptionCanceledAtPeriodEnd && subscription?.id && (
 <button type="button" onClick={handleSubscriptionCancel} className="action-link" style={{ display: "block", background: "transparent", border: 0, padding: 0, marginTop: 8, cursor: "pointer" }}>Abonnement opzeggen</button>
 )}
 </div>
 )}
 {!isMonitoring ? (
 <div>
 <p style={{ margin: "0 0 14px", color: "#94a3b8", fontSize: 13, lineHeight: 1.55 }}>Bewaking van Peppol-registraties en signalen is beschikbaar in het Monitoring-plan.</p>
 <Link href="/upgrade" className="btn btn-primary">Monitoring instellen</Link>
 </div>
 ) : monitoringTargets.length === 0 ? (
 <div>
 <p style={{ margin: "0 0 14px", color: "#94a3b8", fontSize: 13, lineHeight: 1.55 }}>Monitoring is actief. Voeg je eerste target toe om checks te starten.</p>
 <Link href="/upgrade" className="btn btn-primary">Monitoring instellen</Link>
 {isMonitoringAccountant && (
 <div style={{ marginTop: 14, border: "1px dashed rgba(56,189,248,0.38)", borderRadius: 8, padding: 12, background: "rgba(14,165,233,0.08)" }}>
 <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 900, marginBottom: 8 }}>CSV-bulk-import</div>
 <p style={{ margin: "0 0 10px", color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>Upload CSV met kolommen: identifier_type,identifier_value,label.</p>
 <input type="file" accept=".csv,text/csv" onChange={handleBulkImport} style={{ color: "#cbd5e1", fontSize: 12 }} />
 {bulkStatus && <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 8 }}>{bulkStatus}</div>}
 </div>
 )}
 </div>
 ) : (
 <div style={{ display: "grid", gap: 13 }}>
 <div style={{ color: "#94a3b8", fontSize: 13 }}>{monitoringTargets.length} actieve target{monitoringTargets.length === 1 ? "" : "s"}</div>
 {monitoringTargets.slice(0, 4).map((target, index) => (
 <div key={target.id || index} style={{ border: "1px solid rgba(148,163,184,0.12)", background: "rgba(2,6,23,0.32)", borderRadius: 8, padding: 12 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#f8fafc", fontSize: 13, fontWeight: 900 }}>
 <span>{target.label || target.identifier_value || "Monitoring target"}</span>
 <span style={{ color: target.status === "error" ? "#f87171" : "#34d399" }}>{target.status || "active"}</span>
 </div>
 <div style={{ color: "#64748b", fontSize: 12, marginTop: 5 }}>Laatste check: {formatDate(target.last_checked_at)}</div>
 {isMonitoringAccountant && target.id && (
 <a href={`/api/monitoring/report/${target.id}`} className="action-link" style={{ display: "inline-flex", marginTop: 8 }}>Rapport downloaden</a>
 )}
 </div>
 ))}
 {monitoringEvents.slice(0, 3).map((event, index) => (
 <div key={event.id || index} style={{ borderLeft: `3px solid ${event.severity === "critical" ? "#ef4444" : event.severity === "warning" ? "#f59e0b" : "#38bdf8"}`, paddingLeft: 10, color: "#cbd5e1", fontSize: 12 }}>
 {(event.monitoring_targets?.label || event.monitoring_targets?.identifier_value || "Target")} · {event.event_type || "event"} · {formatDate(event.created_at)}
 </div>
 ))}
 {isMonitoringAccountant && (
 <div style={{ border: "1px dashed rgba(56,189,248,0.38)", borderRadius: 8, padding: 12, background: "rgba(14,165,233,0.08)" }}>
 <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 900, marginBottom: 8 }}>CSV-bulk-import</div>
 <p style={{ margin: "0 0 10px", color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>Upload CSV met kolommen: identifier_type,identifier_value,label.</p>
 <input type="file" accept=".csv,text/csv" onChange={handleBulkImport} style={{ color: "#cbd5e1", fontSize: 12 }} />
 {bulkStatus && <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 8 }}>{bulkStatus}</div>}
 </div>
 )}
 </div>
 )}
 </section>

 <section style={{ ...cardStyle, padding: 18 }}>
 <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
 <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(59,130,246,0.12)", color: "#93c5fd", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
 {activeOpsTab === "team" ? <UsersRound size={16} /> : <KeyRound size={16} />}
 </span>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{!isMonitoring ? "Upgrade nodig" : activeOpsTab === "team" ? "Team" : "API & Webhooks"}</h2>
 </div>
 {!isMonitoring ? (
 <div>
 <p style={{ margin: "0 0 14px", color: "#94a3b8", fontSize: 13, lineHeight: 1.55 }}>Team en API & Webhooks zijn beschikbaar in het Monitoring-plan.</p>
 <Link href="/upgrade" className="btn btn-primary">Upgrade naar Monitoring</Link>
 </div>
 ) : (
 <>
 <div className="ops-tabs">
 <button type="button" className={`ops-tab ${activeOpsTab === "team" ? "ops-tab-active" : ""}`} onClick={() => setActiveOpsTab("team")}>Team</button>
 <button type="button" className={`ops-tab ${activeOpsTab === "api" ? "ops-tab-active" : ""}`} onClick={() => setActiveOpsTab("api")}>API & Webhooks</button>
 </div>
 {activeOpsTab === "team" ? (
 <div style={{ display: "grid", gap: 12 }}>
 <form onSubmit={handleInviteMember} style={{ display: "grid", gap: 8 }}>
 <input className="small-input" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teamlid@example.nl" />
 <button className="btn btn-primary" type="submit">Uitnodiging vastleggen</button>
 </form>
 {teamMembers.length === 0 ? (
 <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>Nog geen teamleden of pending invites.</p>
 ) : teamMembers.slice(0, 5).map((member) => (
 <div key={member.id || member.invite_email || "member"} style={{ border: "1px solid rgba(148,163,184,0.12)", background: "rgba(2,6,23,0.32)", borderRadius: 8, padding: 12 }}>
 <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 900 }}>{member.invite_email || member.member_user_id || "Teamlid"}</div>
 <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{member.accepted_at ? "Geaccepteerd" : "Pending invite"} · {member.role || "viewer"}</div>
 </div>
 ))}
 </div>
 ) : (
 <div style={{ display: "grid", gap: 12 }}>
 <form onSubmit={handleWebhookSave} style={{ display: "grid", gap: 8 }}>
 <input className="small-input" type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://example.nl/webhooks/peppolpro" />
 <label style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 8, alignItems: "start", border: "1px solid rgba(248,113,113,0.28)", background: "rgba(127,29,29,0.16)", borderRadius: 8, padding: 10, color: "#fecaca", fontSize: 12, lineHeight: 1.5 }}>
 <input type="checkbox" checked={webhookDisclaimerAccepted} onChange={(event) => setWebhookDisclaimerAccepted(event.target.checked)} style={{ marginTop: 3 }} />
 <span>U bent zelf verantwoordelijk voor de beveiliging van dit eindpunt. SynqLayer is niet aansprakelijk voor wat er met de doorgestuurde data gebeurt nadat deze uw eigen systeem bereikt.</span>
 </label>
 <button className="btn btn-primary" type="submit" disabled={!webhookDisclaimerAccepted} style={{ opacity: webhookDisclaimerAccepted ? 1 : 0.55, cursor: webhookDisclaimerAccepted ? "pointer" : "not-allowed" }}>Webhook opslaan</button>
 </form>
 <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>Warning/critical monitoring-events worden als JSON POST verzonden naar deze URL.</div>
 <div style={{ border: "1px solid rgba(148,163,184,0.12)", background: "rgba(2,6,23,0.32)", borderRadius: 8, padding: 12 }}>
 <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 900 }}>API-keys</div>
 <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{apiKeys.filter((key) => !key.revoked_at).length} actieve key{apiKeys.filter((key) => !key.revoked_at).length === 1 ? "" : "s"}. Keys worden alleen gehasht opgeslagen.</div>
 </div>
 </div>
 )}
 </>
 )}
 {opsStatus && <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 10 }}>{opsStatus}</div>}
 </section>

 </aside>
 </div>
 </div>
 </main>
 );
}
