import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BacklinkUploadManager from "@/components/backlink-upload/BacklinkUploadManager";

export default async function BacklinkUploadPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: uploads } = await sb.from("backlink_uploads").select("*").order("created_at", { ascending: false });
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return <BacklinkUploadManager initialUploads={uploads ?? []} userId={user.id} profile={profile} />;
}
