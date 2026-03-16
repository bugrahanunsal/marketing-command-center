import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const app = process.env.NEXT_PUBLIC_APP_NAME ?? "MarketingOS";
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-0 px-4 py-12">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid-md opacity-[0.03]" />
      {/* Brand glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-brand-glow" />

      <Link href="/" className="mb-8 flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/30">
          <Zap className="h-4.5 w-4.5 text-white" />
        </div>
        <span style={{ fontFamily: "var(--font-display)" }} className="text-xl font-bold tracking-tight">
          {app}
        </span>
      </Link>

      <div className="w-full max-w-sm animate-fade-up">{children}</div>

      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {app}. All rights reserved.
      </p>
    </div>
  );
}
