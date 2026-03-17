"use client";
import { useState, useTransition } from "react";
import { User, Lock, Bell, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, FormField, Avatar, Alert } from "@/components/ui";
import { updateProfile } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

type SettingsTab = "profile" | "security" | "notifications";

export default function SettingsPage({ profile, userEmail }: { profile: Profile | null; userEmail: string }) {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [isPending, start] = useTransition();

  async function saveProfile() {
    if (!fullName.trim()) { toast.error("Name is required"); return; }
    start(async () => {
      try { await updateProfile(fullName); toast.success("Profile updated"); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  async function changePassword() {
    setPwError("");
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    start(async () => {
      const { error } = await createClient().auth.updateUser({ password: newPw });
      if (error) { setPwError(error.message); return; }
      toast.success("Password updated");
      setNewPw(""); setConfirmPw("");
    });
  }

  const TABS: { value: SettingsTab; label: string; icon: typeof User }[] = [
    { value: "profile", label: "Profile", icon: User },
    { value: "security", label: "Security", icon: Lock },
    { value: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-1 p-1 w-fit">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setTab(value)}
            className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === value ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Profile information</h2>

          <div className="flex items-center gap-4">
            <Avatar src={profile?.avatar_url} name={profile?.full_name ?? userEmail} size="lg" />
            <div>
              <p className="text-sm font-medium text-foreground">{profile?.full_name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <FormField label="Full name" required>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </FormField>

          <FormField label="Email address">
            <Input value={userEmail} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support.</p>
          </FormField>

          <FormField label="Role">
            <Input value={profile?.role ?? "member"} disabled className="capitalize opacity-60" />
          </FormField>

          <Button onClick={saveProfile} loading={isPending}>Save profile</Button>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Change password</h2>

          {pwError && <Alert variant="error">{pwError}</Alert>}

          <FormField label="New password">
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
          </FormField>
          <FormField label="Confirm new password">
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
          </FormField>

          <Button onClick={changePassword} loading={isPending}>Update password</Button>

          <div className="border-t border-border pt-5">
            <h3 className="mb-1 text-sm font-semibold text-destructive">Danger zone</h3>
            <p className="mb-3 text-xs text-muted-foreground">Permanently delete your account and all data. This cannot be undone.</p>
            <Button variant="danger" size="sm">
              <Trash2 className="h-3.5 w-3.5" /> Delete account
            </Button>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Notification preferences</h2>
          <p className="text-sm text-muted-foreground">Email notification settings will be available in a future update.</p>
          {[
            "Weekly summary digest",
            "Keyword rank changes",
            "New backlinks detected",
            "Scheduled content reminders",
            "Task due date alerts",
          ].map((label) => (
            <label key={label} className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:bg-surface-2">
              <span className="text-sm text-foreground">{label}</span>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="peer-checked:bg-brand h-5 w-9 rounded-full bg-surface-3 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 after:shadow-sm" />
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
