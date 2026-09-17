"use client";
import { useState, useEffect } from "react";
import ParticleField from "../components/ParticleField";
import Reveal from "../components/Reveal";
import GlassCard from "../components/GlassCard";
import Divider from "../components/Divider";
import { C, STEPS, FEATURES, FAQ } from "../lib/constants";
import PlanButton from "../components/PlanButton";
import { publicPricingPlans } from "../lib/plans";

export default function Home() {
 const [scrollY, setScrollY] = useState(0);
 const [menuOpen, setMenuOpen] = useState(false);

 useEffect(() => {
 const s = () => setScrollY(window.scrollY);
 window.addEventListener("scroll", s, { passive: true });
 return () => window.removeEventListener("scroll", s);
 }, []);

 useEffect(() => {
 document.body.style.overflow = menuOpen ? "hidden" : "";
 return () => { document.body.style.overflow = ""; };
 }, [menuOpen]);

 const navs = [
 { id: "how", l: "Hoe werkt het" },
 { id: "features", l: "Features" },
 { id: "pricing", l: "Prijzen" },
 { id: "faq", l: "FAQ" },
 ];

 return (
 <div style={{ background: C.bg, color: C.white, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", overflowX: "hidden" }}>
 <ParticleField />

 {/* NAV */}
 <nav aria-label="Hoofdnavigatie" style={{
 position: "fixed",
 top: 0,
 left: 0,
 right: 0,
 zIndex: 1000,
 padding: "0 20px",
 background: menuOpen || scrollY > 50 ? C.bg : "transparent",
 backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
 borderBottom: scrollY > 50 ? `1px solid ${C.border}` : "none",
 transition: "all 0.4s",
 }}>
 <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 60 }}>
 <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" }} aria-label="PeppolPro home">
 <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
 <span aria-hidden="true" style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>P</span>
 </div>
 <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", color: C.white }}>Peppol<span style={{ color: C.blue }}>Pro</span></span>
 </a>

 <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="desk-nav">
 {navs.map((n) => (
 <a
 key={n.id}
 href={`#${n.id}`}
 style={{
 background: "none",
 border: "none",
 color: C.gray,
 fontSize: 13,
 fontWeight: 500,
 cursor: "pointer",
 fontFamily: "inherit",
 transition: "color 0.2s",
 padding: "6px 0",
 textDecoration: "none",
 }}
 onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
 onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.gray)}
 >
 {n.l}
 </a>
 ))}
 <a href="/login" style={{ color: C.gray, fontWeight: 600, fontSize: 15, padding: "10px 0", textDecoration: "none" }}>Inloggen</a>
 <a href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", fontWeight: 600, fontSize: 15, padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 8px 32px rgba(59,130,246,0.25)" }}>Probeer gratis</a>
 </div>

 <button
 type="button"
 onClick={() => setMenuOpen(!menuOpen)}
 className="mob-btn"
 aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
 aria-expanded={menuOpen}
 style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", display: "none" }}
 >
 <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
 </button>
 </div>
 {menuOpen && (
 <div style={{ position: "absolute", top: 60, left: 0, right: 0, zIndex: 1001, padding: "12px 20px 20px", borderTop: `1px solid ${C.border}`, background: C.bg, boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
 {navs.map((n) => (
 <a key={n.id} href={`#${n.id}`} onClick={() => setMenuOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: C.gray, fontSize: 15, padding: "10px 0", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>{n.l}</a>
 ))}
 <a href="/login" onClick={() => setMenuOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", color: C.gray, fontWeight: 700, fontSize: 15, padding: "10px 0", textDecoration: "none" }}>Inloggen</a>
 <a href="/register" onClick={() => setMenuOpen(false)} style={{ display: "block", width: "100%", textAlign: "center", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", fontWeight: 600, fontSize: 15, padding: "14px 0", borderRadius: 12, textDecoration: "none", boxShadow: "0 8px 32px rgba(59,130,246,0.25)", marginTop: "12px" }}>Probeer gratis</a>
 </div>
 )}
 </nav>
 <style>{`@media (max-width: 768px) { .desk-nav { display: none !important; } .mob-btn { display: block !important; } }`}</style>

 {/* HERO */}
 <section style={{ minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "100px 20px 60px", textAlign: "center" }}>
 <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, background: `radial-gradient(circle, ${C.glow}, transparent 70%)`, pointerEvents: "none", opacity: 0.5 }} />
 <div style={{ position: "relative", zIndex: 2, maxWidth: 720 }}>
 <Reveal>
 <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "7px 18px", marginBottom: 28, fontSize: 12, fontWeight: 600, color: "#93c5fd" }}>
 <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse-dot 2s infinite" }} />
 België: gestructureerde B2B e-facturatie sinds 1 januari 2026
 </div>
 </Reveal>
 <Reveal delay={0.1}>
 <h1 style={{ fontSize: "clamp(38px, 8vw, 74px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 20 }}>
 Van PDF naar{" "}
 <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.cyan}, ${C.indigo})`, backgroundSize: "200% 200%", animation: "gradient-x 4s ease infinite", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Peppol</span>
 <br />in enkele stappen
 </h1>
 </Reveal>
 <Reveal delay={0.2}>
 <p style={{ fontSize: "clamp(16px, 2.2vw, 19px)", color: C.gray, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px", fontWeight: 400 }}>
 Upload een factuur-PDF. Onze AI maakt een voorstel voor de factuurgegevens; jij controleert de inhoud. Genereer UBL/XML of verzend via Peppol na bedrijfsverificatie met een verzendbundel.
 </p>
 </Reveal>
 <Reveal delay={0.3}>
 <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
 <a href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", fontWeight: 600, fontSize: 15, padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 8px 32px rgba(59,130,246,0.25)" }}>Probeer gratis — 3 UBL-generaties →</a>
 <a href="#how" style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.2)", color: "#cbd5e1", fontWeight: 600, fontSize: 15, padding: "14px 32px", borderRadius: 12, textDecoration: "none" }}>Bekijk hoe het werkt ↓</a>
 </div>
 </Reveal>
 <Reveal delay={0.4}>
 <div style={{ marginTop: 48, display: "flex", justifyContent: "center", alignItems: "center", gap: 20, flexWrap: "wrap", fontSize: 12, color: C.gray }}>
 {["🔐 Privacybewuste verwerking", "🇳🇱 Nederlands bedrijf", "⚡ Geen installatie"].map((t, i) => (
 <span key={i}>{t}</span>
 ))}
 </div>
 </Reveal>
 </div>
 </section>

 <Divider />

 {/* HOW */}
 <section id="how" style={{ padding: "100px 20px", position: "relative", zIndex: 2 }}>
 <div style={{ maxWidth: 1000, margin: "0 auto" }}>
 <Reveal>
 <div style={{ textAlign: "center", marginBottom: 56 }}>
 <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Hoe werkt het</span>
 <h2 style={{ fontSize: "clamp(28px, 4.5vw, 46px)", fontWeight: 800, marginTop: 8, letterSpacing: "-1px" }}>Drie stappen</h2>
 </div>
 </Reveal>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
 {STEPS.map((s, i) => (
 <GlassCard key={i} delay={i * 0.1}>
 <span aria-hidden="true" style={{ fontSize: 36, display: "block", marginBottom: 12 }}>{s.icon}</span>
 <span style={{ fontSize: 11, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "#93c5fd", fontWeight: 600 }}>{s.n}</span>
 <h3 style={{ fontSize: 19, fontWeight: 700, margin: "6px 0 8px" }}>{s.t}</h3>
 <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.7 }}>{s.d}</p>
 </GlassCard>
 ))}
 </div>
 </div>
 </section>

 <Divider />

 {/* FEATURES */}
 <section id="features" style={{ padding: "100px 20px", position: "relative", zIndex: 2 }}>
 <div style={{ maxWidth: 1000, margin: "0 auto" }}>
 <Reveal>
 <div style={{ textAlign: "center", marginBottom: 56 }}>
 <span style={{ fontSize: 11, color: "#67e8f9", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Features</span>
 <h2 style={{ fontSize: "clamp(28px, 4.5vw, 46px)", fontWeight: 800, marginTop: 8, letterSpacing: "-1px" }}>Wat PeppolPro ondersteunt</h2>
 </div>
 </Reveal>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
 {FEATURES.map((f, i) => (
 <GlassCard key={i} delay={i * 0.08}>
 <span aria-hidden="true" style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{f.icon}</span>
 <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.t}</h3>
 <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.7 }}>{f.d}</p>
 </GlassCard>
 ))}
 </div>
 </div>
 </section>

 <Divider />

 {/* PRICING */}
 <section id="pricing" style={{ padding: "100px 20px", position: "relative", zIndex: 2 }}>
 <div style={{ maxWidth: 960, margin: "0 auto" }}>
 <Reveal>
 <div style={{ textAlign: "center", marginBottom: 56 }}>
 <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Prijzen</span>
 <h2 style={{ fontSize: "clamp(28px, 4.5vw, 46px)", fontWeight: 800, marginTop: 8, letterSpacing: "-1px" }}>Transparante productprijzen</h2>
 <p style={{ color: C.gray, marginTop: 10, fontSize: 15 }}>Getoonde prijzen zijn incl. btw. Peppol-verzending is beschikbaar na bedrijfsverificatie met verzendtegoed.</p>
 </div>
 </Reveal>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "start" }}>
 {publicPricingPlans.map((p, i) => (
 <GlassCard key={p.id} delay={i * 0.12} highlight={p.highlight}>
 {p.badge && (
 <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 14px", borderRadius: 100, letterSpacing: 1, textTransform: "uppercase" }}>{p.badge}</div>
 )}
 <div style={{ marginBottom: 24 }}>
 <div style={{ fontSize: 13, fontWeight: 600, color: C.gray, marginBottom: 4 }}>{p.name}</div>
 <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
 <span style={{ fontSize: 42, fontWeight: 800 }}>{p.price}</span>
 {p.period && <span style={{ fontSize: 14, color: C.gray }}>{p.period}</span>}
 </div>
 <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>incl. btw</div>
 <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{p.description}</div>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
 {p.features.map((f, j) => (
 <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.gray }}>
 <span aria-hidden="true" style={{ color: "#34d399", fontSize: 13, fontWeight: 700 }}>✓</span>{f}
 </div>
 ))}
 </div>
 {p.paid && p.available !== false ? (
 <PlanButton plan={p.id} label={p.cta} style={{ padding: "13px 0", borderRadius: 10, border: p.highlight ? "none" : `1px solid ${C.border}`, background: p.highlight ? `linear-gradient(135deg, ${C.blue}, ${C.indigo})` : "transparent", color: p.highlight ? "#fff" : C.white, fontWeight: 600 }} />
 ) : p.paid && p.available === false ? (
 <button disabled style={{ display: "block", width: "100%", padding: "13px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(100,116,139,0.18)", color: C.gray, fontWeight: 600, fontSize: 14, cursor: "not-allowed", fontFamily: "inherit", opacity: 0.8 }}>Binnenkort beschikbaar</button>
 ) : (
 <a href={p.href} style={{ display: "block", width: "100%", padding: "13px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.white, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", textDecoration: "none", textAlign: "center" as const }}>{p.cta}</a>
 )}
 </GlassCard>
 ))}
 </div>
 <p style={{ marginTop: 20, fontSize: 13, color: C.gray, textAlign: "center" }}>Betaalde producten gaan eerst naar een controlepagina. Daar zie je opnieuw de prijs, looptijd en voorwaarden voordat een Mollie-checkout kan worden gestart.</p>
 </div>
 </section>

 <Divider />

 {/* FAQ */}
 <section id="faq" style={{ padding: "100px 20px", position: "relative", zIndex: 2 }}>
 <div style={{ maxWidth: 700, margin: "0 auto" }}>
 <Reveal>
 <div style={{ textAlign: "center", marginBottom: 48 }}>
 <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>FAQ</span>
 <h2 style={{ fontSize: "clamp(28px, 4.5vw, 46px)", fontWeight: 800, marginTop: 8, letterSpacing: "-1px" }}>Veelgestelde vragen</h2>
 </div>
 </Reveal>
 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
 {FAQ.map((f, i) => (
 <GlassCard key={i} delay={i * 0.06}>
 <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.q}</h3>
 <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.7 }}>{f.a}</p>
 </GlassCard>
 ))}
 </div>
 </div>
 </section>

 <Divider />

 {/* CTA */}
 <section style={{ padding: "100px 20px", position: "relative", zIndex: 2, textAlign: "center" }}>
 <Reveal>
 <div style={{ maxWidth: 580, margin: "0 auto" }}>
 <span aria-hidden="true" style={{ fontSize: 48, display: "block", marginBottom: 20, animation: "float 5s ease-in-out infinite" }}>📄</span>
 <h2 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 12 }}>
 Klaar om te{" "}
 <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>starten</span>?
 </h2>
 <p style={{ fontSize: 17, color: C.gray, marginBottom: 32 }}>Nieuwe zakelijke accounts krijgen eenmalig 3 gratis UBL-generaties bij registratie. Geen creditcard nodig voor het gratis account.</p>
 <a href="/register" style={{ display: "inline-block", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", fontWeight: 600, fontSize: 15, padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 8px 32px rgba(59,130,246,0.25)" }}>Start gratis →</a>
 </div>
 </Reveal>
 </section>

 {/* FOOTER */}
 <footer style={{ borderTop: `1px solid ${C.border}`, padding: "40px 20px", position: "relative", zIndex: 2 }}>
 <div style={{ maxWidth: 1000, margin: "0 auto" }}>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, marginBottom: 32 }}>
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
 <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, display: "flex", alignItems: "center", justifyContent: "center" }}><span aria-hidden="true" style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>P</span></div>
 <span style={{ fontSize: 15, fontWeight: 800 }}>Peppol<span style={{ color: C.blue }}>Pro</span></span>
 </div>
 <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, maxWidth: 290 }}>Een product van SynqLayer, De Akker 39, 2743 DR Waddinxveen. info@synqlayer.com</p>
 </div>
 <div>
 <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Product</div>
 {[
  { label: "Hoe werkt het", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Prijzen", href: "/prijzen" },
  { label: "Over ons", href: "/over-ons" },
  { label: "Contact", href: "/contact" },
 ].map((l) => (
  <a key={l.label} href={l.href} style={{ display: "block", fontSize: 13, color: C.gray, padding: "4px 0", textDecoration: "none" }}>{l.label}</a>
 ))}
 </div>
 <div>
 <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Juridisch & privacy</div>
 {[
  { label: "Privacy", href: "/privacy" },
  { label: "Cookiebeleid", href: "/cookiebeleid" },
  { label: "Voorwaarden", href: "/voorwaarden" },
  { label: "Opzeggen & terugbetaling", href: "/annuleren-terugbetaling" },
  { label: "Gegevens verwijderen", href: "/privacy/verwijderen" },
  { label: "AVG/GDPR", href: "/avg-gdpr" },
 ].map((l) => (
  <a key={l.label} href={l.href} style={{ display: "block", fontSize: 13, color: C.gray, padding: "4px 0", textDecoration: "none" }}>{l.label}</a>
 ))}
 </div>
 </div>
 <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
 <span style={{ fontSize: 11, color: C.gray }}>© 2026 PeppolPro — SynqLayer. Alle rechten voorbehouden.</span>
 <span style={{ fontSize: 11, color: C.gray }}>KvK: 42041391 | BTW: NL005450830B62</span>
 </div>
 </div>
 </footer>
 </div>
 );
}
