import type { Metadata } from "next";

export const site = {
  name: "Peppol-Check",
  company: "SynqLayer",
  kvk: "42041391",
  city: "Waddinxveen",
  email: "info@synqlayer.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://peppolpro.nl",
  description: "Gratis Peppol-check voor Nederlandse bedrijven via de officiële Peppol Directory.",
};

export function canonical(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, site.url).toString();
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = canonical(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: `${site.name} by ${site.company}`,
      locale: "nl_NL",
      type: "website",
      images: [{ url: "/monitor/opengraph-image", width: 1200, height: 630, alt: "Peppol-Check van SynqLayer" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/monitor/opengraph-image"],
    },
  };
}

export const routes = [
  "/monitor",
  "/monitor/hoe-het-werkt",
  "/monitor/veelgestelde-vragen",
  "/monitor/over-ons",
  "/monitor/privacyverklaring",
  "/monitor/ben-ik-verplicht-te-e-factureren",
  "/monitor/peppol-id-opzoeken",
  "/monitor/wat-is-peppol",
  "/monitor/peppol-verplicht-boekhouder",
  "/monitor/peppol-verplicht-webshop",
  "/monitor/peppol-verplicht-zzp",
  "/monitor/peppol-niet-aangesloten-wat-nu",
  "/monitor/klanten-controleren-op-peppol",
];
