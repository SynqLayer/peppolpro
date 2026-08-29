import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { collectExpiredConversionPdfPaths, conversionPdfRetentionCutoff } from "@/lib/conversion-pdf-retention";

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
 const conversionPdfCutoff = conversionPdfRetentionCutoff();
 const draftCutoff = new Date().toISOString();

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

 const { data: expiredConversions, error: conversionPdfSelectError } = await supabase
 .from("conversions")
 .select("id, user_id, created_at")
 .lt("created_at", conversionPdfCutoff)
 .is("pdf_deleted_at", null)
 .order("created_at", { ascending: true })
 .limit(1000);
 if (conversionPdfSelectError) return NextResponse.json({ error: "PDF-retentie selectie mislukt" }, { status: 500 });
 const conversionPdfPaths = collectExpiredConversionPdfPaths(expiredConversions || []);
 let deletedConversionPdfs = 0;
 if (conversionPdfPaths.length > 0) {
 const { data: removedPdfs, error: storageError } = await supabase.storage.from("invoices").remove(conversionPdfPaths);
 if (storageError) return NextResponse.json({ error: "PDF-retentie storage cleanup mislukt" }, { status: 500 });
 deletedConversionPdfs = removedPdfs?.length ?? conversionPdfPaths.length;
 const expiredConversionIds = (expiredConversions || []).map((conversion) => conversion.id).filter(Boolean);
 const { error: conversionUpdateError } = await supabase
  .from("conversions")
  .update({ pdf_deleted_at: new Date().toISOString() })
  .in("id", expiredConversionIds);
 if (conversionUpdateError) return NextResponse.json({ error: "PDF-retentie markering mislukt" }, { status: 500 });
 }

 const { data: expiredDrafts, error: draftSelectError } = await supabase
 .from("conversion_drafts")
 .select("id")
 .eq("status", "draft")
 .lt("expires_at", draftCutoff)
 .limit(1000);
 if (draftSelectError) return NextResponse.json({ error: "Concept-retentie selectie mislukt" }, { status: 500 });
 const expiredDraftIds = (expiredDrafts || []).map((draft) => draft.id).filter(Boolean);
 if (expiredDraftIds.length > 0) {
 const { error: draftDeleteError } = await supabase
  .from("conversion_drafts")
  .delete()
  .in("id", expiredDraftIds);
 if (draftDeleteError) return NextResponse.json({ error: "Concept-retentie cleanup mislukt" }, { status: 500 });
 }

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
 deletedConversionPdfs,
 expiredDrafts: expiredDraftIds.length,
 checkedConversionPdfs: conversionPdfPaths.length,
 endedSubscriptions: endedUserIds.length,
 retention: {
 monitoringEvents: "12 maanden",
 pendingInvites: "30 dagen",
 conversionPdfs: "14 dagen na conversie",
 conversionDrafts: "14 dagen na parsing zonder bevestiging",
 },
 });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Onbekende fout";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
