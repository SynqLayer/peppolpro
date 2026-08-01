import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new Error("Supabase service env ontbreekt");
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function authorized(req: NextRequest) {
 const secret = process.env.CRON_SECRET;
 if (!secret) return false;
 const header = req.headers.get("authorization") || "";
 return header === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
 if (!authorized(req)) return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
 try {
 const supabase = createServiceClient();
 const eventCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
 const inviteCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

 const { count: deletedMonitoringEvents, error: eventsError } = await supabase
 .from("monitoring_events")
 .delete({ count: "exact" })
 .lt("created_at", eventCutoff);
 if (eventsError) return NextResponse.json({ error: "Monitoring-events cleanup mislukt" }, { status: 500 });

 const { count: expiredInvites, error: inviteError } = await supabase
 .from("account_members")
 .update({ status: "expired", invite_email: null }, { count: "exact" })
 .eq("status", "pending")
 .lt("invited_at", inviteCutoff);
 if (inviteError) return NextResponse.json({ error: "Team-invites cleanup mislukt" }, { status: 500 });

 const { data: endedSubscriptions, error: subscriptionError } = await supabase
 .from("subscriptions")
 .select("user_id")
 .eq("cancel_at_period_end", true)
 .eq("subscription_status", "active")
 .lt("current_period_end", new Date().toISOString());
 if (subscriptionError) return NextResponse.json({ error: "Abonnement-cleanup mislukt" }, { status: 500 });
 const endedUserIds = (endedSubscriptions || []).map((subscription) => subscription.user_id).filter(Boolean);
 if (endedUserIds.length > 0) {
 const { error: profileError } = await supabase.from("user_profiles").update({ plan: "free" }).in("id", endedUserIds);
 if (profileError) return NextResponse.json({ error: "Plan-cleanup mislukt" }, { status: 500 });
 const { error: subUpdateError } = await supabase.from("subscriptions").update({ subscription_status: "expired", updated_at: new Date().toISOString() }).in("user_id", endedUserIds);
 if (subUpdateError) return NextResponse.json({ error: "Subscription-status cleanup mislukt" }, { status: 500 });
 }

 return NextResponse.json({
 deletedMonitoringEvents: deletedMonitoringEvents || 0,
 expiredInvites: expiredInvites || 0,
 endedSubscriptions: endedUserIds.length,
 retention: {
 monitoringEvents: "12 maanden",
 pendingInvites: "30 dagen",
 },
 });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Onbekende fout";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
