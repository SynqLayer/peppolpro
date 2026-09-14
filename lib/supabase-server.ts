import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { withAuthRetry } from "./auth-session.ts";
import { readableCookiesOnly } from "./auth-cookie-guard.ts";

export async function createServerSupabase() {
 const cookieStore = await cookies();
 return createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
  getAll() {
   // Onleesbare sessiecookies laten we weg: de decoder van @supabase/ssr gooit anders een
   // fout die de route als 500 laat eindigen in plaats van een nette "niet ingelogd".
   return readableCookiesOnly(cookieStore.getAll());
  },
 setAll(cookiesToSet) {
 try {
 cookiesToSet.forEach(({ name, value, options }) =>
 cookieStore.set(name, value, options)
 );
 } catch {
 // Server Component kan geen cookies zetten
 }
 },
 },
 }
 );
}

export function createAdminSupabase() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role;
 if (!url || !key) throw new Error("Supabase service env ontbreekt");
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Diagnostiek bij een onleesbare sessiecookie. Logt alleen de vorm van de cookies
 * (namen en lengtes), nooit de inhoud of tokens.
 */
async function logSessionCookieShape() {
  try {
    const cookieStore = await cookies();
    const authCookies = cookieStore.getAll().filter((cookie) => cookie.name.includes("-auth-token"));
    if (authCookies.length === 0) return;
    console.error("Sessiecookies aanwezig maar geen gebruiker te bepalen", {
      cookieNames: authCookies.map((cookie) => cookie.name),
      cookieLengths: authCookies.map((cookie) => cookie.value.length),
      hasUnsuffixedCookie: authCookies.some((cookie) => /-auth-token$/.test(cookie.name)),
    });
  } catch {
    // diagnostiek mag een request nooit laten mislukken
  }
}

export async function createAuthenticatedSupabase() {
  return withAuthRetry(createServerSupabase, { onExhausted: logSessionCookieShape });
}
