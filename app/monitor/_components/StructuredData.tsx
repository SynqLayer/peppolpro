import { site, canonical } from "@/lib/monitor/site";

export function StructuredData() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.company,
      url: site.url,
      email: site.email,
      address: { "@type": "PostalAddress", addressLocality: site.city, addressCountry: "NL" },
      identifier: { "@type": "PropertyValue", propertyID: "KvK", value: site.kvk },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: site.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: canonical("/"),
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher: { "@type": "Organization", name: site.company },
      description: site.description,
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
