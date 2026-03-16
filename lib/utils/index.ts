import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const fmtDate = (d: string | Date, fmt = "MMM d, yyyy") =>
  format(typeof d === "string" ? parseISO(d) : d, fmt);

export const fmtRelative = (d: string | Date) =>
  formatDistanceToNow(typeof d === "string" ? parseISO(d) : d, { addSuffix: true });

export const fmtNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const fmtCurrency = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

export const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const absoluteUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}${path}`;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
