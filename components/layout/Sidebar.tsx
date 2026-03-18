"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Search,
  Link2,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import type { Profile } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/seo", label: "SEO Tracker", icon: Search },
  { href: "/backlinks", label: "Backlinks", icon: Link2 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/blog", label: "Blog / AI", icon: FileText, badge: "AI" },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      style={{
        background: "hsl(var(--sidebar-bg))",
        borderColor: "hsl(var(--sidebar-border))",
      }}
      className={cn(
        "relative flex h-full flex-col border-r transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      <div
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
        className={cn(
          "flex h-14 items-center border-b px-4",
          collapsed ? "justify-center" : "gap-2.5"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight text-white">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "MarketingOS"}
          </span>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: "hsl(var(--sidebar-bg))",
          borderColor: "hsl(var(--sidebar-border))",
        }}
        className="absolute -right-3 top-12 z-10 flex h-6 w-6 items-center justify-center rounded-full border text-white/40 transition-colors hover:text-white"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={
                    active
                      ? { background: "hsl(var(--sidebar-active-bg))" }
                      : undefined
                  }
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "text-white"
                      : "text-white/50 hover:text-white",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
        className="border-t p-3"
      >
        {collapsed ? (
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center rounded-lg py-2 text-white/40 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name ?? profile?.email}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {profile?.full_name ?? "User"}
              </p>
              <p className="truncate text-[11px] text-white/40">
                {profile?.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 rounded p-1 text-white/30 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}