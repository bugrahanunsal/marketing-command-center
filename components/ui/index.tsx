import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2, X, ChevronDown } from "lucide-react";

// ── Button ────────────────────────────────────────────────────
const btnVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium
   transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
   focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none`,
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-fg shadow-sm hover:opacity-90 active:scale-[0.98]",
        outline: "border border-border bg-surface-0 hover:bg-surface-2 hover:border-border/80",
        ghost: "hover:bg-surface-2 text-foreground",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
        "ghost-danger": "text-destructive hover:bg-destructive/10",
        link: "text-brand underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof btnVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(btnVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

// ── Input ─────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("input", hasError && "input-error", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ── Textarea ──────────────────────────────────────────────────
export const Textarea = React.forwardRef<
  HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "input min-h-[80px] resize-y py-2 leading-relaxed",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ── Select ────────────────────────────────────────────────────
export const Select = React.forwardRef<
  HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn("input appearance-none pr-8", className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
  </div>
));
Select.displayName = "Select";

// ── Label ─────────────────────────────────────────────────────
export const Label = React.forwardRef<
  HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none text-foreground", className)} {...props} />
));
Label.displayName = "Label";

// ── FormField ─────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  id?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}
export function FormField({ label, id, error, hint, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────
const alertVariants = cva("flex items-start gap-3 rounded-lg border p-4 text-sm", {
  variants: {
    variant: {
      info: "border-border bg-muted/50 text-foreground",
      error: "border-destructive/30 bg-destructive/10 text-destructive",
      success: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
      warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  },
  defaultVariants: { variant: "info" },
});

export function Alert({
  variant, title, children, className, ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & { title?: string }) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <div className="flex-1">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
const badgeVariants = cva("badge ring-1 ring-inset", {
  variants: {
    variant: {
      default: "bg-brand/10 text-brand ring-brand/20",
      secondary: "bg-surface-2 text-muted-foreground ring-border",
      success: "bg-green-500/10 text-green-700 dark:text-green-400 ring-green-500/20",
      warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
      danger: "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20",
      outline: "border border-border text-muted-foreground ring-0",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({
  variant, className, ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ── Avatar ────────────────────────────────────────────────────
interface AvatarProps { src?: string | null; name?: string | null; size?: "xs" | "sm" | "md" | "lg"; className?: string; }
export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const sz = { xs: "h-6 w-6 text-[10px]", sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };
  const initials = name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
  if (src) return <img src={src} alt={name ?? ""} className={cn("rounded-full object-cover", sz[size], className)} />;
  return (
    <div className={cn("flex items-center justify-center rounded-full bg-brand/15 font-semibold text-brand", sz[size], className)}>
      {initials}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

// ── Modal ─────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}
export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full rounded-2xl border border-border bg-surface-1 shadow-2xl", widths[size])}>
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button onClick={onClose} className="ml-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand", className)} />;
}

// ── Empty State ───────────────────────────────────────────────
interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-muted-foreground/40">{icon}</div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-xs text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; label?: string };
  icon?: React.ReactNode;
  iconColor?: string;
}
export function StatCard({ label, value, sub, trend, icon, iconColor = "bg-brand/10 text-brand" }: StatCardProps) {
  const up = (trend?.value ?? 0) >= 0;
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <div className={cn("rounded-lg p-2", iconColor)}>{icon}</div>}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {trend !== undefined && (
        <p className={cn("mt-2 text-xs font-medium", up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
          {up ? "↑" : "↓"} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
        </p>
      )}
    </div>
  );
}
