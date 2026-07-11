export const C = {
 bg: "#020617",
 card: "rgba(15,23,42,0.6)",
 input: "rgba(15,23,42,0.8)",
 blue: "#3b82f6",
 cyan: "#06b6d4",
 indigo: "#6366f1",
 white: "#f8fafc",
 gray: "#94a3b8",
 dim: "#475569",
 border: "rgba(59,130,246,0.08)",
 glow: "rgba(59,130,246,0.15)",
};

export const STEPS = [
 { n: "01", icon: "📄", t: "Upload je PDF", d: "Sleep je factuur-PDF in het uploadvenster. Elk formaat, elke layout — onze AI herkent ze allemaal." },
 { n: "02", icon: "🧠", t: "AI leest alles", d: "Gemini AI extraheert automatisch alle velden: leverancier, klant, BTW-nummers, bedragen, regelomschrijvingen." },
 { n: "03", icon: "🚀", t: "Download of verzend", d: "Download UBL 2.1 XML of verzend direct via Peppol naar je klant. Klaar in seconden, niet uren." },
];

export const FEATURES = [
 { icon: "🧠", t: "AI-Powered Parsing", d: "Geen handmatig invullen. Upload je PDF en onze AI leest leverancier, klant, BTW-nummers, bedragen en regeldetails automatisch." },
 { icon: "📋", t: "UBL 2.1 Compliant", d: "Output voldoet aan EN 16931 — de Europese standaard. Geaccepteerd door elk Peppol access point." },
 { icon: "📡", t: "Peppol Verzending", d: "Verzend je e-factuur direct via het Peppol-netwerk. Geen apart access point of boekhoudpakket nodig." },
 { icon: "✅", t: "BTW-Validatie", d: "Automatische validatie van BTW-nummers via het EU VIES-systeem. Voorkom fouten vóór verzending." },
 { icon: "🇳🇱", t: "NL + BE Ready", d: "Gebouwd voor Nederlandse en Belgische ondernemers. Tweetalig, compliant met beide regelgevingen." },
 { icon: "🔐", t: "AVG/GDPR Compliant", d: "Je factuurdata wordt tijdelijk verwerkt en niet opgeslagen na conversie. Privacy by design." },
];

export const PRICING = [
 { name: "Gratis", price: "€0", period: "", sub: "Probeer het uit", features: ["3 facturen per maand", "PDF → UBL conversie", "BTW-validatie", "Download als XML"], cta: "Start gratis", hl: false },
 { name: "Pro", price: "€19", period: "/maand", sub: "Voor actieve ondernemers", features: ["50 facturen per maand", "Peppol verzending", "Factuurarchief", "Cashflow inzicht", "Priority support"], cta: "Start 14-dagen trial", hl: true },
 { name: "Accountant", price: "€99", period: "/maand", sub: "Voor kantoren", features: ["Onbeperkt facturen", "Multi-administratie", "Bulk upload", "White-label", "API access", "Dedicated support"], cta: "Contact sales", hl: false },
];

export const FAQ = [
 { q: "Wat is Peppol?", a: "Peppol is een internationaal netwerk voor het veilig uitwisselen van e-facturen. Sinds 2026 verplicht voor B2B in België, vanaf 2030 voor de hele EU." },
 { q: "Wat is UBL?", a: "UBL 2.1 is het gestandaardiseerde XML-formaat voor e-facturen. De Europese standaard (EN 16931), geaccepteerd door elk Peppol access point." },
 { q: "Moet ik als NL-ondernemer al Peppol gebruiken?", a: "Als je naar Belgische klanten factureert: ja. Voor binnenlandse NL-facturen nog niet, maar de EU-verplichting (ViDA) komt in 2030." },
 { q: "Welke PDF-facturen worden ondersteund?", a: "Alle PDF-facturen — Word-export, Excel-template, of professioneel opgemaakt. Onze AI herkent en extraheert de velden ongeacht het formaat." },
 { q: "Wat gebeurt er met mijn data?", a: "Factuurdata wordt alleen tijdelijk verwerkt en daarna verwijderd. We slaan niets op. Volledig AVG/GDPR compliant." },
 { q: "Kan ik PeppolPro koppelen aan mijn boekhoudpakket?", a: "API-toegang is beschikbaar op het Accountant-plan. Integraties met Moneybird, Exact Online en e-Boekhouden staan op de roadmap." },
];
