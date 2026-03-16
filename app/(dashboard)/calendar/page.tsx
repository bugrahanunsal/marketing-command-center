import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContentCalendar from "@/components/calendar/ContentCalendar";
import type { ContentItem } from "@/types";

export default async function CalendarPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("content_items").select("*").eq("user_id", user.id)
    .order("scheduled_date", { ascending: true });
  return <ContentCalendar initialItems={(data ?? []) as ContentItem[]} userId={user.id} />;
}
