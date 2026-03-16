import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TaskManager from "@/components/tasks/TaskManager";
import type { Task } from "@/types";

export default async function TasksPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await sb.from("tasks").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <TaskManager initialTasks={(data ?? []) as Task[]} userId={user.id} />;
}
