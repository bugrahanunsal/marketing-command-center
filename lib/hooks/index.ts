"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

// ── useUser ──────────────────────────────────────────────────
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

// ── useProfile ───────────────────────────────────────────────
export function useProfile() {
  const { user, loading: ul } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ul) return;
    if (!user) { setLoading(false); return; }
    const sb = createClient();
    sb.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user, ul]);

  return { profile, user, loading: loading || ul };
}

// ── useDebounce ───────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── useLocalStorage ───────────────────────────────────────────
export function useLocalStorage<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try { return JSON.parse(window.localStorage.getItem(key) ?? "") ?? initial; }
    catch { return initial; }
  });
  const set = useCallback((value: T | ((prev: T) => T)) => {
    setV((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [v, set] as const;
}

// ── useClickOutside ───────────────────────────────────────────
export function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [callback]);
  return ref;
}
