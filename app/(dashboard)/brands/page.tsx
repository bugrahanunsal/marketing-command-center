import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BrandManager from "@/components/brands/BrandManager";

export default async function BrandsPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: brands } = await sb.from("brand_profiles").select("*").order("created_at", { ascending: false });
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return <BrandManager initialBrands={brands ?? []} userId={user.id} profile={profile} />;
}
