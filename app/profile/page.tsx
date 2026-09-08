import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
 const supabase = await createServerSupabase();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 const { data: profile } = await supabase
  .from("user_profiles")
  .select("company_name, country, kvk_kbo, btw_nr, address, postal_code, city, address_verified, address_validation_source")
  .eq("id", user.id)
  .maybeSingle();

 return <ProfileForm profile={profile || null} mode="profile" />;
}
