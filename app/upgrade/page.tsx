import Link from "next/link";
import PlanButton from "@/components/PlanButton";
import { C } from "@/lib/constants";
import { PLANS } from "@/lib/plans";

export default function UpgradePage() {
 const plans = [PLANS.free, PLANS.compleet];

 return (
 <main style={{ minHeight: "100vh", background: `radial-gradient(circle at 30% 0%, rgba(59,130,246,0.12), transparent 32%), ${C.bg}`, color: C.white, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
 <style>{`
 .upgrade-shell { max-width: 980px; margin: 0 auto; padding: 42px 20px 72px; }
 .plan-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
 .plan-card { border-radius: 8px; padding: 22px; background: linear-gradient(180deg, rgba(15,23,42,0.86), rgba(15,23,42,0.62)); border: 1px solid rgba(148,163,184,0.13); box-shadow: 0 18px 60px rgba(0,0,0,0.26); }
 .plan-card.highlight { border-color: rgba(59,130,246,0.42); box-shadow: 0 18px 70px rgba(59,130,246,0.18); }
 .feature-list { list-style: none; padding: 0; margin: 24px 0; display: grid; gap: 12px; }
 .back-link { color: #94a3b8; text-decoration: none; font-size: 13px; font-weight: 800; }
 @media (max-width: 760px) { .plan-grid { grid-template-columns: 1fr; } }
 `}</style>

 <div className="upgrade-shell">
 <Link href="/dashboard" className="back-link">← Terug naar dashboard</Link>
 <div style={{ maxWidth: 680, marginTop: 28, marginBottom: 28 }}>
 <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.08, fontWeight: 900 }}>Upgrade naar Compleet</h1>
 <p style={{ margin: "14px 0 0", color: "#94a3b8", fontSize: 16, lineHeight: 1.7 }}>
 Gratis is ideaal om te starten. Compleet haalt de limiet weg en activeert Peppol Inbox.
 </p>
 </div>

 <section className="plan-grid">
 {plans.map((plan) => (
 <article key={plan.id} className={`plan-card ${plan.paid ? "highlight" : ""}`}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{plan.name}</h2>
 {plan.paid && <span style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(59,130,246,0.15)", color: "#93c5fd", fontSize: 12, fontWeight: 900 }}>Aanbevolen</span>}
 </div>
 <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
 <span style={{ fontSize: 40, fontWeight: 900 }}>{plan.price}</span>
 <span style={{ color: "#64748b", fontSize: 14 }}>{plan.period}</span>
 </div>
 <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, minHeight: 45 }}>{plan.description}</p>
 <ul className="feature-list">
 {plan.features.map((feature) => (
 <li key={feature} style={{ display: "flex", gap: 10, color: "#cbd5e1", fontSize: 14, lineHeight: 1.55 }}>
 <span style={{ color: plan.paid ? "#38bdf8" : "#34d399", fontWeight: 900 }}>✓</span>
 <span>{feature}</span>
 </li>
 ))}
 </ul>
 {plan.paid ? (
 <PlanButton
 plan={plan.id}
 label={plan.cta}
 style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
 />
 ) : (
 <Link href="/dashboard" style={{ display: "block", textAlign: "center", textDecoration: "none", color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 8, padding: "12px 16px", fontSize: 14, fontWeight: 900 }}>
 {plan.cta}
 </Link>
 )}
 </article>
 ))}
 </section>
 </div>
 </main>
 );
}

