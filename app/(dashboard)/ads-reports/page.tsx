import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdsReportManager from "@/components/ads-reports/AdsReportManager";

export default async function AdsReportsPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: reports } = await sb.from("ads_reports").select("*").order("report_date", { ascending: false });
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return <AdsReportManager initialReports={reports ?? []} userId={user.id} profile={profile} />;
}
