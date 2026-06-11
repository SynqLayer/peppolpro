import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AdminClient from "./AdminClient";

type AdminPageProps = {
 searchParams?: Promise<{ secret?: string | string[] }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
 const resolvedSearchParams = (await searchParams) || {};
 const secret = Array.isArray(resolvedSearchParams.secret)
 ? resolvedSearchParams.secret[0]
 : resolvedSearchParams.secret;

 if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
 redirect("/dashboard");
 }

 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!serviceKey) {
 throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
 }

 const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 serviceKey,
 { auth: { persistSession: false } }
 );

 const { data: users } = await supabase
 .from("user_profiles")
 .select("id, email, full_name, company_name, plan, credits, is_admin, onboarding_complete, created_at")
 .order("created_at", { ascending: false })
 .limit(50);

 const { data: conversions } = await supabase
 .from("conversions")
 .select("id, user_id, original_filename, status, invoice_number, invoice_total, created_at")
 .order("created_at", { ascending: false })
 .limit(50);

 const { data: messages } = await supabase
 .from("contact_messages")
 .select("*")
 .order("created_at", { ascending: false })
 .limit(20);

 const { data: payments } = await supabase
 .from("payments")
 .select("*")
 .order("created_at", { ascending: false })
 .limit(20);

 return (
 <AdminClient
 users={users || []}
 conversions={conversions || []}
 messages={messages || []}
 payments={payments || []}
 />
 );
}
