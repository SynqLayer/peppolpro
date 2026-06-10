import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
 metadataBase: new URL("https://peppolpro.nl"),
 title: {
 default: "PeppolPro — Peppol-facturen versturen en ontvangen zonder boekhoudpakket",
 template: "%s | PeppolPro",
 },
 description: "Verstuur en ontvang Peppol BIS 3.0 facturen in 60 seconden. Geen boekhoudpakket nodig. Verplicht in België sinds 2026. Gratis proberen.",
 keywords: ["peppol", "e-facturatie", "ubl factuur", "peppol verplicht belgie", "pdf naar ubl", "peppol factuur versturen", "e-invoice belgie"],
 authors: [{ name: "SynqLayer", url: "https://synqlayer.com" }],
 creator: "SynqLayer",
 openGraph: {
 type: "website",
 locale: "nl_NL",
 url: "https://peppolpro.nl",
 siteName: "PeppolPro",
 title: "PeppolPro — Peppol-facturen zonder boekhoudpakket",
 description: "Verstuur en ontvang Peppol BIS 3.0 facturen in 60 seconden. Verplicht in België sinds 2026.",
 images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PeppolPro" }],
 },
 twitter: {
 card: "summary_large_image",
 title: "PeppolPro — Peppol-facturen zonder boekhoudpakket",
 description: "Verstuur en ontvang Peppol BIS 3.0 facturen in 60 seconden.",
 },
 robots: {
 index: true,
 follow: true,
 googleBot: { index: true, follow: true },
 },
 alternates: {
 canonical: "https://peppolpro.nl",
 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="nl">
 <body>{children}</body>
 </html>
 );
}
