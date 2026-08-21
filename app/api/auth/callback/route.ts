import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CHECKOUT_INTENT_COOKIE, checkoutResumePath, isCheckoutPlan, isCheckoutRedirect } from "@/lib/checkout-intent";

export async function GET(request: Request) {
 const { searchParams, origin } = new URL(request.url);
 const code = searchParams.get("code");
 const redirect = searchParams.get("redirect") || "/dashboard";
 const requestedPlan = searchParams.get("plan");

 if (code) {
 const cookieStore = await cookies();
 const cookiePlan = cookieStore.get(CHECKOUT_INTENT_COOKIE)?.value;
 const supabase = createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
 getAll() {
 return cookieStore.getAll();
 },
 setAll(cookiesToSet) {
 cookiesToSet.forEach(({ name, value, options }) =>
 cookieStore.set(name, value, options)
 );
 },
 },
 }
 );
 const { error } = await supabase.auth.exchangeCodeForSession(code);
 if (!error) {
 const checkoutPlan = isCheckoutRedirect(redirect) && isCheckoutPlan(requestedPlan)
 ? requestedPlan
 : isCheckoutPlan(cookiePlan)
 ? cookiePlan
 : null;
 if (checkoutPlan) {
 return NextResponse.redirect(`${origin}${checkoutResumePath(checkoutPlan)}`);
 }
 return NextResponse.redirect(`${origin}${redirect}`);
 }
 }

 return NextResponse.redirect(`${origin}/login?error=auth`);
}
