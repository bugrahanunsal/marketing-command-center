"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, Link2, ExternalLink, Shield, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Input, Select, Textarea, FormField, EmptyState, StatCard, Badge } from "@/components/ui";
import { createBacklink, updateBacklink, deleteBacklink } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Backlink, BacklinkType, BacklinkStatus } from "@/types";

const STATUSES: { value: BacklinkStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "lost", label: "Lost" },
  { value: "pending", label: "Pending" },
];

const EMPTY = {
  source_url: "", target_url: "", anchor_text: "",
  domain_authority: "", link_type: "dofollow" as BacklinkType,
  status: "active" as BacklinkStatus, notes: "",
};

export default function BacklinkTracker({ initialBacklinks, userId }: { initialBacklinks: Backlink[]; userId: string }) {
  const [backlinks, setBacklinks] = useState<Backlink[]>(initialBacklinks);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Backlink | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BacklinkStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<BacklinkType | "all">("all");
  const [isPending, start] = useTransition();

  const setF = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const total = backlinks.length;
  const active = backlinks.filter((b) => b.status === "active").length;
  const dofollow = backlinks.filter((b) => b.link_type === "dofollow").length;
  const avgDA = total
    ? Math.round(backlinks.reduce((s, b) => s + (b.domain_authority ?? 0), 0) / total)
    : 0;

  function openCreate() { setForm(EMPTY); setEditing(null); setShowModal(true); }
  function openEdit(b: Backlink) {
    setForm({
      source_url: b.source_url, target_url: b.target_url,
      anchor_text: b.anchor_text ?? "", domain_authority: b.domain_authority?.toString() ?? "",
      link_type: b.link_type, status: b.status, notes: b.notes ?? "",
    });
    setEditing(b); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.source_url || !form.target_url) { toast.error("Source and target URLs are required"); return; }
    const payload = {
      source_url: form.source_url, target_url: form.target_url,
      anchor_text: form.anchor_text || null,
      domain_authority: form.domain_authority ? Number(form.domain_authority) : null,
      link_type: form.link_type, status: form.status, notes: form.notes || null,
    };
    start(async () => {
      try {
        if (editing) {
          await updateBacklink(editing.id, payload);
          setBacklinks((p) => p.map((b) => b.id === editing.id ? { ...b, ...payload } : b));
          toast.success("Backlink updated");
        } else {
          await createBacklink(payload);
          toast.success("Backlink added");
          window.location.reload();
        }
        setShowModal(false);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this backlink?")) return;
    start(async () => {
      try { await deleteBacklink(id); setBacklinks((p) => p.filter((b) => b.id !== id)); toast.success("Deleted"); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  const filtered = backlinks.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (typeFilter !== "all" && b.link_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.source_url.toLowerCase().includes(q) && !(b.anchor_text ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function hostname(url: string) {
    try { return new URL(url).hostname; } catch { return url; }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backlink Tracker</h1>
          <p className="page-subtitle">Monitor and manage your link building campaigns</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add backlink</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Backlinks" value={total} icon={<Link2 className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
        <StatCard label="Active" value={active} sub={`${total - active} lost/pending`} icon={<Shield className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
        <StatCard label="Dofollow" value={dofollow} sub={`${total - dofollow} nofollow`} icon={<Shield className="h-4 w-4" />} iconColor="bg-amber-500/10 text-amber-500" />
        <StatCard label="Avg. Domain Authority" value={avgDA || "—"} icon={<Link2 className="h-4 w-4" />} iconColor="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <Input placeholder="Search backlinks…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[220px]" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-[130px]">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-[130px]">
            <option value="all">All types</option>
            <option value="dofollow">Dofollow</option>
            <option value="nofollow">Nofollow</option>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} links</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Link2 className="h-10 w-10" />}
            title="No backlinks yet"
            description="Start tracking your link building efforts."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add backlink</Button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Source domain</th>
                <th>Target URL</th>
                <th>Anchor text</th>
                <th>DA</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <a href={b.source_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-brand hover:underline">
                      {hostname(b.source_url)}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  </td>
                  <td className="max-w-[160px] truncate text-xs text-muted-foreground">{b.target_url}</td>
                  <td className="text-sm text-muted-foreground">{b.anchor_text ?? "—"}</td>
                  <td>
                    <span className={cn("font-mono text-sm font-semibold",
                      (b.domain_authority ?? 0) >= 60 ? "text-green-600 dark:text-green-400" :
                      (b.domain_authority ?? 0) >= 30 ? "text-amber-600 dark:text-amber-400" :
                      "text-muted-foreground")}>
                      {b.domain_authority ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className={cn("badge text-[10px]",
                      b.link_type === "dofollow"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-surface-2 text-muted-foreground")}>
                      {b.link_type === "dofollow" ? <Shield className="h-2.5 w-2.5 inline mr-0.5" /> : <ShieldOff className="h-2.5 w-2.5 inline mr-0.5" />}
                      {b.link_type}
                    </span>
                  </td>
                  <td><span className={cn("badge text-[10px] status-" + b.status)}>{b.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(b)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(b.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit backlink" : "Add backlink"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Source URL" required>
              <Input value={form.source_url} onChange={(e) => setF("source_url", e.target.value)} placeholder="https://referring-site.com/page" />
            </FormField>
            <FormField label="Target URL" required>
              <Input value={form.target_url} onChange={(e) => setF("target_url", e.target.value)} placeholder="https://yoursite.com/page" />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Anchor text">
              <Input value={form.anchor_text} onChange={(e) => setF("anchor_text", e.target.value)} placeholder="keyword phrase" />
            </FormField>
            <FormField label="Domain Authority">
              <Input type="number" min="0" max="100" value={form.domain_authority} onChange={(e) => setF("domain_authority", e.target.value)} placeholder="0–100" />
            </FormField>
            <FormField label="Link type">
              <Select value={form.link_type} onChange={(e) => setF("link_type", e.target.value)}>
                <option value="dofollow">Dofollow</option>
                <option value="nofollow">Nofollow</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setF("status", e.target.value)} className="w-[160px]">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} rows={2} placeholder="Optional notes…" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>{editing ? "Save changes" : "Add backlink"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
