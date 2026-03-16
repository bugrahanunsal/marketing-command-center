import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BacklinkTracker from "@/components/backlinks/BacklinkTracker";
import type { Backlink } from "@/types";

export default async function BacklinksPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("backlinks").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return <BacklinkTracker initialBacklinks={(data ?? []) as Backlink[]} userId={user.id} />;
}
