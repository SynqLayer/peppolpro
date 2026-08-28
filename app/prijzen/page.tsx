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
     align-items: stretch;
    }
    .pricing-card-body {
     display: flex;
     flex-direction: column;
     min-height: 454px;
    }
    .pricing-card-header {
     min-height: 88px;
    }
    .pricing-card-title-row {
     display: flex;
     align-items: flex-start;
     justify-content: space-between;
     gap: 10px;
     margin-bottom: 8px;
    }
    .pricing-badge {
     display: inline-flex;
     align-items: center;
     justify-content: center;
     flex-shrink: 0;
     font-size: 11px;
     line-height: 1;
     font-weight: 900;
     letter-spacing: 0.04em;
     text-transform: uppercase;
     color: #93c5fd;
     background: rgba(59,130,246,0.14);
     border: 1px solid rgba(59,130,246,0.32);
     padding: 7px 10px;
     border-radius: 999px;
     margin-top: 1px;
     white-space: nowrap;
    }
    .pricing-card-description {
     color: ${C.gray};
     font-size: 14px;
     line-height: 1.55;
     min-height: 68px;
    }
    .pricing-feature-list {
     list-style: none;
     padding: 0;
     margin: 22px 0;
     display: grid;
     gap: 10px;
    }
    .pricing-card-cta {
     margin-top: auto;
    }
    @media (max-width: 980px) {
     .pricing-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
     .pricing-grid { grid-template-columns: 1fr; }
     .pricing-card-header { min-height: auto; }
     .pricing-card-description { min-height: auto; }
     .pricing-card-body { min-height: 454px; }
     .pricing-card-title-row { align-items: flex-start; }
     .pricing-badge { font-size: 10px; padding: 6px 9px; }
    }
   `}</style>
   <div style={{ maxWidth: 1180, margin: "0 auto", padding: "92px 24px 64px" }}>
    <Link href="/" style={{ fontSize: 13, color: C.dim, textDecoration: "none", marginBottom: 24, display: "inline-block" }}>← Terug naar home</Link>
    <div style={{ maxWidth: 760, marginBottom: 38 }}>
     <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 12, letterSpacing: 0 }}>Prijzen</h1>
     <p style={{ color: C.gray, fontSize: 17, lineHeight: 1.7 }}>
      Start gratis met eenmalig UBL-starttegoed. Rechtstreeks via Peppol verzenden werkt met een eenmalig gekochte verzendbundel; monitoring blijft een maandabonnement.
     </p>
    </div>

    <div className="pricing-grid">
     {publicPricingPlans.map((plan) => {
      const buttonStyle = { background: "rgba(15,23,42,0.92)", color: C.white, border: "1px solid rgba(148,163,184,0.24)", borderRadius: 8 };

      return (
       <GlassCard key={plan.id} highlight={plan.highlight} reveal={false} style={{ padding: 24, borderColor: plan.highlight ? "rgba(59,130,246,0.48)" : undefined }}>
        <div className="pricing-card-body">
         <div className="pricing-card-header">
          <div className="pricing-card-title-row">
           <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>{plan.name}</h2>
           {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
          </div>
          <p style={{ margin: 0, color: C.gray, fontSize: 14 }}>{plan.sub || plan.description}</p>
         </div>
         <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "22px 0 6px" }}>
          <span style={{ fontSize: 42, fontWeight: 900 }}>{plan.price}</span>
          <span style={{ color: C.dim, fontSize: 14 }}>{plan.period}</span>
         </div>
         <div style={{ color: C.dim, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>incl. btw</div>
         <p className="pricing-card-description">{plan.description}</p>
         <ul className="pricing-feature-list">
          {plan.features.map((feature) => {
           const isLimitation = feature.startsWith("Geen ");
           return (
            <li key={feature} style={{ display: "flex", gap: 10, color: "#cbd5e1", fontSize: 14, lineHeight: 1.55 }}>
             <span aria-hidden="true" style={{ color: isLimitation ? "#94a3b8" : "#38bdf8", fontWeight: 900 }}>{isLimitation ? "—" : "✓"}</span>
             <span>{feature}</span>
            </li>
           );
          })}
         </ul>
         <div className="pricing-card-cta">
          {plan.paid ? (
           <PlanButton plan={plan.id} label={plan.cta} style={buttonStyle} />
          ) : (
           <Link href={plan.href} style={{ display: "block", textAlign: "center", padding: "13px 18px", textDecoration: "none", fontWeight: 900, ...buttonStyle }}>{plan.cta}</Link>
          )}
         </div>
        </div>
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
      <p style={{ color: C.gray, lineHeight: 1.7, margin: 0 }}>Nieuwe accounts krijgen eenmalig 3 UBL-generaties bij registratie. Direct verzenden vereist bedrijfsverificatie en actief verzendtegoed.</p>
     </GlassCard>
    </div>
    <p style={{ fontSize: 13, color: C.dim, textAlign: "center", margin: "28px 0 0" }}>Alle getoonde prijzen zijn incl. btw. Monitoringprijzen zijn maandelijkse abonnementen. Verzendtegoed is 12 maanden geldig.</p>
   </div>
  </div>
 );
}
