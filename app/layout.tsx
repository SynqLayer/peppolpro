import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
 metadataBase: new URL("https://peppolpro.nl"),
 title: {
 default: "PeppolPro — PDF naar Peppol BIS 3.0 UBL zonder boekhoudpakket",
 template: "%s | PeppolPro",
 },
 description: "Genereer Peppol BIS 3.0 UBL/XML uit je factuurgegevens. Download je UBL-bestand of verzend via Peppol na bedrijfsverificatie met een verzendbundel.",
 keywords: ["peppol", "e-facturatie", "ubl factuur", "peppol verplicht belgie", "pdf naar ubl", "peppol factuur versturen", "e-invoice belgie"],
 authors: [{ name: "SynqLayer", url: "https://synqlayer.com" }],
 creator: "SynqLayer",
 openGraph: {
 type: "website",
 locale: "nl_NL",
 url: "https://peppolpro.nl",
 siteName: "PeppolPro",
 title: "PeppolPro — Peppol-facturen zonder boekhoudpakket",
 description: "Genereer Peppol BIS 3.0 UBL/XML en download je bestand. Verzenden via bundels volgt binnenkort.",
 images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PeppolPro" }],
 },
 twitter: {
 card: "summary_large_image",
 title: "PeppolPro — Peppol-facturen zonder boekhoudpakket",
 description: "Genereer Peppol BIS 3.0 UBL/XML en download je bestand. Verzenden via bundels volgt binnenkort.",
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
