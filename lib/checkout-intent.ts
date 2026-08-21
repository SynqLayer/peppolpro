export const CHECKOUT_REDIRECT = "checkout";
export const CHECKOUT_INTENT_COOKIE = "peppolpro_checkout_plan";
export const CHECKOUT_INTENT_MAX_AGE_SECONDS = 60 * 60;
const CHECKOUT_PLANS: Set<string> = new Set(["send_credits_10", "send_credits_25", "send_credits_50", "monitoring", "monitoring_accountant"]);

export function isCheckoutRedirect(value: string | null | undefined) {
 return value === CHECKOUT_REDIRECT;
}

export function isCheckoutPlan(plan: string | null | undefined): plan is string {
 if (!plan) return false;
 return CHECKOUT_PLANS.has(plan);
}

export function checkoutLoginPath(plan: string) {
 return `/login?plan=${encodeURIComponent(plan)}&redirect=${CHECKOUT_REDIRECT}`;
}

export function checkoutResumePath(plan: string) {
 return `/checkout/resume?plan=${encodeURIComponent(plan)}`;
}

export function appendCheckoutIntent(url: string, plan: string | null | undefined) {
 if (!isCheckoutPlan(plan)) return url;
 const nextUrl = new URL(url);
 nextUrl.searchParams.set("plan", plan);
 nextUrl.searchParams.set("redirect", CHECKOUT_REDIRECT);
 return nextUrl.toString();
}

export function readCheckoutIntentFromSearch(searchParams: URLSearchParams) {
 const plan = searchParams.get("plan");
 if (!isCheckoutRedirect(searchParams.get("redirect")) || !isCheckoutPlan(plan)) return null;
 return plan;
}

export function checkoutIntentCookieValue(plan: string) {
 return `${CHECKOUT_INTENT_COOKIE}=${encodeURIComponent(plan)}; Path=/; Max-Age=${CHECKOUT_INTENT_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearCheckoutIntentCookieValue() {
 return `${CHECKOUT_INTENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
