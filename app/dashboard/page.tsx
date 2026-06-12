import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardClient, { Conversion, InboxMessage, Profile } from "./DashboardClient";

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

 const { data: conversionsData } = await supabase
 .from("conversions")
 .select("id, filename, created_at, status, ubl_xml, customer_name, total_amount, invoice_number, currency")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(100);

 const { data: inboxData } = await supabase
 .from("inbox_messages")
 .select("id, sender_name, amount, status, received_at")
 .eq("user_id", user.id)
 .order("received_at", { ascending: false })
 .limit(5);

 return (
 <DashboardClient
 user={{ id: user.id, email: user.email || "" }}
 profile={profile}
 conversions={(conversionsData || []) as Conversion[]}
 inbox={(inboxData || []) as InboxMessage[]}
 paid={params.betaald === "1"}
 />
 );
}
