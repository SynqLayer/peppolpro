import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { createAdminSupabase, createServerSupabase } from "../../lib/supabase-server";

function maskEmail(email: string | null | undefined) {
 if (!email) return "—";
 const [localPart, domain] = email.split("@");
 if (!domain) return "••••";
 const visibleLocal = localPart.slice(0, 2);
 const [domainName, ...tldParts] = domain.split(".");
 const tld = tldParts.join(".");
 const visibleDomain = domainName.slice(0, 1);
 return `${visibleLocal}${"•".repeat(Math.max(3, localPart.length - 2))}@${visibleDomain}${"•".repeat(Math.max(3, domainName.length - 1))}${tld ? `.${tld}` : ""}`;
}

export default async function AdminPage() {
 const sessionSupabase = await createServerSupabase();
 const { data: { user } } = await sessionSupabase.auth.getUser();

 if (!user) {
  redirect("/dashboard");
 }

 const { data: profile } = await sessionSupabase
  .from("user_profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single();

 if (!profile?.is_admin) {
  redirect("/dashboard");
 }

 const supabase = createAdminSupabase();

 const { data: users } = await supabase
  .from("user_profiles")
  .select("id, email, full_name, company_name, plan, credits, is_admin, onboarding_complete, created_at")
  .order("created_at", { ascending: false })
  .limit(50);

 const { data: conversions } = await supabase
  .from("conversions")
  .select("id, user_id, filename, source_pdf_filename, status, invoice_number, total_amount, currency, created_at")
  .order("created_at", { ascending: false })
  .limit(50);

 const { data: messages } = await supabase
  .from("contact_messages")
  .select("id, name, email, message, status, created_at")
  .order("created_at", { ascending: false })
  .limit(20);

 const { data: payments } = await supabase
  .from("payments")
  .select("id, user_id, type, amount, credits, status, created_at")
  .order("created_at", { ascending: false })
  .limit(20);

 const { data: monitoringTargets } = await supabase
  .from("monitoring_targets")
  .select("id, user_id, identifier_type, identifier_value, label, status, last_checked_at, created_at")
  .order("created_at", { ascending: false })
  .limit(50);

 const { data: monitoringEvents } = await supabase
  .from("monitoring_events")
  .select("id, target_id, user_id, event_type, severity, created_at")
  .order("created_at", { ascending: false })
  .limit(50);

 const maskedUsers = (users || []).map(({ email, ...rest }) => ({
  ...rest,
  masked_email: maskEmail(email),
 }));
 const maskedMessages = (messages || []).map(({ email, ...rest }) => ({
  ...rest,
  masked_email: maskEmail(email),
 }));

 return (
  <AdminClient
   users={maskedUsers}
   conversions={conversions || []}
   messages={maskedMessages}
   payments={payments || []}
   monitoringTargets={monitoringTargets || []}
   monitoringEvents={monitoringEvents || []}
  />
 );
}
