import Link from "next/link";
import PlanButton from "@/components/PlanButton";
import { C } from "@/lib/constants";
import { creditBundles, monitoringPlans, PLANS } from "@/lib/plans";

export default function UpgradePage() {
 const bundles = creditBundles;
 const monitoring = monitoringPlans;

 return (
  <main style={{ minHeight: "100vh", background: `radial-gradient(circle at 30% 0%, rgba(59,130,246,0.12), transparent 32%), ${C.bg}`, color: C.white, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
   <style>{`
    .upgrade-shell { max-width: 1280px; margin: 0 auto; padding: 42px 20px 72px; }
    .plan-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .monitoring-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .plan-card { border-radius: 8px; padding: 22px; background: linear-gradient(180deg, rgba(15,23,42,0.86), rgba(15,23,42,0.62)); border: 1px solid rgba(148,163,184,0.13); box-shadow: 0 18px 60px rgba(0,0,0,0.26); }
    .plan-card.highlight { border-color: rgba(59,130,246,0.42); box-shadow: 0 18px 70px rgba(59,130,246,0.18); }
    .feature-list { list-style: none; padding: 0; margin: 24px 0; display: grid; gap: 12px; }
    .back-link { color: #94a3b8; text-decoration: none; font-size: 13px; font-weight: 800; }
    @media (max-width: 760px) { .plan-grid, .monitoring-grid { grid-template-columns: 1fr; } }
   `}</style>

   <div className="upgrade-shell">
    <Link href="/dashboard" className="back-link">← Terug naar dashboard</Link>
    <div style={{ maxWidth: 760, marginTop: 28, marginBottom: 28 }}>
     <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.08, fontWeight: 900 }}>Koop verzendtegoed of activeer monitoring</h1>
     <p style={{ margin: "14px 0 0", color: "#94a3b8", fontSize: 16, lineHeight: 1.7 }}>
      Gratis blijft 3 UBL-generaties bij registratie. Peppol-verzending werkt met vooraf gekocht tegoed: eenmalige betaling, 12 maanden geldig, geen abonnement. Monitoring blijft een maandelijks abonnement.
     </p>
    </div>

    <section style={{ marginBottom: 28 }}>
     <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>Verzendbundels</h2>
     <div className="plan-grid">
      {bundles.map((bundle) => (
       <article key={bundle.id} className={`plan-card ${bundle.badge ? "highlight" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
         <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{bundle.name}</h3>
         {bundle.badge && <span style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(59,130,246,0.15)", color: "#93c5fd", fontSize: 12, fontWeight: 900 }}>{bundle.badge}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
         <span style={{ fontSize: 40, fontWeight: 900 }}>{bundle.price}</span>
         <span style={{ color: "#64748b", fontSize: 14 }}>{bundle.period}</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, minHeight: 45 }}>{bundle.description}</p>
        <ul className="feature-list">
         {bundle.features.map((feature) => <li key={feature} style={{ display: "flex", gap: 10, color: "#cbd5e1", fontSize: 14, lineHeight: 1.55 }}><span style={{ color: "#38bdf8", fontWeight: 900 }}>✓</span><span>{feature}</span></li>)}
        </ul>
        <PlanButton plan={bundle.id} label={bundle.cta} style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }} />
       </article>
      ))}
     </div>
    </section>

    <section>
     <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>Monitoring-abonnementen</h2>
     <div className="monitoring-grid">
      {monitoring.map((plan) => (
       <article key={plan.id} className="plan-card">
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{plan.name}</h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 14 }}>
         <span style={{ fontSize: 40, fontWeight: 900 }}>{plan.price}</span>
         <span style={{ color: "#64748b", fontSize: 14 }}>{plan.period}</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, minHeight: 45 }}>{plan.description}</p>
        <ul className="feature-list">
         {plan.features.map((feature) => <li key={feature} style={{ display: "flex", gap: 10, color: "#cbd5e1", fontSize: 14, lineHeight: 1.55 }}><span style={{ color: "#34d399", fontWeight: 900 }}>✓</span><span>{feature}</span></li>)}
        </ul>
        <PlanButton plan={plan.id} label={plan.cta} style={{ background: "#6366f1", borderRadius: 8 }} />
       </article>
      ))}
     </div>
    </section>
    <p style={{ margin: "24px 0 0", color: "#94a3b8", fontSize: 14, textAlign: "center" }}>{PLANS.free.name}: 3 UBL-generaties. Verzenden vereist bedrijfsverificatie en geldig verzendtegoed.</p>
   </div>
  </main>
 );
}
