import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getPlan, isMonitoringAccountantPlan, isMonitoringPlan, PlanConfig } from "@/lib/plans";

export type MonitoringEntitlement = {
 hasAccess: boolean;
 userId: string;
 accountOwnerId: string;
 profile: { id: string; plan: string | null; company_name?: string | null } | null;
 plan: PlanConfig;
 subscription: {
 subscription_status: string | null;
 current_period_end: string | null;
 mollie_customer_id?: string | null;
 mollie_subscription_id?: string | null;
 } | null;
 reason?: string;
};

function createServiceClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new Error("Supabase service env ontbreekt");
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function periodIsValid(currentPeriodEnd: string | null | undefined) {
 if (!currentPeriodEnd) return false;
 return new Date(currentPeriodEnd).getTime() >= Date.now();
}

async function resolveAccountOwnerId(supabase: SupabaseClient, userId: string) {
 const { data: memberships } = await supabase
 .from("account_members")
 .select("account_owner_id, accepted_at, status")
 .eq("member_user_id", userId)
 .not("accepted_at", "is", null)
 .eq("status", "accepted")
 .limit(1);
 return memberships?.[0]?.account_owner_id || userId;
}

export async function getMonitoringEntitlement(userId: string): Promise<MonitoringEntitlement> {
 const supabase = createServiceClient();
 const accountOwnerId = await resolveAccountOwnerId(supabase, userId);
 const { data: profile } = await supabase
 .from("user_profiles")
 .select("id, company_name, plan")
 .eq("id", accountOwnerId)
 .maybeSingle();
 const plan = getPlan(profile?.plan);
 const { data: subscription } = await supabase
 .from("subscriptions")
 .select("subscription_status, current_period_end, mollie_customer_id, mollie_subscription_id")
 .eq("user_id", accountOwnerId)
 .maybeSingle();
 const active = subscription?.subscription_status === "active" && periodIsValid(subscription.current_period_end);
 const hasAccess = isMonitoringPlan(plan.id) && active;
 return {
 hasAccess,
 userId,
 accountOwnerId,
 profile: profile || null,
 plan,
 subscription: subscription || null,
 reason: hasAccess ? undefined : !isMonitoringPlan(plan.id) ? "plan_not_monitoring" : !subscription ? "subscription_missing" : subscription.subscription_status !== "active" ? "subscription_not_active" : "subscription_expired",
 };
}

export async function assertMonitoringAccess(userId: string, options?: { requireAccountant?: boolean }) {
 const entitlement = await getMonitoringEntitlement(userId);
 if (!entitlement.hasAccess) return { ok: false as const, entitlement };
 if (options?.requireAccountant && !isMonitoringAccountantPlan(entitlement.plan.id)) {
 return { ok: false as const, entitlement: { ...entitlement, reason: "accountant_required" } };
 }
 return { ok: true as const, entitlement };
}
