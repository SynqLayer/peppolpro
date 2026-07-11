#!/usr/bin/env python3
import sys

full_content = '''"use client";
import { useState, useEffect, useRef, ReactNode } from "react";

const C = {
  bg: "#020617",
  card: "rgba(15,23,42,0.6)",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  white: "#f8fafc",
  gray: "#94a3b8",
  dim: "#475569",
  border: "rgba(59,130,246,0.08)",
  glow: "rgba(59,130,246,0.15)",
};

function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight * 2.5);
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.5,
      p: Math.random() * Math.PI * 2,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.p += 0.015;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 160) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${(1 - d / 160) * 0.06})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      pts.forEach((n) => {
        const g = Math.sin(n.p) * 0.4 + 0.6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${g * 0.3})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const rs = () => {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight * 2.5;
    };
    window.addEventListener("resize", rs);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", rs);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.7,
      }}
    />
  );
}

function Reveal({
  children,
  delay = 0,
  style = {},
}: {
  children: ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const [v, setV] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setV(true),
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? "translateY(0)" : "translateY(28px)",
        transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GlassCard({
  children,
  delay = 0,
  highlight = false,
  style = {},
}: {
  children: ReactNode;
  delay?: number;
  highlight?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Reveal delay={delay} style={style}>
      <div
        style={{
          background: highlight
            ? "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.05))"
            : C.card,
          border: `1px solid ${highlight ? "rgba(59,130,246,0.2)" : C.border}`,
          borderRadius: 16,
          padding: "32px 28px",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(20px)",
          transition: "border-color 0.3s, box-shadow 0.3s",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = highlight
            ? "rgba(59,130,246,0.35)"
            : "rgba(59,130,246,0.15)";
          e.currentTarget.style.boxShadow = `0 0 30px ${C.glow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = highlight
            ? "rgba(59,130,246,0.2)"
            : C.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {highlight && (
          <div
            style={{
              position: "absolute",
              top: -1,
              left: "10%",
              right: "10%",
              height: 1,
              background: `linear-gradient(90deg, transparent, ${C.blue}66, transparent)`,
            }}
          />
        )}
        {children}
      </div>
    </Reveal>
  );
}

const STEPS = [
  {
    n: "01",
    icon: "📄",
    t: "Upload je PDF",
    d: "Sleep je factuur-PDF in het uploadvenster. Elk formaat, elke layout — onze AI herkent ze allemaal.",
  },
  {
    n: "02",
    icon: "🧠",
    t: "AI leest alles",
    d: "Gemini AI extraheert automatisch alle velden: leverancier, klant, BTW-nummers, bedragen, regelomschrijvingen.",
  },
  {
    n: "03",
    icon: "🚀",
    t: "Download of verzend",
    d: "Download UBL 2.1 XML of verzend direct via Peppol naar je klant. Klaar in seconden, niet uren.",
  },
];

const FEATURES = [
  {
    icon: "🧠",
    t: "AI-Powered Parsing",
    d: "Geen handmatig invullen. Upload je PDF en onze AI leest leverancier, klant, BTW-nummers, bedragen en regeldetails automatisch.",
  },
  {
    icon: "📋",
    t: "UBL 2.1 Compliant",
    d: "Output voldoet aan EN 16931 — de Europese standaard. Geaccepteerd door elk Peppol access point.",
  },
  {
    icon: "📡",
    t: "Peppol Verzending",
    d: "Verzend je e-factuur direct via het Peppol-netwerk. Geen apart access point of boekhoudpakket nodig.",
  },
  {
    icon: "✅",
    t: "BTW-Validatie",
    d: "Automatische validatie van BTW-nummers via het EU VIES-systeem. Voorkom fouten vóór verzending.",
  },
  {
    icon: "🇳🇱",
    t: "NL + BE Ready",
    d: "Gebouwd voor Nederlandse en Belgische ondernemers. Tweetalig, compliant met beide regelgevingen.",
  },
  {
    icon: "🔐",
    t: "AVG/GDPR Compliant",
    d: "Je factuurdata wordt tijdelijk verwerkt en niet opgeslagen na conversie. Privacy by design.",
  },
];

const PRICING = [
  {
    name: "Gratis",
    price: "€0",
    period: "",
    sub: "Probeer het uit",
    features: [
      "3 facturen per maand",
      "PDF → UBL conversie",
      "BTW-validatie",
      "Download als XML",
    ],
    cta: "Start gratis",
    hl: false,
  },
  {
    name: "Pro",
    price: "€19",
    period: "/maand",
    sub: "Voor actieve ondernemers",
    features: [
      "50 facturen per maand",
      "Peppol verzending",
      "Factuurarchief",
      "Cashflow inzicht",
      "Priority support",
    ],
    cta: "Start 14-dagen trial",
    hl: true,
  },
  {
    name: "Accountant",
    price: "€99",
    period: "/maand",
    sub: "Voor kantoren",
    features: [
      "Onbeperkt facturen",
      "Multi-administratie",
      "Bulk upload",
      "White-label",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact sales",
    hl: false,
  },
];

const FAQ = [
  {
    q: "Wat is Peppol?",
    a: "Peppol is een internationaal netwerk voor het veilig uitwisselen van e-facturen. Sinds 2026 verplicht voor B2B in België, vanaf 2030 voor de hele EU.",
  },
  {
    q: "Wat is UBL?",
    a: "UBL 2.1 is het gestandaardiseerde XML-formaat voor e-facturen. De Europese standaard (EN 16931), geaccepteerd door elk Peppol access point.",
  },
  {
    q: "Moet ik als NL-ondernemer al Peppol gebruiken?",
    a: "Als je naar Belgische klanten factureert: ja. Voor binnenlandse NL-facturen nog niet, maar de EU-verplichting (ViDA) komt in 2030.",
  },
  {
    q: "Welke PDF-facturen worden ondersteund?",
    a: "Alle PDF-facturen — Word-export, Excel-template, of professioneel opgemaakt. Onze AI herkent en extraheert de velden ongeacht het formaat.",
  },
  {
    q: "Wat gebeurt er met mijn data?",
    a: "Factuurdata wordt alleen tijdelijk verwerkt en daarna verwijderd. We slaan niets op. Volledig AVG/GDPR compliant.",
  },
  {
    q: "Kan ik PeppolPro koppelen aan mijn boekhoudpakket?",
    a: "API-toegang is beschikbaar op het Accountant-plan. Integraties met Moneybird, Exact Online en e-Boekhouden staan op de roadmap.",
  },
];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const s = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", s, { passive: true });
    return () => window.removeEventListener("scroll", s);
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navs = [
    { id: "how", l: "Hoe werkt het" },
    { id: "features", l: "Features" },
    { id: "pricing", l: "Prijzen" },
    { id: "faq", l: "FAQ" },
  ];

  const Btn = ({
    primary,
    text,
    onClick,
  }: {
    primary: boolean;
    text: string;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        background: primary
          ? `linear-gradient(135deg, ${C.blue}, ${C.indigo})`
          : "transparent",
        border: primary ? "none" : "1px solid rgba(255,255,255,0.1)",
        color: primary ? "#fff" : C.gray,
        fontWeight: 600,
        fontSize: 15,
        padding: "14px 32px",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: primary ? "0 8px 32px rgba(59,130,246,0.25)" : "none",
        transition: "all 0.2s",
      }}
    >
      {text}
    </button>
  );

  const Divider = () => (
    <div
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${C.blue}15, transparent)`,
      }}
    />
  );

  return (
    <div
      style={{
        background: C.bg,
        color: C.white,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      <ParticleField />

      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 20px",
          background: scrollY > 50 ? "rgba(2,6,23,0.92)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
          borderBottom: scrollY > 50 ? `1px solid ${C.border}` : "none",
          transition: "all 0.4s",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>
                B
              </span>
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.3px",
              }}
            >
              Bill<span style={{ color: C.blue }}>zo</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 28 }}
            className="desk-nav"
          >
            {navs.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.dim,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "color 0.2s",
                  padding: "6px 0",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#fff")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = C.dim)
                }
              >
                {n.l}
              </button>
            ))}
            <Btn primary text="Probeer gratis" />
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mob-btn"
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
              display: "none",
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div
            style={{
              padding: "12px 0 20px",
              borderTop: `1px solid ${C.border}`,
            }}
          >
            {navs.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "