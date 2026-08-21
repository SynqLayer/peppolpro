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
 { n: "02", icon: "🧠", t: "AI leest alles", d: "Gemini AI extraheert automatisch alle velden: leverancier, klant, BTW-nummers, bedragen en regelomschrijvingen." },
 { n: "03", icon: "📥", t: "Download UBL", d: "Download een Peppol BIS 3.0 UBL/XML-bestand of verzend via Peppol na bedrijfsverificatie met een verzendbundel." },
];

export const FEATURES = [
 { icon: "🧠", t: "AI-Powered Parsing", d: "Geen handmatig invullen. Upload je PDF en onze AI leest leverancier, klant, BTW-nummers, bedragen en regeldetails automatisch." },
 { icon: "📋", t: "UBL 2.1 Compliant", d: "Output voldoet aan EN 16931 — de Europese standaard. Geaccepteerd door elk Peppol access point." },
 { icon: "📡", t: "Peppol-verzending", d: "Verzend via Peppol na bedrijfsverificatie met een actieve verzendbundel. UBL genereren en downloaden werkt ook zonder verzending." },
 { icon: "✅", t: "BTW-checks binnenkort", d: "Automatische BTW-validatie staat op de roadmap. Controleer BTW-nummers voorlopig zelf vóór je de UBL gebruikt." },
 { icon: "🇳🇱", t: "NL + BE Ready", d: "Gebouwd voor Nederlandse en Belgische ondernemers. Tweetalig, compliant met beide regelgevingen." },
 { icon: "🔐", t: "AVG/GDPR bewust", d: "Factuurdata wordt opgeslagen in je account voor je factuurhistorie. Je kunt opgeslagen facturen en conversies verwijderen." },
];

export const FAQ = [
 { q: "Wat is Peppol?", a: "Peppol is een internationaal netwerk voor het veilig uitwisselen van e-facturen. Sinds 2026 verplicht voor B2B in België, vanaf 2030 voor de hele EU." },
 { q: "Wat is UBL?", a: "UBL 2.1 is het gestandaardiseerde XML-formaat voor e-facturen. De Europese standaard (EN 16931), geaccepteerd door elk Peppol access point." },
 { q: "Moet ik als NL-ondernemer al Peppol gebruiken?", a: "Als je naar Belgische klanten factureert: ja. Voor binnenlandse NL-facturen nog niet, maar de EU-verplichting (ViDA) komt in 2030." },
 { q: "Welke PDF-facturen worden ondersteund?", a: "Alle PDF-facturen — Word-export, Excel-template, of professioneel opgemaakt. Onze AI herkent en extraheert de velden ongeacht het formaat." },
 { q: "Wat gebeurt er met mijn data?", a: "We slaan je factuurdata op in je account zodat je je factuurhistorie kunt terugzien, inclusief UBL, klantnaam, bedragen en e-mailadres waar nodig. Je kunt opgeslagen facturen en conversies verwijderen." },
 { q: "Kan ik PeppolPro koppelen aan mijn boekhoudpakket?", a: "API-toegang en boekhoudintegraties staan op de roadmap." },
];
