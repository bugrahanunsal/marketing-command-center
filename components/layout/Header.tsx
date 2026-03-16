"use client";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button, Avatar } from "@/components/ui";
import type { Profile } from "@/types";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Task Manager",
  "/seo": "SEO Tracker",
  "/backlinks": "Backlink Tracker",
  "/calendar": "Content Calendar",
  "/blog": "Blog & AI Generator",
  "/settings": "Settings",
};

export default function Header({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const base = "/" + pathname.split("/")[1];
  const title = TITLES[base] ?? "Dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-0 px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
        </Button>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <Avatar src={profile?.avatar_url} name={profile?.full_name ?? profile?.email} size="sm" />
          <span className="hidden text-sm font-medium text-foreground sm:block">
            {profile?.full_name?.split(" ")[0] ?? "Account"}
          </span>
        </div>
      </div>
    </header>
  );
}
