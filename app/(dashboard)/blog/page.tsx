import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BlogManager from "@/components/blog/BlogManager";
import type { BlogPost } from "@/types";

export default async function BlogPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("blog_posts").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return <BlogManager initialPosts={(data ?? []) as BlogPost[]} userId={user.id} />;
}
