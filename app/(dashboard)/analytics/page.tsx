import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return <AnalyticsDashboard />;
}
