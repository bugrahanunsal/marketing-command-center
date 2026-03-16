"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Input, Textarea, FormField, EmptyState, StatCard } from "@/components/ui";
import { createKeyword, updateKeyword, deleteKeyword } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { SeoKeyword } from "@/types";

const EMPTY = { keyword: "", current_rank: "", search_volume: "", difficulty: "", url: "", notes: "" };

export default function SEOTracker({ initialKeywords, userId }: { initialKeywords: SeoKeyword[]; userId: string }) {
  const [keywords, setKeywords] = useState<SeoKeyword[]>(initialKeywords);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SeoKeyword | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [isPending, start] = useTransition();

  const setF = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const total = keywords.length;
  const avgRank = total ? Math.round(keywords.reduce((s, k) => s + (k.current_rank ?? 0), 0) / total) : 0;
  const top10 = keywords.filter((k) => (k.current_rank ?? 999) <= 10).length;
  const totalVolume = keywords.reduce((s, k) => s + (k.search_volume ?? 0), 0);

  function openCreate() { setForm(EMPTY); setEditing(null); setShowModal(true); }
  function openEdit(kw: SeoKeyword) {
    setForm({ keyword: kw.keyword, current_rank: kw.current_rank?.toString() ?? "", search_volume: kw.search_volume?.toString() ?? "", difficulty: kw.difficulty?.toString() ?? "", url: kw.url ?? "", notes: kw.notes ?? "" });
    setEditing(kw); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.keyword.trim()) { toast.error("Keyword is required"); return; }
    const payload = { keyword: form.keyword, current_rank: form.current_rank ? Number(form.current_rank) : null, search_volume: form.search_volume ? Number(form.search_volume) : null, difficulty: form.difficulty ? Number(form.difficulty) : null, url: form.url || null, notes: form.notes || null };
    start(async () => {
      try {
        if (editing) {
          await updateKeyword(editing.id, payload);
          setKeywords((p) => p.map((k) => k.id === editing.id ? { ...k, ...payload, updated_at: new Date().toISOString() } : k));
          toast.success("Keyword updated");
        } else {
          await createKeyword(payload);
          toast.success("Keyword added");
          window.location.reload();
        }
        setShowModal(false);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this keyword?")) return;
    start(async () => {
      try { await deleteKeyword(id); setKeywords((p) => p.filter((k) => k.id !== id)); toast.success("Keyword deleted"); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  const filtered = keywords.filter((k) => !search || k.keyword.toLowerCase().includes(search.toLowerCase()));

  const rankDiff = (kw: SeoKeyword) => {
    if (!kw.current_rank || !kw.previous_rank) return null;
    return kw.previous_rank - kw.current_rank; // positive = improved
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">SEO Tracker</h1>
          <p className="page-subtitle">Monitor keyword rankings and search performance</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add keyword</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Keywords" value={total} icon={<Search className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
        <StatCard label="Avg. Rank" value={avgRank || "—"} sub="across all tracked" icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
        <StatCard label="Top 10" value={top10} sub="ranking in top 10" icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-amber-500/10 text-amber-500" />
        <StatCard label="Total Volume" value={totalVolume.toLocaleString()} sub="monthly searches" icon={<Search className="h-4 w-4" />} iconColor="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Input placeholder="Search keywords…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[240px]" />
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} keywords</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<Search className="h-10 w-10" />} title="No keywords tracked" description="Add your first keyword to start monitoring rankings." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add keyword</Button>} />
        ) : (
          <table className="data-table">
            <thead><tr><th>Keyword</th><th>Rank</th><th>Change</th><th>Volume</th><th>Difficulty</th><th>URL</th><th></th></tr></thead>
            <tbody>
              {filtered.map((kw) => {
                const diff = rankDiff(kw);
                return (
                  <tr key={kw.id}>
                    <td className="font-medium text-foreground">{kw.keyword}</td>
                    <td>
                      <span className={cn("font-mono text-sm font-semibold", (kw.current_rank ?? 999) <= 10 ? "text-green-600 dark:text-green-400" : (kw.current_rank ?? 999) <= 30 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                        {kw.current_rank ? `#${kw.current_rank}` : "—"}
                      </span>
                    </td>
                    <td>
                      {diff === null ? <span className="text-muted-foreground">—</span> : diff > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><TrendingUp className="h-3 w-3" />+{diff}</span>
                      ) : diff < 0 ? (
                        <span className="flex items-center gap-1 text-xs text-red-500"><TrendingDown className="h-3 w-3" />{diff}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="text-sm text-muted-foreground">{kw.search_volume?.toLocaleString() ?? "—"}</td>
                    <td>
                      {kw.difficulty !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
                            <div className={cn("h-full rounded-full", kw.difficulty > 70 ? "bg-red-500" : kw.difficulty > 40 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${kw.difficulty}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{kw.difficulty}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="max-w-[140px] truncate text-xs text-muted-foreground">{kw.url ?? "—"}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(kw)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(kw.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit keyword" : "Add keyword"}>
        <div className="space-y-4">
          <FormField label="Keyword" required><Input value={form.keyword} onChange={(e) => setF("keyword", e.target.value)} placeholder="e.g. best marketing tools" /></FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Current rank"><Input type="number" value={form.current_rank} onChange={(e) => setF("current_rank", e.target.value)} placeholder="e.g. 5" /></FormField>
            <FormField label="Volume/mo"><Input type="number" value={form.search_volume} onChange={(e) => setF("search_volume", e.target.value)} placeholder="e.g. 1200" /></FormField>
            <FormField label="Difficulty (0–100)"><Input type="number" min="0" max="100" value={form.difficulty} onChange={(e) => setF("difficulty", e.target.value)} placeholder="e.g. 45" /></FormField>
          </div>
          <FormField label="Target URL"><Input value={form.url} onChange={(e) => setF("url", e.target.value)} placeholder="https://yoursite.com/page" /></FormField>
          <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} rows={2} placeholder="Optional notes…" /></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>{editing ? "Save" : "Add keyword"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
