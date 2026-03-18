import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BlogReportManager from "@/components/blog-reports/BlogReportManager";

export default async function BlogReportsPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: reports } = await sb.from("blog_reports").select("*").order("created_at", { ascending: false });
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return <BlogReportManager initialReports={reports ?? []} userId={user.id} profile={profile} />;
}
