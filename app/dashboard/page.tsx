import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage({
 searchParams,
}: {
 searchParams: Promise<{ betaald?: string }>;
}) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 const params = await searchParams;

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("*")
 .eq("id", user.id)
 .single();

 const { data: conversions } = await supabase
 .from("conversions")
 .select("filename, created_at, status")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(10);

 const { data: inbox } = await supabase
 .from("inbox_messages")
 .select("sender_name, amount, status, received_at")
 .eq("user_id", user.id)
 .order("received_at", { ascending: false })
 .limit(10);

 const isFree = !profile?.plan || profile.plan === "free";

 return (
 <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", padding: "2rem" }}>
 {params.betaald === "1" && (
 <div style={{ background: "#064e3b", border: "1px solid #10b981", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem", color: "#10b981" }}>
 Betaling ontvangen. Je account is bijgewerkt.
 </div>
 )}

 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
 <div>
 <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Dashboard</h1>
 <p style={{ color: "#888", margin: "0.25rem 0 0" }}>{profile?.company_name || user.email}</p>
 </div>
 <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
 {isFree ? (
 <>
 <span style={{ background: "#1e1e2e", border: "1px solid #333", borderRadius: 20, padding: "4px 12px", fontSize: 13, color: "#aaa" }}>
 Gratis — {profile?.credits ?? 0} verzending{profile?.credits !== 1 ? "en" : ""} resterend
 </span>
 <Link href="/prijzen" style={{ background: "#6366f1", color: "#fff", padding: "8px 18px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Upgrade</Link>
 </>
 ) : (
 <span style={{ background: "#312e81", border: "1px solid #6366f1", borderRadius: 20, padding: "4px 14px", fontSize: 13, color: "#a5b4fc", textTransform: "capitalize" }}>
 {profile.plan}
 </span>
 )}
 <Link href="/nieuw" style={{ background: "#10b981", color: "#fff", padding: "8px 18px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>+ Nieuwe factuur</Link>
 </div>
 </div>

 <section style={{ marginBottom: "2.5rem" }}>
 <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#c4b5fd" }}>Gegenereerde facturen</h2>
 {!conversions?.length ? (
 <p style={{ color: "#666" }}>Nog geen facturen. <Link href="/nieuw" style={{ color: "#6366f1" }}>Maak je eerste factuur →</Link></p>
 ) : (
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
 <thead>
 <tr style={{ borderBottom: "1px solid #222", color: "#888" }}>
 <th style={{ textAlign: "left", padding: "8px 12px" }}>Bestand</th>
 <th style={{ textAlign: "left", padding: "8px 12px" }}>Datum</th>
 <th style={{ textAlign: "left", padding: "8px 12px" }}>Status</th>
 </tr>
 </thead>
 <tbody>
 {conversions.map((conversion, index) => (
 <tr key={index} style={{ borderBottom: "1px solid #1a1a2e" }}>
 <td style={{ padding: "10px 12px" }}>{conversion.filename}</td>
 <td style={{ padding: "10px 12px", color: "#888" }}>{new Date(conversion.created_at).toLocaleDateString("nl-NL")}</td>
 <td style={{ padding: "10px 12px" }}>
 <span style={{ background: "#064e3b", color: "#10b981", borderRadius: 12, padding: "2px 10px", fontSize: 12 }}>{conversion.status}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </section>

 <section>
 <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#c4b5fd" }}>Ontvangen facturen (Peppol Inbox)</h2>
 {!inbox?.length ? (
 <p style={{ color: "#666" }}>
 Nog geen ontvangen facturen.
 {isFree && <> <Link href="/prijzen" style={{ color: "#6366f1" }}>Activeer Compleet om je Peppol Inbox in te stellen →</Link></>}
 </p>
 ) : (
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
 <thead>
 <tr style={{ borderBottom: "1px solid #222", color: "#888" }}>
 <th style={{ textAlign: "left", padding: "8px 12px" }}>Van</th>
 <th style={{ textAlign: "left", padding: "8px 12px" }}>Bedrag</th>
 <th style={{ textAlign: "left", padding: "8px 12px" }}>Datum</th>
 <th style={{ textAlign: "left", padding: "8px 12px" }}>Status</th>
 </tr>
 </thead>
 <tbody>
 {inbox.map((message, index) => (
 <tr key={index} style={{ borderBottom: "1px solid #1a1a2e" }}>
 <td style={{ padding: "10px 12px" }}>{message.sender_name || "—"}</td>
 <td style={{ padding: "10px 12px" }}>{message.amount ? `€ ${Number(message.amount).toFixed(2)}` : "—"}</td>
 <td style={{ padding: "10px 12px", color: "#888" }}>{new Date(message.received_at).toLocaleDateString("nl-NL")}</td>
 <td style={{ padding: "10px 12px" }}>
 <span style={{ background: message.status === "new" ? "#1e3a5f" : "#1a1a1a", color: message.status === "new" ? "#60a5fa" : "#888", borderRadius: 12, padding: "2px 10px", fontSize: 12 }}>
 {message.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </section>
 </main>
 );
}
