export type PlanId = "free" | "compleet" | "monitoring";

export type PlanConfig = {
 id: PlanId;
 name: string;
 price: string;
 amount: string;
 period: string;
 description: string;
 checkoutDescription: string;
 features: string[];
 cta: string;
 paid: boolean;
};

export const PLANS: Record<PlanId, PlanConfig> = {
 free: {
 id: "free",
 name: "Gratis",
 price: "€0",
 amount: "0.00",
 period: "",
 description: "Voor testen en incidenteel gebruik.",
 checkoutDescription: "PeppolPro Gratis",
 features: [
 "3 Peppol-verzendingen inbegrepen",
 "UBL-facturen genereren en downloaden",
 "Basis factuurhistorie",
 ],
 cta: "Huidig plan",
 paid: false,
 },
 compleet: {
 id: "compleet",
 name: "Compleet",
 price: "€9",
 amount: "9.00",
 period: "/maand",
 description: "Voor ondernemers die Peppol serieus gebruiken.",
 checkoutDescription: "PeppolPro Compleet €9/mnd",
 features: [
 "Onbeperkt Peppol-verzendingen",
 "Peppol Inbox actief",
 "Dashboard met omzet, historie en actiepunten",
 "7 jaar fiscaal archief",
 ],
 cta: "Upgrade naar Compleet",
 paid: true,
 },
 monitoring: {
 id: "monitoring",
 name: "Monitoring",
 price: "€19",
 amount: "19.00",
 period: "/maand",
 description: "Voor ondernemers die Peppol-registraties actief willen bewaken.",
 checkoutDescription: "PeppolPro Monitoring €19/mnd",
 features: [
 "Alles uit Compleet",
 "Monitoring targets voor KvK, btw of Peppol ID",
 "Alerts bij statuswijzigingen of fouten",
 "Monitoring-overzicht in dashboard en admin",
 ],
 cta: "Activeer Monitoring",
 paid: true,
 },
};

export const paidPlans = Object.values(PLANS).filter((plan) => plan.paid);

export function getPlan(plan: string | null | undefined) {
 return PLANS[(plan || "free") as PlanId] || PLANS.free;
}
