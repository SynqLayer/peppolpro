export type PlanId = "free" | "monitoring" | "monitoring_accountant";
export type CreditBundleId = "send_credits_10" | "send_credits_25" | "send_credits_50";
export type CheckoutProductId = PlanId | CreditBundleId;
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
 recurring: boolean;
 available?: boolean;
 maxTargets?: number | null;
 checkFrequency?: CheckFrequency;
 badge?: string;
};

export type CreditBundleConfig = {
 id: CreditBundleId;
 name: string;
 price: string;
 amount: string;
 period: string;
 description: string;
 checkoutDescription: string;
 features: string[];
 cta: string;
 paid: true;
 recurring: false;
 available?: boolean;
 credits: number;
 validMonths: number;
 badge?: string;
};

export type PublicPricingPlan = (PlanConfig | CreditBundleConfig) & {
 href: string;
 highlight: boolean;
 sub?: string;
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
  cta: "Start gratis",
  paid: false,
  recurring: false,
  available: true,
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
  recurring: true,
  available: true,
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
  recurring: true,
  available: true,
  maxTargets: null,
  checkFrequency: "daily",
 },
};

export const CREDIT_BUNDLES: Record<CreditBundleId, CreditBundleConfig> = {
 send_credits_10: {
  id: "send_credits_10",
  name: "10 verzendingen",
  price: "€9",
  amount: "9.00",
  period: "eenmalig",
  description: "Voor incidentele Peppol-verzendingen zonder abonnement.",
  checkoutDescription: "PeppolPro verzendbundel 10 credits",
  features: [
   "10 Peppol-verzendingen",
   "12 maanden geldig vanaf aankoop",
   "Eenmalige betaling, geen incasso",
   "iDEAL beschikbaar bij eenmalige betaling",
  ],
  cta: "Koop 10 verzendingen",
  paid: true,
  recurring: false,
  available: true,
  credits: 10,
  validMonths: 12,
 },
 send_credits_25: {
  id: "send_credits_25",
  name: "25 verzendingen",
  price: "€19",
  amount: "19.00",
  period: "eenmalig",
  description: "Voor ondernemers die af en toe batches via Peppol versturen.",
  checkoutDescription: "PeppolPro verzendbundel 25 credits",
  features: [
   "25 Peppol-verzendingen",
   "12 maanden geldig vanaf aankoop",
   "Eenmalige betaling, geen incasso",
   "iDEAL beschikbaar bij eenmalige betaling",
  ],
  cta: "Koop 25 verzendingen",
  paid: true,
  recurring: false,
  available: true,
  credits: 25,
  validMonths: 12,
  badge: "Populair",
 },
 send_credits_50: {
  id: "send_credits_50",
  name: "50 verzendingen",
  price: "€34",
  amount: "34.00",
  period: "eenmalig",
  description: "Voor accountants en bedrijven met meerdere verzendingen per jaar.",
  checkoutDescription: "PeppolPro verzendbundel 50 credits",
  features: [
   "50 Peppol-verzendingen",
   "12 maanden geldig vanaf aankoop",
   "Eenmalige betaling, geen incasso",
   "iDEAL beschikbaar bij eenmalige betaling",
  ],
  cta: "Koop 50 verzendingen",
  paid: true,
  recurring: false,
  available: true,
  credits: 50,
  validMonths: 12,
 },
};

export const monitoringPlans = [PLANS.monitoring, PLANS.monitoring_accountant];
export const creditBundles = Object.values(CREDIT_BUNDLES);
export const paidPlans = monitoringPlans;
export const checkoutProducts = [...creditBundles, ...monitoringPlans];

export const publicPricingPlans: PublicPricingPlan[] = [
 { ...PLANS.free, href: "/login", cta: "Start gratis", highlight: false, sub: "Probeer het uit" },
 { ...CREDIT_BUNDLES.send_credits_10, href: "/login", highlight: false, sub: "12 maanden geldig" },
 { ...CREDIT_BUNDLES.send_credits_25, href: "/login", highlight: true, sub: "12 maanden geldig" },
 { ...CREDIT_BUNDLES.send_credits_50, href: "/login", highlight: false, sub: "12 maanden geldig" },
 { ...PLANS.monitoring, href: "/login", highlight: false, sub: "Echt maandabonnement" },
];

export function getPlan(plan: string | null | undefined) {
 return PLANS[(plan || "free") as PlanId] || PLANS.free;
}

export function getCreditBundle(bundle: string | null | undefined) {
 return CREDIT_BUNDLES[(bundle || "") as CreditBundleId] || null;
}

export function isCreditBundle(product: string | null | undefined): product is CreditBundleId {
 return Boolean(product && CREDIT_BUNDLES[product as CreditBundleId]);
}

export function getCheckoutProduct(product: string | null | undefined) {
 return getCreditBundle(product) || getPlan(product);
}

export function isSendingPlan(plan: string | null | undefined) {
 // Backward-compatible helper name: direct Peppol sending now depends on active credits, not plan labels.
 return isCreditBundle(plan);
}

export function isMonitoringPlan(plan: string | null | undefined) {
 return plan === "monitoring" || plan === "monitoring_accountant";
}

export function isMonitoringAccountantPlan(plan: string | null | undefined) {
 return plan === "monitoring_accountant";
}
