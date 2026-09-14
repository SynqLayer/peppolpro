import { createServerSupabase } from "@/lib/supabase-server";
import { assertMonitoringAccess } from "@/lib/monitoring-access";
import { redirect } from "next/navigation";
import { isSuperseded, supersededDetail } from "@/lib/superseded";
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
 .select("id, filename, source_pdf_filename, created_at, status, ubl_xml, customer_name, total_amount, invoice_number, currency, recommand_document_id, recommand_status, verified_recipient, sent_via_recommand_at, superseded_by_conversion_id, superseded_at, superseded_reason")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(100);
 if (conversionsError) {
  console.error("Dashboard conversions query failed", {
   code: conversionsError.code,
   message: conversionsError.message,
   details: conversionsError.details,
   hint: conversionsError.hint,
  });
 }
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

 // Achterhaalde rijen: het oude bestand gaat niet mee naar de browser en krijgt een
 // verwijzing naar de leidende versie, zodat de klant het niet elders kan aanleveren.
 const supersededReferenceIds = Array.from(new Set((conversionsData || [])
  .map((row) => row.superseded_by_conversion_id)
  .filter((value): value is string => typeof value === "string" && value.length > 0)));
 const { data: supersededReferences } = supersededReferenceIds.length
  ? await supabase
   .from("conversions")
   .select("id, document_type, invoice_number")
   .in("id", supersededReferenceIds)
  : { data: [] as Array<{ id: string; document_type: string | null; invoice_number: string | null }> };
 const supersededLabels = new Map<string, string>((supersededReferences || []).map((reference) => [
  reference.id,
  `${reference.document_type === "CreditNote" ? "creditnota" : "factuur"} ${reference.invoice_number || reference.id.slice(0, 8)}`,
 ]));
 const conversions = (conversionsData || []).map((row) => {
  if (!isSuperseded(row)) return row as Conversion;
  const label = row.superseded_by_conversion_id ? supersededLabels.get(row.superseded_by_conversion_id) || null : null;
  const supersededRow = { ...row, ubl_xml: null, superseded_by_label: label };
  return { ...supersededRow, superseded_reason: supersededDetail(supersededRow) } as Conversion;
 });

 return (
 <DashboardClient
 user={{ id: user.id, email: user.email || "" }}
 profile={effectiveProfile}
 conversions={conversions}
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
