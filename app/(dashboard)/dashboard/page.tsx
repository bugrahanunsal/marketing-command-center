import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui";
import { CheckSquare, Search, Link2, FileText, TrendingUp, Clock, Target, BarChart2 } from "lucide-react";
import { fmtRelative } from "@/lib/utils";
import type { Task, SeoKeyword, Backlink, BlogPost } from "@/types";

export default async function DashboardPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [tasks, keywords, backlinks, posts] = await Promise.all([
    sb.from("tasks").select("*").eq("user_id", user.id),
    sb.from("seo_keywords").select("*").eq("user_id", user.id),
    sb.from("backlinks").select("*").eq("user_id", user.id),
    sb.from("blog_posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const t = (tasks.data ?? []) as Task[];
  const k = (keywords.data ?? []) as SeoKeyword[];
  const b = (backlinks.data ?? []) as Backlink[];
  const p = (posts.data ?? []) as BlogPost[];

  const doneTasks = t.filter((x) => x.status === "done").length;
  const urgentTasks = t.filter((x) => x.priority === "urgent" && x.status !== "done").length;
  const avgRank = k.length ? Math.round(k.reduce((s, x) => s + (x.current_rank ?? 0), 0) / k.length) : 0;
  const activeLinks = b.filter((x) => x.status === "active").length;
  const dofollowLinks = b.filter((x) => x.link_type === "dofollow").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const { data: profile } = await sb.from("profiles").select("full_name").eq("id", user.id).single();

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's your marketing overview for today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="animate-fade-up">
          <StatCard label="Open Tasks" value={t.filter((x) => x.status !== "done").length}
            sub={`${doneTasks} completed`} trend={{ value: 0 }} icon={<CheckSquare className="h-4 w-4" />}
            iconColor="bg-blue-500/10 text-blue-500" />
        </div>
        <div className="animate-fade-up-1">
          <StatCard label="Keywords Tracked" value={k.length}
            sub={`Avg rank: ${avgRank || "—"}`} icon={<Search className="h-4 w-4" />}
            iconColor="bg-green-500/10 text-green-500" />
        </div>
        <div className="animate-fade-up-2">
          <StatCard label="Active Backlinks" value={activeLinks}
            sub={`${dofollowLinks} dofollow`} icon={<Link2 className="h-4 w-4" />}
            iconColor="bg-amber-500/10 text-amber-500" />
        </div>
        <div className="animate-fade-up-3">
          <StatCard label="Blog Posts" value={p.length}
            sub={`${p.filter((x) => x.status === "published").length} published`}
            icon={<FileText className="h-4 w-4" />} iconColor="bg-purple-500/10 text-purple-500" />
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-up-2">
        {/* Recent tasks */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent tasks</h3>
            <a href="/tasks" className="text-xs text-brand hover:underline">View all →</a>
          </div>
          {t.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tasks yet</p>
          ) : (
            <ul className="space-y-2">
              {t.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-2">
                  <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                  <span className="flex-1 truncate text-sm text-foreground">{task.title}</span>
                  <span className={`badge status-${task.status} text-[10px]`}>{task.status.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top keywords */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Top keywords</h3>
            <a href="/seo" className="text-xs text-brand hover:underline">View all →</a>
          </div>
          {k.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No keywords tracked yet</p>
          ) : (
            <ul className="space-y-2">
              {k.slice(0, 5).map((kw) => (
                <li key={kw.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-2">
                  <span className="flex-1 truncate text-sm text-foreground">{kw.keyword}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    #{kw.current_rank ?? "—"}
                  </span>
                  {kw.search_volume && (
                    <span className="text-xs text-muted-foreground">{kw.search_volume.toLocaleString()}/mo</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Urgent tasks callout */}
      {urgentTasks > 0 && (
        <div className="animate-fade-up-3 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <Target className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-foreground">
            You have <strong className="text-red-500">{urgentTasks} urgent task{urgentTasks > 1 ? "s" : ""}</strong> that need attention.
          </p>
          <a href="/tasks" className="ml-auto text-xs font-medium text-red-500 hover:underline">View →</a>
        </div>
      )}
    </div>
  );
}
