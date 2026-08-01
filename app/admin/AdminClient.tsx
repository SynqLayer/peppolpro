/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { C } from "../../lib/constants";

interface Props {
 users: Array<Record<string, unknown>>;
 conversions: Array<Record<string, unknown>>;
 messages: Array<Record<string, unknown>>;
 payments: Array<Record<string, unknown>>;
 monitoringTargets: Array<Record<string, unknown>>;
 monitoringEvents: Array<Record<string, unknown>>;
}

type Tab = "overview" | "users" | "conversions" | "messages" | "payments" | "monitoring";

export default function AdminClient({ users, conversions, messages, payments, monitoringTargets, monitoringEvents }: Props) {
 const [tab, setTab] = useState<Tab>("overview");

 const card = (label: string, value: string | number, color: string) => (
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 20px", backdropFilter: "blur(20px)" }}>
 <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, marginBottom: 6 }}>{label}</div>
 <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
 </div>
 );

 const tabBtn = (t: typeof tab, label: string) => (
 <button onClick={() => setTab(t)} style={{
 background: tab === t ? `${C.blue}22` : "transparent",
 border: tab === t ? `1px solid ${C.blue}44` : `1px solid ${C.border}`,
 color: tab === t ? C.blue : C.dim, fontWeight: 600, fontSize: 13,
 padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
 }}>{label}</button>
 );

 const successCount = conversions.filter(c => c.status === "success").length;
 const failedCount = conversions.filter(c => c.status === "failed").length;
 const paidUsers = users.filter(u => u.plan !== "free").length;
 const newMessages = messages.filter(m => m.status === "new").length;
 const criticalAlerts = monitoringEvents.filter(event => event.severity === "critical").length;
 const lastMonitoringCheck = monitoringTargets
 .map(target => target.last_checked_at as string | null | undefined)
 .filter(Boolean)
 .sort()
 .at(-1);

 return (
 <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.white }}>
 <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
 <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 60 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
 <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.white }}>
 <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
 <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>P</span>
 </div>
 <span style={{ fontSize: 18, fontWeight: 800 }}>Peppol<span style={{ color: C.blue }}>Pro</span></span>
 </a>
 <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, background: "#f59e0b22", padding: "2px 8px", borderRadius: 4 }}>ADMIN</span>
 </div>
 <a href="/dashboard" style={{ fontSize: 13, color: C.dim, textDecoration: "none" }}>← Dashboard</a>
 </div>
 </div>

 <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
 <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Admin Panel</h1>

 {/* Stats */}
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
 {card("Gebruikers", users.length, C.blue)}
 {card("Betaald", paidUsers, "#10b981")}
 {card("Conversies", conversions.length, C.cyan)}
 {card("Geslaagd", successCount, "#10b981")}
 {card("Mislukt", failedCount, "#ef4444")}
 {card("Nieuwe berichten", newMessages, "#f59e0b")}
 {card("Monitoring targets", monitoringTargets.length, C.blue)}
 {card("Critical alerts", criticalAlerts, criticalAlerts > 0 ? "#ef4444" : "#10b981")}
 </div>

 {/* Tabs */}
 <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
 {tabBtn("overview", "Overzicht")}
 {tabBtn("users", `Gebruikers (${users.length})`)}
 {tabBtn("conversions", `Conversies (${conversions.length})`)}
 {tabBtn("messages", `Berichten (${newMessages})`)}
 {tabBtn("payments", `Betalingen (${payments.length})`)}
 {tabBtn("monitoring", `Monitoring (${monitoringTargets.length})`)}
 </div>

 {/* Tab content */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
 {tab === "users" && users.map((u, i) => {
 const user = u as any;
 return (
 <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
 <div>
 <div style={{ fontWeight: 600 }}>{user.email || "—"}</div>
 <div style={{ color: C.dim, fontSize: 12 }}>{user.company_name || "Geen bedrijf"} · {user.plan}</div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 <span style={{ color: C.dim }}>{user.credits || 0} cr</span>
 <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: user.is_admin ? "#f59e0b22" : user.onboarding_complete ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: user.is_admin ? "#f59e0b" : user.onboarding_complete ? "#10b981" : "#ef4444" }}>
 {user.is_admin ? "admin" : user.onboarding_complete ? "actief" : "onboarding"}
 </span>
 </div>
 </div>
 );
 })}

 {tab === "conversions" && conversions.map((c, i) => {
 const conv = c as any;
 return (
 <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
 <div>
 <div style={{ fontWeight: 600 }}>{conv.filename || "—"}</div>
 <div style={{ color: C.dim, fontSize: 12 }}>{conv.invoice_number || "—"} · {new Date(conv.created_at as string).toLocaleDateString("nl-NL")}</div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 {conv.total_amount && <span>{new Intl.NumberFormat("nl-NL", { style: "currency", currency: conv.currency || "EUR" }).format(Number(conv.total_amount))}</span>}
 <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: conv.status === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: conv.status === "success" ? "#10b981" : "#ef4444" }}>
 {conv.status}
 </span>
 </div>
 </div>
 );
 })}

 {tab === "messages" && messages.map((m, i) => {
 const msg = m as any;
 return (
 <div key={i} style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
 <span style={{ fontWeight: 600 }}>{msg.name || ""} ({msg.email || ""})</span>
 <span style={{ fontSize: 11, color: C.dim }}>{new Date(msg.created_at as string).toLocaleDateString("nl-NL")}</span>
 </div>
 <div style={{ color: C.dim, lineHeight: 1.6 }}>{msg.message || ""}</div>
 </div>
 );
 })}

 {tab === "payments" && payments.map((p, i) => {
 const payment = p as any;
 return (
 <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
 <div>
 <div style={{ fontWeight: 600 }}>€{payment.amount || 0} · {payment.type || "—"}</div>
 <div style={{ color: C.dim, fontSize: 12 }}>{payment.description || "—"} · {new Date(payment.created_at as string).toLocaleDateString("nl-NL")}</div>
 </div>
 <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: payment.status === "paid" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: payment.status === "paid" ? "#10b981" : "#ef4444" }}>
 {payment.status || "unknown"}
 </span>
 </div>
 );
 })}

 {tab === "overview" && (
 <div style={{ padding: 32, textAlign: "center" }}>
 <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📊</span>
 <p style={{ fontSize: 15, color: C.dim }}>Selecteer een tab hierboven om gegevens te bekijken.</p>
 {lastMonitoringCheck && <p style={{ fontSize: 13, color: C.dim }}>Laatste monitoring-check: {new Date(lastMonitoringCheck).toLocaleString("nl-NL")}</p>}
 </div>
 )}

 {tab === "monitoring" && (
 <div>
 <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.dim }}>
 Targets: {monitoringTargets.length} · Critical alerts: {criticalAlerts} · Laatste check: {lastMonitoringCheck ? new Date(lastMonitoringCheck).toLocaleString("nl-NL") : "—"}
 </div>
 {monitoringTargets.map((t, i) => {
 const target = t as any;
 return (
 <div key={target.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
 <div>
 <div style={{ fontWeight: 600 }}>{target.label || target.identifier_value || "—"}</div>
 <div style={{ color: C.dim, fontSize: 12 }}>{target.identifier_type || "—"} · {target.identifier_value || "—"}</div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 <span style={{ color: C.dim }}>{target.last_checked_at ? new Date(target.last_checked_at as string).toLocaleString("nl-NL") : "Nog niet gecheckt"}</span>
 <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: target.status === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: target.status === "error" ? "#ef4444" : "#10b981" }}>
 {target.status || "active"}
 </span>
 </div>
 </div>
 );
 })}
 {monitoringEvents.slice(0, 10).map((e, i) => {
 const event = e as any;
 return (
 <div key={event.id || `event-${i}`} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
 <div style={{ fontWeight: 600 }}>{event.event_type || "event"} · {event.severity || "info"}</div>
 <div style={{ color: C.dim, fontSize: 12 }}>{event.created_at ? new Date(event.created_at as string).toLocaleString("nl-NL") : "—"}</div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
