import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createServerSupabase() {
 const cookieStore = await cookies();
 return createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
 getAll() {
 return cookieStore.getAll();
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
