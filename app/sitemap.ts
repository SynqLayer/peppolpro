import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
 const base = "https://peppolpro.nl";
 const now = new Date();

 return [
 { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
 { url: `${base}/prijzen`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
 { url: `${base}/nieuw`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
 { url: `${base}/peppol-verplicht-belgie`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
 { url: `${base}/pdf-naar-ubl`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
 { url: `${base}/peppol-factuur-versturen`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
 { url: `${base}/over-ons`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
 { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
 { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
 { url: `${base}/voorwaarden`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
 ];
}
