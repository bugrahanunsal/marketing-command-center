import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import BrandBlogStudio from "@/components/brands/BrandBlogStudio";

export default async function BrandStudioPage({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: brand } = await sb.from("brand_profiles").select("*").eq("id", params.id).single();
  if (!brand) notFound();
  const { data: posts } = await sb.from("brand_blog_posts").select("*").eq("brand_id", params.id).order("created_at", { ascending: false });
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return <BrandBlogStudio brand={brand} initialPosts={posts ?? []} userId={user.id} profile={profile} />;
}
