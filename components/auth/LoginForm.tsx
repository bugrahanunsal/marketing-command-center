"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { Button, Alert, Input, Label } from "@/components/ui";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const urlError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const r = loginSchema.safeParse({ email, password });
    if (!r.success) {
      const fe: typeof errors = {};
      r.error.issues.forEach((i) => { if (i.path[0]) fe[i.path[0] as keyof typeof fe] = i.message; });
      setErrors(fe); return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setServerError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message); setLoading(false); return; }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} hasError={!!errors.email} disabled={loading} />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/reset-password" tabIndex={-1} className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>
        </div>
        <div className="relative">
          <Input id="password" type={show ? "text" : "password"} autoComplete="current-password"
            placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            hasError={!!errors.password} disabled={loading} className="pr-9" />
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
