export type PlanId = "free" | "compleet" | "monitoring" | "monitoring_accountant";
export type CheckFrequency = "weekly" | "daily";

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
 maxTargets?: number | null;
 checkFrequency?: CheckFrequency;
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
 "3 UBL-facturen genereren en downloaden",
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
 description: "Voor ondernemers die UBL-facturen serieus gebruiken.",
 checkoutDescription: "PeppolPro Compleet €9/mnd",
 features: [
 "Onbeperkt UBL-facturen genereren en downloaden",
 "Peppol Inbox binnenkort",
 "Dashboard met omzet, historie en actiepunten",
 "7 jaar fiscaal archief",
 ],
 cta: "Upgrade naar Compleet",
 paid: true,
 },
 monitoring: {
 id: "monitoring",
 name: "Monitoring",
 price: "€9",
 amount: "9.00",
 period: "/maand",
 description: "Voor ondernemers die tot 10 Peppol-registraties wekelijks willen bewaken.",
 checkoutDescription: "PeppolPro Monitoring €9/mnd",
 features: [
 "Maximaal 10 monitoring targets",
 "Wekelijkse Peppol Directory-check",
 "Alerts bij statuswijzigingen of fouten",
 "Monitoring-overzicht in dashboard",
 ],
 cta: "Activeer Monitoring",
 paid: true,
 maxTargets: 10,
 checkFrequency: "weekly",
 },
 monitoring_accountant: {
 id: "monitoring_accountant",
 name: "Monitoring Accountant",
 price: "€39",
 amount: "39.00",
 period: "/maand",
 description: "Voor kantoren die onbeperkt Peppol-registraties dagelijks willen bewaken.",
 checkoutDescription: "PeppolPro Monitoring Accountant €39/mnd",
 features: [
 "Onbeperkt monitoring targets",
 "Dagelijkse Peppol Directory-check",
 "CSV-bulk-import voor targets",
 "Admin-overzicht met critical alerts",
 ],
 cta: "Activeer Accountant Monitoring",
 paid: true,
 maxTargets: null,
 checkFrequency: "daily",
 },
};

export const paidPlans = Object.values(PLANS).filter((plan) => plan.paid);
export const monitoringPlans = [PLANS.monitoring, PLANS.monitoring_accountant];

export function getPlan(plan: string | null | undefined) {
 return PLANS[(plan || "free") as PlanId] || PLANS.free;
}

export function isMonitoringPlan(plan: string | null | undefined) {
 return plan === "monitoring" || plan === "monitoring_accountant";
}

export function isMonitoringAccountantPlan(plan: string | null | undefined) {
 return plan === "monitoring_accountant";
}
