import Link from "next/link";
import { C } from "@/lib/constants";

export default function UpgradeSuccessPage() {
 return (
 <main style={{ minHeight: "100vh", background: C.bg, color: C.white, display: "grid", placeItems: "center", padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
 <section style={{ width: "100%", maxWidth: 520, borderRadius: 8, padding: 28, background: "linear-gradient(180deg, rgba(15,23,42,0.86), rgba(15,23,42,0.62))", border: "1px solid rgba(148,163,184,0.13)", boxShadow: "0 18px 60px rgba(0,0,0,0.26)", textAlign: "center" }}>
 <div style={{ width: 46, height: 46, borderRadius: 999, display: "grid", placeItems: "center", margin: "0 auto 18px", background: "rgba(16,185,129,0.14)", color: "#6ee7b7", fontWeight: 900 }}>✓</div>
 <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900 }}>Upgrade verwerkt</h1>
 <p style={{ color: "#94a3b8", lineHeight: 1.7, margin: "12px 0 24px" }}>
 Als Mollie de betaling heeft bevestigd, staat Compleet actief op je dashboard.
 </p>
 <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 40, padding: "0 16px", borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 900 }}>
 Terug naar dashboard
 </Link>
 </section>
 </main>
 );
}
