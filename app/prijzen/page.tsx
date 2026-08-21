import Link from "next/link";
import GlassCard from "../../components/GlassCard";
import PlanButton from "../../components/PlanButton";
import { C } from "../../lib/constants";
import { publicPricingPlans } from "../../lib/plans";

export default function PrijzenPage() {
 return (
  <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.white }}>
   <style>{`
    .pricing-grid {
     display: grid;
     grid-template-columns: repeat(3, minmax(0, 1fr));
     gap: 18px;
    }
    @media (max-width: 980px) {
     .pricing-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
     .pricing-grid { grid-template-columns: 1fr; }
    }
   `}</style>
   <div style={{ maxWidth: 1180, margin: "0 auto", padding: "92px 24px 64px" }}>
    <Link href="/" style={{ fontSize: 13, color: C.dim, textDecoration: "none", marginBottom: 24, display: "inline-block" }}>← Terug naar home</Link>
    <div style={{ maxWidth: 760, marginBottom: 38 }}>
     <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 12, letterSpacing: 0 }}>Prijzen</h1>
     <p style={{ color: C.gray, fontSize: 17, lineHeight: 1.7 }}>
      Start gratis met UBL-generatie. Rechtstreeks via Peppol verzenden werkt met een eenmalig gekochte verzendbundel; monitoring blijft een maandabonnement.
     </p>
    </div>

    <div className="pricing-grid">
     {publicPricingPlans.map((plan) => {
      const buttonStyle = plan.highlight
       ? { background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "white" }
       : { background: "rgba(15,23,42,0.92)", color: C.white, border: "1px solid rgba(148,163,184,0.24)" };

      return (
       <GlassCard key={plan.id} style={{ padding: 24, borderColor: plan.highlight ? "rgba(59,130,246,0.42)" : undefined }}>
        <div style={{ minHeight: 68 }}>
         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>{plan.name}</h2>
          {plan.badge && <span style={{ fontSize: 12, fontWeight: 900, color: "#93c5fd", background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.24)", padding: "5px 9px", borderRadius: 999 }}>{plan.badge}</span>}
         </div>
         <p style={{ margin: 0, color: C.gray, fontSize: 14 }}>{plan.sub || plan.description}</p>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "22px 0 6px" }}>
         <span style={{ fontSize: 42, fontWeight: 900 }}>{plan.price}</span>
         <span style={{ color: C.dim, fontSize: 14 }}>{plan.period}</span>
        </div>
        <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.55, minHeight: 44 }}>{plan.description}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "22px 0", display: "grid", gap: 10 }}>
         {plan.features.map((feature) => (
          <li key={feature} style={{ display: "flex", gap: 10, color: "#cbd5e1", fontSize: 14, lineHeight: 1.55 }}><span style={{ color: "#38bdf8", fontWeight: 900 }}>✓</span><span>{feature}</span></li>
         ))}
        </ul>
        {plan.paid ? (
         <PlanButton plan={plan.id} label={plan.cta} style={{ ...buttonStyle, borderRadius: 8 }} />
        ) : (
         <Link href={plan.href} style={{ display: "block", textAlign: "center", padding: "13px 18px", borderRadius: 8, textDecoration: "none", fontWeight: 900, ...buttonStyle }}>{plan.cta}</Link>
        )}
       </GlassCard>
      );
     })}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: 32 }}>
     <GlassCard style={{ padding: 22 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Geen verzendabonnement</h2>
      <p style={{ color: C.gray, lineHeight: 1.7, margin: 0 }}>Verzendbundels betaal je één keer vooraf. Er is geen opzegging nodig en het tegoed is 12 maanden geldig.</p>
     </GlassCard>
     <GlassCard style={{ padding: 22 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Monitoring blijft maandelijks</h2>
      <p style={{ color: C.gray, lineHeight: 1.7, margin: 0 }}>Monitoring en Monitoring Accountant blijven echte maandabonnementen voor Peppol Directory-bewaking.</p>
     </GlassCard>
     <GlassCard style={{ padding: 22 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>UBL-generatie gratis testen</h2>
      <p style={{ color: C.gray, lineHeight: 1.7, margin: 0 }}>Nieuwe accounts krijgen 3 UBL-generaties. Direct verzenden vereist bedrijfsverificatie en actief verzendtegoed.</p>
     </GlassCard>
    </div>
    <p style={{ fontSize: 13, color: C.dim, textAlign: "center", margin: "28px 0 0" }}>Prijzen zijn incl. btw voor verzendbundels. Monitoringprijzen zijn maandelijkse abonnementen. Verzendtegoed is 12 maanden geldig.</p>
   </div>
  </div>
 );
}
