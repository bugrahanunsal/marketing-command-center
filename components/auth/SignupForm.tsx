"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validations";
import { Button, Alert, Input, Label } from "@/components/ui";

export default function SignupForm() {
  const router = useRouter();
  const [v, setV] = useState({ full_name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<typeof v>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const upd = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const r = signupSchema.safeParse(v);
    if (!r.success) {
      const fe: typeof errors = {};
      r.error.issues.forEach((i) => { if (i.path[0]) fe[i.path[0] as keyof typeof fe] = i.message; });
      setErrors(fe); return;
    }
    setLoading(true);
    const { error } = await createClient().auth.signUp({
      email: v.email, password: v.password,
      options: { data: { full_name: v.full_name }, emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { setServerError(error.message); setLoading(false); return; }
    setSuccess(true);
  }

  if (success) return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="rounded-full bg-green-500/10 p-3"><CheckCircle2 className="h-6 w-6 text-green-500" /></div>
      <p className="font-medium text-foreground">Check your inbox</p>
      <p className="text-sm text-muted-foreground">We sent a confirmation link to <strong className="text-foreground">{v.email}</strong>.</p>
      <button onClick={() => router.push("/login")} className="text-sm text-brand hover:underline">Back to sign in</button>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}
      {(["full_name", "email", "password"] as const).map((k) => (
        <div key={k} className="space-y-1.5">
          <Label htmlFor={k}>{k === "full_name" ? "Full name" : k === "email" ? "Email address" : "Password"}</Label>
          <Input id={k} name={k} type={k === "password" ? "password" : k === "email" ? "email" : "text"}
            autoComplete={k === "full_name" ? "name" : k === "email" ? "email" : "new-password"}
            placeholder={k === "full_name" ? "Jane Smith" : k === "email" ? "you@example.com" : "Min 8 chars, 1 uppercase, 1 number"}
            value={v[k]} onChange={upd(k)} hasError={!!errors[k]} disabled={loading} />
          {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
        </div>
      ))}
      <Button type="submit" className="w-full" loading={loading}>{loading ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}
