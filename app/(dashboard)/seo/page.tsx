import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SEOTracker from "@/components/seo/SEOTracker";
import type { SeoKeyword } from "@/types";

export default async function SEOPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("seo_keywords").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return <SEOTracker initialKeywords={(data ?? []) as SeoKeyword[]} userId={user.id} />;
}
