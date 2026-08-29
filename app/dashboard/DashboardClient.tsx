"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BellRing, CheckCircle2, ExternalLink, FilePlus2, Filter, KeyRound, Search, UsersRound, XCircle } from "lucide-react";
import { C } from "@/lib/constants";
import { buildInvoicePreviewFromPayload, validateStoredInvoiceConsistency, type InvoicePreview } from "@/lib/invoice-preview";
import { buildRecommandPayloadFromUbl } from "@/lib/ubl-to-recommand";
import { InvoiceConfirmation } from "@/app/components/InvoiceConfirmation";

export type Profile = {
 email?: string | null;
 company_name?: string | null;
 full_name?: string | null;
 plan?: string | null;
 credits?: number | null;
 send_credits?: number | null;
 send_credits_expires_at?: string | null;
 onboarding_complete?: boolean | null;
 kvk_number?: string | null;
 kvk_kbo?: string | null;
 kbo_number?: string | null;
 btw_number?: string | null;
 btw_nr?: string | null;
 address?: string | null;
 postal_code?: string | null;
 city?: string | null;
 iban?: string | null;
 recommand_company_id?: string | null;
 recommand_verified?: boolean | null;
 recommand_verification_url?: string | null;
};

export type Conversion = {
 id?: string | null;
 filename?: string | null;
 source_pdf_filename?: string | null;
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

export type BillingInvoice = {
 id?: string | null;
 invoice_number?: string | null;
 invoice_date?: string | null;
 issued_at?: string | null;
 currency?: string | null;
 total_incl?: number | string | null;
 amount?: number | string | null;
 invoice_kind?: string | null;
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
  done: { label: "UBL gegenereerd", bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.24)", group: "ubl_gegenereerd" },
 sent: { label: "Verzonden, wacht op bevestiging", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)", group: "klaar" },
 delivered: { label: "Verzonden, wacht op bevestiging", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)", group: "klaar" },
 sending: { label: "Verzenden...", bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.22)", group: "in_behandeling" },
 as4_received: { label: "Afgeleverd", bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.24)", group: "afgeleverd" },
 send_failed: { label: "Verzenden mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)", group: "mislukt" },
 recipient_not_found: { label: "Verzenden mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)", group: "mislukt" },
 invoice_not_supported: { label: "Verzenden mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)", group: "mislukt" },
 failed: { label: "Verzenden mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)", group: "mislukt" },
 error: { label: "Mislukt", bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.24)", group: "mislukt" },
 duplicate_voided: { label: "Vervallen (dubbel)", bg: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "rgba(148,163,184,0.18)", group: "gearchiveerd" },
};

const generatedStatuses = ["done"];
const openStatuses = ["draft", "concept", "processing", "sent", "delivered"];
const failedStatuses = ["failed", "error", "mislukt", "send_failed", "recipient_not_found", "invoice_not_supported", "verzendfout"];
const archivedStatuses = ["duplicate_voided"];

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

const effectiveStatus = (conversion: Conversion) => conversion.recommand_status || (conversion.ubl_xml ? "done" : conversion.status);
const statusGroup = (status?: string | null) => statusMap[normalizeStatus(status)].group;
const isGenerated = (status?: string | null) => generatedStatuses.includes((status || "").toLowerCase());
const isFailed = (status?: string | null) => failedStatuses.includes((status || "").toLowerCase());
const isDraft = (status?: string | null) => ["draft", "concept"].includes((status || "").toLowerCase());
const isOpen = (status?: string | null) => openStatuses.includes((status || "").toLowerCase());
const isArchived = (status?: string | null) => archivedStatuses.includes((status || "").toLowerCase());
const canSendConversion = (conversion: Conversion) => {
 const status = (conversion.recommand_status || "").toLowerCase();
 const failed = failedStatuses.includes(status);
 return Boolean(conversion.id && conversion.ubl_xml && (failed || !conversion.recommand_document_id) && !["sent", "delivered", "as4_received", "sending", "duplicate_voided"].includes(status));
};

const failureReason = (status?: string | null) => {
 const key = (status || "").toLowerCase();
 if (key === "recipient_not_found") return "Ontvanger niet gevonden op het Peppol-netwerk.";
 if (key === "invoice_not_supported") return "Ontvanger ondersteunt dit factuurtype niet.";
 if (["send_failed", "failed", "error", "verzendfout"].includes(key)) return "Controleer de factuurgegevens en probeer opnieuw.";
 return null;
};

const profileComplete = (profile: Profile | null) => {
 if (!profile) return false;
 const kvk = profile.kvk_number || profile.kvk_kbo || profile.kbo_number;
 const vat = profile.btw_number || profile.btw_nr;
 return Boolean(profile.company_name && kvk && vat && profile.address && profile.postal_code && profile.city);
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

function StatusBadge({ conversion }: { conversion: Conversion }) {
 const status = effectiveStatus(conversion);
 const item = statusMap[normalizeStatus(status)];
 const reason = isFailed(status) ? failureReason(status) : null;
 const detail = status === "as4_received" && conversion.sent_via_recommand_at
  ? `Ontvangstbevestiging op ${formatDate(conversion.sent_via_recommand_at)}`
  : reason;
 return (
 <span style={{ display: "inline-flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
  <span style={{ display: "inline-flex", alignItems: "center", minWidth: 84, justifyContent: "center", padding: "5px 9px", borderRadius: 999, background: item.bg, border: `1px solid ${item.border}`, color: item.color, fontSize: 12, fontWeight: 800 }}>
  {item.label}
  </span>
  {detail && <span style={{ color: "#64748b", fontSize: 11, maxWidth: 180 }}>{detail}</span>}
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
 billingInvoices,
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
 billingInvoices: BillingInvoice[];
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
 const [localConversions, setLocalConversions] = useState<Conversion[]>(conversions);
 const [localSendCredits, setLocalSendCredits] = useState(profile?.send_credits || 0);
 const [sendingConversionId, setSendingConversionId] = useState<string | null>(null);
 const [confirmation, setConfirmation] = useState<{ action: "send" | "download"; conversion: Conversion; preview: InvoicePreview; filename: string } | null>(null);
 const [sendActionStatus, setSendActionStatus] = useState<Record<string, string>>({});
 const [recommandCompanyId, setRecommandCompanyId] = useState(profile?.recommand_company_id || null);
 const [recommandVerified, setRecommandVerified] = useState(profile?.recommand_verified === true);
 const [recommandVerificationUrl, setRecommandVerificationUrl] = useState(profile?.recommand_verification_url || null);
 const [recommandStatus, setRecommandStatus] = useState<string | null>(null);
 const [recommandLoading, setRecommandLoading] = useState(false);

 useEffect(() => setLocalConversions(conversions), [conversions]);
 useEffect(() => setLocalSendCredits(profile?.send_credits || 0), [profile?.send_credits]);

 const now = useMemo(() => new Date(), []);
 const isFree = !profile?.plan || profile.plan === "free";
 const sendCredits = localSendCredits;
 const sendCreditsExpiresAt = profile?.send_credits_expires_at || null;
 const sendCreditsExpired = !sendCreditsExpiresAt || new Date(sendCreditsExpiresAt).getTime() <= now.getTime();
 const hasActiveSendCredits = sendCredits > 0 && !sendCreditsExpired;
 const isMonitoring = profile?.plan === "monitoring" || profile?.plan === "monitoring_accountant";
 const isMonitoringAccountant = profile?.plan === "monitoring_accountant";
 const activeConversions = useMemo(() => localConversions.filter((conversion) => !isArchived(effectiveStatus(conversion))), [localConversions]);
 const hasInvoices = activeConversions.length > 0;
 const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
 const completeProfile = profileComplete(profile);
 const currency = activeConversions.find((conversion) => conversion.currency)?.currency || "EUR";

 const invoicesThisMonth = activeConversions.filter((conversion) => conversion.created_at && new Date(conversion.created_at) >= monthStart).length;
 const openAmount = activeConversions.reduce((sum, conversion) => sum + (isOpen(effectiveStatus(conversion)) ? numberValue(conversion.total_amount) : 0), 0);
 const generatedCount = activeConversions.filter((conversion) => isGenerated(effectiveStatus(conversion))).length;
 const failedCount = activeConversions.filter((conversion) => isFailed(effectiveStatus(conversion))).length;

 const chartData = useMemo(() => {
 const formatter = new Intl.DateTimeFormat("nl-NL", { month: "short" });
 const fullFormatter = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" });
 const months = Array.from({ length: 6 }, (_, index) => {
 const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
 const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
 return { key, maand: formatter.format(date), naam: fullFormatter.format(date), omzet: 0 };
 });

 activeConversions.forEach((conversion) => {
 if (!conversion.created_at || !isGenerated(effectiveStatus(conversion))) return;
 const date = new Date(conversion.created_at);
 const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
 const month = months.find((item) => item.key === key);
 if (month) month.omzet += numberValue(conversion.total_amount);
 });

 return months;
 }, [activeConversions, now]);

 const filteredConversions = useMemo(() => {
 const term = query.trim().toLowerCase();
 return activeConversions.filter((conversion) => {
 const matchesQuery = !term
 || (conversion.customer_name || "").toLowerCase().includes(term)
 || (conversion.invoice_number || "").toLowerCase().includes(term)
 || (conversion.filename || "").toLowerCase().includes(term)
 || (conversion.source_pdf_filename || "").toLowerCase().includes(term);
 const matchesStatus = filter === "all" || statusGroup(effectiveStatus(conversion)) === filter;
 return matchesQuery && matchesStatus;
 });
 }, [activeConversions, filter, query]);

 const visibleConversions = showAll ? filteredConversions : filteredConversions.slice(0, 10);

 const downloadConversionXmlNow = (conversion: Conversion, fallbackName: string) => {
  if (!conversion.ubl_xml) return;
  const blob = new Blob([conversion.ubl_xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fallbackName.replace(/[^a-z0-9-_]/gi, "-") || "factuur"}.xml`;
  anchor.click();
  URL.revokeObjectURL(url);
 };

 const prepareConversionAction = (action: "send" | "download", conversion: Conversion, fallbackName: string) => {
  if (!conversion.id || !conversion.ubl_xml) return;
  const consistency = validateStoredInvoiceConsistency(conversion.total_amount, conversion.ubl_xml);
  if (!consistency.ok) {
   setSendActionStatus((current) => ({ ...current, [conversion.id as string]: consistency.error }));
   return;
  }
  setSendActionStatus((current) => ({ ...current, [conversion.id as string]: "" }));
  const payload = buildRecommandPayloadFromUbl(conversion.ubl_xml);
  setConfirmation({ action, conversion, filename: fallbackName, preview: buildInvoicePreviewFromPayload(payload.recipient, payload.document, payload.currency || conversion.currency || currency) });
 };

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

 async function handleDashboardSend(conversion: Conversion) {
 if (!conversion.id || !conversion.ubl_xml) return;
 if (!hasActiveSendCredits) {
  setSendActionStatus((current) => ({ ...current, [conversion.id as string]: "Geen actief verzendtegoed. Koop een verzendbundel via /prijzen." }));
  return;
 }
 if (!recommandVerified || !recommandCompanyId) {
  setSendActionStatus((current) => ({ ...current, [conversion.id as string]: "Verifieer eerst je Recommand-company via de verificatielink." }));
  return;
 }
 setSendingConversionId(conversion.id);
 setSendActionStatus((current) => ({ ...current, [conversion.id as string]: "Verzenden..." }));
 try {
  const res = await fetch("/api/recommand/send", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ conversionId: conversion.id }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
   setSendActionStatus((current) => ({ ...current, [conversion.id as string]: body.error || "Verzenden via Peppol mislukt" }));
   return;
  }
  if (typeof body.remainingCredits === "number") setLocalSendCredits(body.remainingCredits);
  const stillSending = body.status === "sending";
  setLocalConversions((current) => current.map((item) => item.id === conversion.id ? {
   ...item,
   recommand_document_id: body.documentId || item.recommand_document_id,
   recommand_status: body.status || item.recommand_status,
   sent_via_recommand_at: stillSending ? item.sent_via_recommand_at : body.sentAt || item.sent_via_recommand_at || new Date().toISOString(),
   verified_recipient: stillSending ? item.verified_recipient : true,
  } : item));
  setConfirmation(null);
  setSendActionStatus((current) => ({ ...current, [conversion.id as string]: stillSending ? body.message || "Verzending loopt nog. De status wordt zo ververst." : body.status === "as4_received" ? "Afgeleverd via Peppol." : "Verzonden; wacht op AS4-ontvangstbevestiging." }));
 } catch (error) {
  setSendActionStatus((current) => ({ ...current, [conversion.id as string]: error instanceof Error ? error.message : "Verzenden via Peppol mislukt" }));
 } finally {
  setSendingConversionId(null);
 }
 }

 async function handleRecommandCompanyCreate() {
 setRecommandLoading(true);
 setRecommandStatus("Recommand company aanmaken...");
 const res = await fetch("/api/recommand/company", { method: "POST" });
 const data = await res.json().catch(() => ({}));
 setRecommandLoading(false);
 if (!res.ok) {
 setRecommandStatus(data.error || "Peppol-verzending activeren mislukt");
 return;
 }
 setRecommandCompanyId(data.companyId || null);
 setRecommandVerified(data.isVerified === true);
 setRecommandVerificationUrl(data.verificationUrl || null);
 setRecommandStatus(data.isVerified ? "Verzenden actief." : "Company aangemaakt. Rond de verificatie af via de link.");
 }

 async function handleRecommandCompanyStatus() {
 setRecommandLoading(true);
 setRecommandStatus("Verificatiestatus controleren...");
 const res = await fetch("/api/recommand/company/status");
 const data = await res.json().catch(() => ({}));
 setRecommandLoading(false);
 if (!res.ok) {
 setRecommandStatus(data.error || "Verificatiestatus ophalen mislukt");
 return;
 }
 setRecommandCompanyId(data.companyId || recommandCompanyId);
 setRecommandVerified(data.isVerified === true);
 setRecommandVerificationUrl(data.verificationUrl || recommandVerificationUrl);
 setRecommandStatus(data.isVerified ? "Verzenden actief." : "Nog niet geverifieerd. Rond de identiteitscontrole af en probeer opnieuw.");
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
 const oldDrafts = activeConversions.filter((conversion) => isDraft(effectiveStatus(conversion)) && conversion.created_at && new Date(conversion.created_at).getTime() < threeDaysAgo).length;
 if (oldDrafts > 0) tasks.push({ title: `${oldDrafts} concept${oldDrafts === 1 ? "" : "en"} ouder dan 3 dagen`, detail: "Rond deze facturen af of verwijder ze uit je workflow.", href: "/nieuw", tone: "amber" });
 if (failedCount > 0) tasks.push({ title: `${failedCount} factuur${failedCount === 1 ? "" : "en"} mislukt`, detail: "Controleer de gegevens en genereer de UBL opnieuw.", href: "/convert", tone: "red" });
 if (!completeProfile) tasks.push({ title: "Profiel onvolledig", detail: "KvK/KBO, BTW-nummer of adres ontbreekt nog.", href: "/onboarding", tone: "blue" });
 if (!hasActiveSendCredits) tasks.push({ title: "Geen actief verzendtegoed", detail: "Koop een eenmalige verzendbundel om via Peppol te verzenden.", href: "/upgrade", tone: "blue" });
 if (isFree) tasks.push({ title: "Peppol Inbox nog niet beschikbaar", detail: "Direct ontvangen via PeppolPro is nog niet beschikbaar.", href: "/upgrade", tone: "blue" });

 const onboardingSteps = [
 { title: "Bedrijfsgegevens invullen", done: completeProfile, href: "/onboarding", cta: "Bedrijfsgegevens" },
 { title: "Eerste klant toevoegen", done: false, href: "/nieuw", cta: "Klant invoeren" },
 { title: "Eerste UBL-factuur maken", done: hasInvoices, href: "/nieuw", cta: "Factuur maken" },
 ];
 const progress = onboardingSteps.filter((step) => step.done).length;
 const activityItems = activeConversions.slice(0, 8);

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
 .kpi-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
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
 <KpiCard label="Facturen deze maand" value={String(invoicesThisMonth)} caption={`${activeConversions.length} actief in archief`} accent="#38bdf8" />
 <KpiCard label="Openstaand bedrag" value={formatCurrency(openAmount, currency)} caption="Concepten en UBL-bestanden in behandeling" accent="#f59e0b" />
 <KpiCard label="UBL gegenereerd" value={String(generatedCount)} caption={`${generatedCount} UBL-bestand${generatedCount === 1 ? "" : "en"} succesvol gegenereerd`} accent="#34d399" />
 <KpiCard label="Resterende UBL-generaties" value={isFree ? String(profile?.credits ?? 0) : "Betaald"} caption={isFree ? "Gratis starttegoed" : "Betaald plan actief"} accent="#818cf8" />
 <KpiCard label="Verzendtegoed" value={String(sendCredits)} caption={hasActiveSendCredits ? `Geldig tot ${formatDate(sendCreditsExpiresAt)}` : "Koop een verzendbundel"} accent="#22c55e" />
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

 <section id="peppol-verzending" style={{ ...cardStyle, padding: 18, marginBottom: 18 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
 <div>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Peppol-verzending activeren</h2>
 <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Maak een send-only Recommand company aan, rond bedrijfsverificatie af en koop verzendtegoed voordat je verzendt.</p>
 </div>
 {recommandVerified && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#86efac", fontSize: 13, fontWeight: 900 }}><CheckCircle2 size={16} />Bedrijf geverifieerd</span>}
 </div>
 {!recommandCompanyId ? (
 <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
 <button type="button" className="btn btn-primary" onClick={handleRecommandCompanyCreate} disabled={recommandLoading} style={{ cursor: recommandLoading ? "wait" : "pointer", opacity: recommandLoading ? 0.7 : 1 }}>Activeer verzenden</button>
 <span style={{ color: "#94a3b8", fontSize: 12 }}>Naam, KvK/KBO, btw, adres, postcode en plaats zijn verplicht.</span>
 </div>
 ) : recommandVerified ? (
 <div style={{ marginTop: 14, border: "1px solid rgba(16,185,129,0.24)", background: "rgba(16,185,129,0.10)", color: "#86efac", borderRadius: 8, padding: 14, fontSize: 13, fontWeight: 900 }}>
 Bedrijf geverifieerd voor company {recommandCompanyId}. {hasActiveSendCredits ? `${sendCredits} verzendingen beschikbaar tot ${formatDate(sendCreditsExpiresAt)}.` : "Koop nog een verzendbundel om daadwerkelijk via Peppol te verzenden."}
 </div>
 ) : (
 <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
 <div style={{ border: "1px solid rgba(245,158,11,0.28)", background: "rgba(120,53,15,0.16)", borderRadius: 8, padding: 14 }}>
 <div style={{ color: "#fbbf24", fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Company aangemaakt, verificatie nodig</div>
 {recommandVerificationUrl ? <a className="action-link" href={recommandVerificationUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open verificatielink</a> : <div style={{ color: "#94a3b8", fontSize: 12 }}>Geen verificatielink opgeslagen.</div>}
 </div>
 <button type="button" className="btn btn-primary" onClick={handleRecommandCompanyStatus} disabled={recommandLoading} style={{ width: "fit-content", cursor: recommandLoading ? "wait" : "pointer", opacity: recommandLoading ? 0.7 : 1 }}>Ik heb geverifieerd</button>
 </div>
 )}
 {recommandStatus && <div style={{ color: recommandStatus.includes("mislukt") || recommandStatus.includes("ontbreekt") ? "#fca5a5" : "#93c5fd", fontSize: 12, marginTop: 10 }}>{recommandStatus}</div>}
 </section>

 <section style={{ ...cardStyle, overflow: "hidden", marginBottom: 18 }}>
 <div style={{ padding: "18px 18px 6px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
 <div>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Facturen</h2>
 <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Facturen voor verzendbundels, monitoring-abonnementen en creditnota&apos;s</p>
 </div>
 </div>
 </div>
 {billingInvoices.length === 0 ? (
 <div style={{ padding: "22px 18px 24px", color: "#94a3b8", fontSize: 14 }}>
 Nog geen betaalfacturen beschikbaar.
 </div>
 ) : (
 <div className="table-wrap">
 <table className="invoice-table">
 <thead>
 <tr>
 <th>Nummer</th>
 <th>Datum</th>
 <th>Bedrag</th>
 <th>Type</th>
 <th>Acties</th>
 </tr>
 </thead>
 <tbody>
 {billingInvoices.map((invoice, index) => {
 const invoiceNumber = invoice.invoice_number || `Factuur ${index + 1}`;
 const amount = numberValue(invoice.total_incl ?? invoice.amount);
 return (
 <tr key={invoice.id || `${invoiceNumber}-${index}`}>
 <td style={{ color: "#f8fafc", fontWeight: 900 }}>{invoiceNumber}</td>
 <td style={{ color: "#94a3b8" }}>{formatDate(invoice.issued_at || invoice.invoice_date)}</td>
 <td style={{ color: "#f8fafc", fontWeight: 800 }}>{formatCurrency(amount, invoice.currency || "EUR")}</td>
 <td style={{ color: invoice.invoice_kind === "credit" ? "#fca5a5" : "#cbd5e1", fontWeight: 800 }}>{invoice.invoice_kind === "credit" ? "Creditnota" : invoice.invoice_kind === "credits" ? "Verzendbundel" : "Factuur"}</td>
 <td>
 {invoice.id ? <a href={`/api/invoices/${invoice.id}`} className="action-link">Download</a> : <span className="action-muted">Niet beschikbaar</span>}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </section>

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
 <td style={{ color: "#cbd5e1" }}>{conversion.customer_name || "Onbekende klant"}{conversion.source_pdf_filename ? <><br /><span style={{ color: "#64748b", fontSize: 12 }}>Bron: {conversion.source_pdf_filename}</span></> : null}</td>
 <td style={{ color: "#f8fafc", fontWeight: 800 }}>{formatCurrency(amount, conversion.currency || currency)}</td>
 <td style={{ color: "#94a3b8" }}>{formatDate(conversion.created_at)}</td>
 <td><StatusBadge conversion={conversion} /></td>
 <td>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
{conversion.ubl_xml ? <button type="button" onClick={() => prepareConversionAction("download", conversion, invoiceNumber)} className="action-link" style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>Download XML</button> : <span className="action-muted">Geen XML</span>}
 <Link href="/convert" className="action-link">Nieuwe PDF</Link>
 {canSendConversion(conversion) ? (
 <button type="button" onClick={() => prepareConversionAction("send", conversion, invoiceNumber)} disabled={sendingConversionId === conversion.id || !hasActiveSendCredits || !recommandVerified} className="action-link" style={{ background: "transparent", border: 0, padding: 0, cursor: sendingConversionId === conversion.id || !hasActiveSendCredits || !recommandVerified ? "not-allowed" : "pointer", opacity: sendingConversionId === conversion.id || !hasActiveSendCredits || !recommandVerified ? 0.55 : 1 }}>{sendingConversionId === conversion.id ? "Verzenden..." : "Verzenden"}</button>
 ) : null}
 {canSendConversion(conversion) && !hasActiveSendCredits ? <Link href="/prijzen" className="action-link">Koop verzendtegoed</Link> : null}
 {canSendConversion(conversion) && !recommandVerified && recommandVerificationUrl ? <a className="action-link" href={recommandVerificationUrl} target="_blank" rel="noreferrer">Verifieer eerst</a> : null}
 {conversion.id && sendActionStatus[conversion.id] ? <span style={{ color: sendActionStatus[conversion.id].includes("mislukt") || sendActionStatus[conversion.id].includes("Geen") || sendActionStatus[conversion.id].includes("geblokkeerd") ? "#fca5a5" : "#93c5fd", fontSize: 12, flexBasis: "100%" }}>{sendActionStatus[conversion.id]}</span> : null}
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
 const item = activityFor({ ...conversion, status: effectiveStatus(conversion) });
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
 <p style={{ margin: "0 0 14px", color: "#94a3b8", fontSize: 13, lineHeight: 1.55 }}>Bewaking van Peppol-registraties en signalen — vanaf €9/mnd.</p>
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
 {confirmation && (
<InvoiceConfirmation
 title={confirmation.action === "send" ? "Bevestig Peppol-verzending" : "Bevestig UBL-download"}
 preview={confirmation.preview}
 remainingCreditsAfterSend={confirmation.action === "send" ? Math.max(0, sendCredits - 1) : null}
 confirmLabel={confirmation.action === "send" ? "Bevestigen en verzenden" : "Downloaden"}
 busy={sendingConversionId === confirmation.conversion.id}
 onCancel={() => setConfirmation(null)}
 onConfirm={() => {
  if (confirmation.action === "download") {
   downloadConversionXmlNow(confirmation.conversion, confirmation.filename);
   setConfirmation(null);
   return;
  }
  handleDashboardSend(confirmation.conversion);
 }}
/>
)}
</main>
 );
}
