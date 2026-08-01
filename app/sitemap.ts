import type { MetadataRoute } from "next";
import { routes as monitorRoutes, canonical } from "@/lib/monitor/site";

const rootRoutes = [
  "/",
  "/peppol-factuur-versturen",
  "/peppol-verplicht-belgie",
  "/pdf-naar-ubl",
  "/login",
  "/register",
  "/upgrade",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const root = rootRoutes.map((route) => ({
    url: canonical(route),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" as const : "monthly" as const,
    priority: route === "/" ? 1 : 0.7,
  }));

  const monitor = monitorRoutes.map((route) => ({
    url: canonical(route),
    lastModified: new Date(),
    changeFrequency: route === "/monitor" ? "weekly" as const : "monthly" as const,
    priority: route === "/monitor" ? 0.9 : 0.7,
  }));

  return [...root, ...monitor];
}
