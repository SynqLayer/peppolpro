import Link from "next/link";

export const metadata = {
 title: "Cookiebeleid | PeppolPro",
 description: "Welke noodzakelijke cookies PeppolPro gebruikt en waarom er momenteel geen tracking-cookiebanner nodig is.",
 alternates: { canonical: "/cookiebeleid" },
};

export default function CookiebeleidPage() {
 const h2 = { fontSize: 20, fontWeight: 700 as const, marginTop: 32, marginBottom: 12, color: "#f8fafc" };
 const p = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 12 };
 const li = { fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 8 };

 return (
  <main style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
   <article style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 60px" }}>
    <Link href="/" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 13 }}>← Terug naar home</Link>
    <h1 style={{ marginTop: 20, fontSize: 32, fontWeight: 800 }}>Cookiebeleid</h1>
    <p style={{ marginTop: 8, color: "#94a3b8", fontSize: 13 }}>Laatst bijgewerkt: 17 september 2026</p>

    <h2 style={h2}>Welke cookies gebruikt PeppolPro?</h2>
    <p style={p}>PeppolPro gebruikt momenteel alleen cookies en vergelijkbare browseropslag die nodig zijn voor authenticatie, beveiliging en het uitvoeren van een door jou gekozen checkoutflow. We gebruiken geen advertentiecookies en hebben geen Google Analytics, Meta Pixel, TikTok Pixel, Hotjar of vergelijkbare marketingtracking ingebouwd.</p>

    <h2 style={h2}>Noodzakelijke categorieën</h2>
    <ul style={{ paddingLeft: 20 }}>
     <li style={li}><strong>Supabase authenticatie/PKCE:</strong> sessie- en code-verifiercookies die nodig zijn om veilig in te loggen, uit te loggen en authenticatiecallbacks af te handelen. Naam en exacte levensduur kunnen door de authenticatiebibliotheek worden bepaald.</li>
     <li style={li}><strong>peppolpro_checkout_plan:</strong> tijdelijke functionele cookie die maximaal ongeveer 1 uur onthoudt welk betaald product je koos wanneer je eerst moet inloggen of registreren. De cookie bevat alleen de productkeuze, geen factuurinhoud.</li>
    </ul>

    <h2 style={h2}>Waarom is er geen toestemmingsbanner?</h2>
    <p style={p}>Een toestemmingsbanner hoort niet te worden gebruikt om noodzakelijke cookies vrijwillig te laten lijken. Omdat PeppolPro momenteel geen niet-noodzakelijke analytics-, advertentie- of trackingcookies plaatst, tonen we geen acceptatiebanner. Noodzakelijke cookies kunnen niet worden uitgezet zonder dat de betreffende account- of checkoutfunctie niet goed werkt.</p>

    <h2 style={h2}>Als dit verandert</h2>
    <p style={p}>Als we later niet-noodzakelijke tracking of analytics toevoegen, beoordelen we vóór ingebruikname of toestemming vereist is. Waar toestemming nodig is, wordt de betreffende technologie pas geladen nadat de gebruiker een vrije keuze heeft gemaakt, met een even gemakkelijke mogelijkheid om te weigeren.</p>

    <h2 style={h2}>Zelf cookies beheren</h2>
    <p style={p}>Je kunt cookies via je browser verwijderen. Houd er rekening mee dat je hierdoor kunt worden uitgelogd en een lopende checkoutkeuze kan verdwijnen. Meer informatie over persoonsgegevens staat in de <Link href="/privacy" style={{ color: "#93c5fd" }}>privacyverklaring</Link>.</p>

    <h2 style={h2}>Contact</h2>
    <p style={p}>Vragen over cookies of privacy: privacy@synqlayer.com.</p>
   </article>
  </main>
 );
}
