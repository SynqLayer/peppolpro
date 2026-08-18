export type PlanId = "free" | "verzenden_25" | "verzenden_100" | "monitoring" | "monitoring_accountant";
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
 available?: boolean;
 includedSends?: number;
 extraSendPrice?: string;
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
 description: "Voor starten en incidenteel UBL-gebruik.",
 checkoutDescription: "PeppolPro Gratis",
 features: [
 "3 gratis UBL-generaties bij registratie",
 "UBL-facturen genereren en downloaden",
 "Geen Peppol-verzending inbegrepen",
 "Basis factuurhistorie",
 ],
 cta: "Huidig plan",
 paid: false,
 },
 verzenden_25: {
 id: "verzenden_25",
 name: "Verzenden 25",
 price: "€12",
 amount: "12.00",
 period: "/maand",
 description: "Voor ondernemers die maandelijks tot 25 facturen willen verzenden.",
 checkoutDescription: "PeppolPro Verzenden 25 €12/mnd",
 features: [
 "25 Peppol-verzendingen inbegrepen",
 "€0,45 per extra verzending",
 "UBL-facturen genereren en downloaden",
 "Dashboard met historie en actiepunten",
 ],
 cta: "Activeer Verzenden 25",
 paid: true,
 available: true,
 includedSends: 25,
 extraSendPrice: "0.45",
 },
 verzenden_100: {
 id: "verzenden_100",
 name: "Verzenden 100",
 price: "€39",
 amount: "39.00",
 period: "/maand",
 description: "Voor bedrijven met een hogere maandelijkse factuurstroom.",
 checkoutDescription: "PeppolPro Verzenden 100 €39/mnd",
 features: [
 "100 Peppol-verzendingen inbegrepen",
 "€0,35 per extra verzending",
 "UBL-facturen genereren en downloaden",
 "Dashboard met historie en actiepunten",
 ],
 cta: "Activeer Verzenden 100",
 paid: true,
 available: true,
 includedSends: 100,
 extraSendPrice: "0.35",
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
export const sendingPlans = [PLANS.verzenden_25, PLANS.verzenden_100];
export const monitoringPlans = [PLANS.monitoring, PLANS.monitoring_accountant];

export function getPlan(plan: string | null | undefined) {
 return PLANS[(plan || "free") as PlanId] || PLANS.free;
}

export function isSendingPlan(plan: string | null | undefined) {
 return plan === "verzenden_25" || plan === "verzenden_100";
}

export function isMonitoringPlan(plan: string | null | undefined) {
 return plan === "monitoring" || plan === "monitoring_accountant";
}

export function isMonitoringAccountantPlan(plan: string | null | undefined) {
 return plan === "monitoring_accountant";
}
