import GlassCard from "../../components/GlassCard";
import { C } from "../../lib/constants";

const plans = [
 {
 name: "GRATIS",
 price: "€0",
 period: "",
 features: [
 "Onbeperkt UBL-facturen genereren & downloaden",
 "3 gratis Peppol-verzendingen",
 "Peppol BIS 3.0 conform",
 ],
 cta: "Start gratis",
 href: "/login",
 highlight: false,
 },
 {
 name: "COMPLEET",
 price: "€9",
 period: "/maand",
 badge: "Populair",
 features: [
 "Verzenden én ontvangen via Peppol",
 "Tot 30 facturen per maand",
 "7 jaar fiscaal archief",
 "Peppol Inbox: ontvangen facturen in je mail",
 ],
 cta: "Kies Compleet",
 href: "/login",
 highlight: true,
 },
 {
 name: "PRO",
 price: "€19",
 period: "/maand",
 features: [
 "Alles uit Compleet, onbeperkt facturen",
 "Eigen huisstijl op PDF",
 "Betalingsherinneringen",
 ],
 cta: "Kies Pro",
 href: "/login",
 highlight: false,
 },
 {
 name: "ACCOUNTANT",
 price: "€49",
 period: "/maand",
 features: [
 "10 administraties onder één account",
 "Bulk verzenden & ontvangen",
 "Per-klant archief",
 ],
 cta: "Kies Accountant",
 href: "/login",
 highlight: false,
 },
];

export default function PrijzenPage() {
 return (
 <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.white }}>
 <style>{`
 .pricing-grid {
 display: grid;
 grid-template-columns: repeat(4, minmax(0, 1fr));
 gap: 18px;
 }
 @media (max-width: 980px) {
 .pricing-grid {
 grid-template-columns: repeat(2, minmax(0, 1fr));
 }
 }
 @media (max-width: 640px) {
 .pricing-grid {
 grid-template-columns: 1fr;
 }
 }
 `}</style>
 <div style={{ maxWidth: 1180, margin: "0 auto", padding: "92px 24px 64px" }}>
 <a href="/" style={{ fontSize: 13, color: C.dim, textDecoration: "none", marginBottom: 24, display: "inline-block" }}>← Terug naar home</a>

 <div style={{ maxWidth: 760, marginBottom: 38 }}>
 <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 12, letterSpacing: 0 }}>Prijzen</h1>
 <p style={{ fontSize: 17, color: C.gray, lineHeight: 1.7 }}>
 Kies het pakket dat past bij je factuurstroom. Start gratis, schaal op zodra verzenden, ontvangen of archiveren belangrijk wordt.
 </p>
 </div>

 <div className="pricing-grid">
 {plans.map((plan, index) => (
 <GlassCard key={plan.name} highlight={plan.highlight} delay={index * 0.08}>
 <div style={{ display: "flex", flexDirection: "column", minHeight: 410 }}>
 <div style={{ minHeight: 112 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
 <h2 style={{ fontSize: 14, color: plan.highlight ? C.blue : C.gray, fontWeight: 800, letterSpacing: 0 }}>{plan.name}</h2>
 {plan.badge && (
 <span style={{ fontSize: 11, fontWeight: 700, color: C.white, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, padding: "5px 9px", borderRadius: 999 }}>
 {plan.badge}
 </span>
 )}
 </div>
 <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
 <span style={{ fontSize: 38, fontWeight: 800 }}>{plan.price}</span>
 {plan.period && <span style={{ color: C.gray, fontSize: 14 }}>{plan.period}</span>}
 </div>
 </div>

 <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "grid", gap: 13, flex: 1 }}>
 {plan.features.map((feature) => (
 <li key={feature} style={{ display: "flex", gap: 10, color: C.gray, fontSize: 14, lineHeight: 1.55 }}>
 <span style={{ color: plan.highlight ? C.blue : C.cyan, fontWeight: 800 }}>✓</span>
 <span>{feature}</span>
 </li>
 ))}
 </ul>

 <a href={plan.href} style={{
 display: "block",
 textAlign: "center",
 textDecoration: "none",
 background: plan.highlight ? `linear-gradient(135deg, ${C.blue}, ${C.indigo})` : "transparent",
 border: plan.highlight ? "1px solid transparent" : `1px solid ${C.border}`,
 color: plan.highlight ? "#fff" : C.white,
 fontWeight: 700,
 fontSize: 14,
 padding: "12px 16px",
 borderRadius: 10,
 }}>
 {plan.cta}
 </a>
 </div>
 </GlassCard>
 ))}
 </div>

 <p style={{ fontSize: 13, color: C.dim, textAlign: "center", margin: "28px 0 38px" }}>
 Alle prijzen excl. btw. Maandelijks opzegbaar.
 </p>

 <div style={{ maxWidth: 780, margin: "0 auto" }}>
 <GlassCard>
 <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Moet ik als Nederlands bedrijf via Peppol factureren?</h2>
 <p style={{ color: C.gray, fontSize: 15, lineHeight: 1.8 }}>
 Voor Nederlandse B2B-facturen is er nog geen algemene Peppol-verplichting. Belgische klanten en overheden vragen er wel steeds vaker om,
 en België verplicht gestructureerde e-facturatie sinds 2026. PeppolPro helpt je daar alvast klaar voor te zijn zonder extra boekhoudpakket.
 </p>
 </GlassCard>
 </div>
 </div>
 </div>
 );
}
