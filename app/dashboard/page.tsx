import { createServerSupabase } from "@/lib/supabase-server";
import { assertMonitoringAccess } from "@/lib/monitoring-access";
import { redirect } from "next/navigation";
import DashboardClient, { ApiKeyRecord, BillingInvoice, Conversion, MonitoringEvent, MonitoringTarget, Profile, SubscriptionState, TeamMember, WebhookConfig } from "./DashboardClient";

export default async function DashboardPage({
 searchParams,
}: {
 searchParams: Promise<{ betaald?: string }>;
}) {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 const params = await searchParams;

 const { data: profile } = await supabase
 .from("user_profiles")
 .select("*")
 .eq("id", user.id)
 .single<Profile>();

 const monitoringAccess = await assertMonitoringAccess(user.id);
 const monitoringOwnerId = monitoringAccess.ok ? monitoringAccess.entitlement.accountOwnerId : null;

 const { data: conversionsData, error: conversionsError } = await supabase
 .from("conversions")
 .select("id, filename, source_pdf_filename, created_at, status, ubl_xml, customer_name, total_amount, invoice_number, currency, recommand_document_id, recommand_status, verified_recipient, sent_via_recommand_at")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(100);
 const conversionsErrorMessage = conversionsError
 ? "Factuurhistorie kon niet worden geladen. Probeer opnieuw of neem contact op met support."
 : null;

 const monitoringTargetsData = monitoringOwnerId ? (await supabase
 .from("monitoring_targets")
 .select("id, identifier_type, identifier_value, label, status, last_checked_at, created_at")
 .eq("user_id", monitoringOwnerId)
 .order("created_at", { ascending: false })
 .limit(10)).data : [];

 const monitoringEventsData = monitoringOwnerId ? (await supabase
 .from("monitoring_events")
 .select("id, event_type, severity, payload, created_at, monitoring_targets(label, identifier_value)")
 .eq("user_id", monitoringOwnerId)
 .order("created_at", { ascending: false })
 .limit(5)).data : [];

 const { data: teamMembersData } = await supabase
 .from("account_members")
 .select("id, account_owner_id, member_user_id, invite_email, role, invited_at, accepted_at")
 .or(`account_owner_id.eq.${user.id},member_user_id.eq.${user.id}`)
 .order("invited_at", { ascending: false })
 .limit(20);

 const { data: webhookConfigData } = await supabase
 .from("monitoring_webhook_configs")
 .select("id, webhook_url, updated_at, revoked_at")
 .eq("user_id", user.id)
 .is("revoked_at", null)
 .maybeSingle();

 const { data: apiKeysData } = await supabase
 .from("api_keys")
 .select("id, key_hash, created_at, last_used_at, revoked_at")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(10);

 const { data: subscriptionData } = await supabase
 .from("subscriptions")
 .select("id, subscription_status, current_period_end, cancel_at_period_end, canceled_at")
 .eq("user_id", user.id)
 .maybeSingle();

 const { data: billingInvoicesData } = await supabase
 .from("invoices")
 .select("id, invoice_number, invoice_date, issued_at, currency, total_incl, amount, invoice_kind")
 .eq("user_id", user.id)
 .order("issued_at", { ascending: false, nullsFirst: false })
 .order("invoice_date", { ascending: false, nullsFirst: false })
 .limit(50);

 const effectiveProfile = monitoringAccess.ok && profile ? { ...profile, plan: monitoringAccess.entitlement.plan.id } : profile;

 return (
 <DashboardClient
 user={{ id: user.id, email: user.email || "" }}
 profile={effectiveProfile}
 conversions={(conversionsData || []) as Conversion[]}
 conversionsError={conversionsErrorMessage}
  monitoringTargets={(monitoringTargetsData || []) as MonitoringTarget[]}
 monitoringEvents={(monitoringEventsData || []) as MonitoringEvent[]}
 teamMembers={(teamMembersData || []) as TeamMember[]}
 webhookConfig={(webhookConfigData || null) as WebhookConfig | null}
 apiKeys={(apiKeysData || []) as ApiKeyRecord[]}
 subscription={(subscriptionData || null) as SubscriptionState | null}
 billingInvoices={(billingInvoicesData || []) as BillingInvoice[]}
 paid={params.betaald === "1"}
 />
 );
}
