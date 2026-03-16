import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsPage from "@/components/dashboard/SettingsPage";
import type { Profile } from "@/types";

export default async function Settings() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return <SettingsPage profile={profile as Profile} userEmail={user.email ?? ""} />;
}
