import type { Metadata } from "next";
import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { StructuredData } from "./_components/StructuredData";
import { pageMetadata, site } from "@/lib/monitor/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  ...pageMetadata({
    title: "Peppol-Check | Gratis Peppol ID opzoeken",
    description: "Controleer gratis via de officiële Peppol Directory of een Nederlands bedrijf vindbaar is op Peppol.",
    path: "/monitor",
  }),
};

export default function MonitorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
        <StructuredData />
        <Header />
        {children}
        <Footer />
      </>
  );
}
