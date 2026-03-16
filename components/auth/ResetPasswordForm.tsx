"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Alert, Input, Label } from "@/components/ui";
import { absoluteUrl } from "@/lib/utils";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setLoading(true); setError(null);
    const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: absoluteUrl("/api/auth/callback?next=/settings"),
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true);
  }

  if (success) return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="rounded-full bg-green-500/10 p-3"><CheckCircle2 className="h-6 w-6 text-green-500" /></div>
      <p className="font-medium text-foreground">Reset link sent</p>
      <p className="text-sm text-muted-foreground">Check <strong className="text-foreground">{email}</strong> for the reset link.</p>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
      </div>
      <Button type="submit" className="w-full" loading={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}
