import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";
import { cancelSubscription } from "@/lib/mollie";

function createAdminClient() {
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

 const { data: subscription, error } = await supabase
 .from("subscriptions")
 .select("id, mollie_customer_id, mollie_subscription_id, current_period_end, subscription_status")
 .eq("user_id", user.id)
 .eq("subscription_status", "active")
 .maybeSingle();

 if (error) return NextResponse.json({ error: "Abonnement kon niet worden opgehaald" }, { status: 500 });
 if (!subscription?.mollie_customer_id || !subscription?.mollie_subscription_id) {
 return NextResponse.json({ error: "Geen actief Mollie-abonnement gevonden" }, { status: 404 });
 }

 await cancelSubscription(subscription.mollie_customer_id, subscription.mollie_subscription_id);
 const admin = createAdminClient();
 const { error: updateError } = await admin
 .from("subscriptions")
 .update({ cancel_at_period_end: true, canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
 .eq("id", subscription.id)
 .eq("user_id", user.id);
 if (updateError) return NextResponse.json({ error: "Opzegging kon niet worden opgeslagen" }, { status: 500 });

 return NextResponse.json({ ok: true, status: "canceled_at_period_end", current_period_end: subscription.current_period_end });
}
