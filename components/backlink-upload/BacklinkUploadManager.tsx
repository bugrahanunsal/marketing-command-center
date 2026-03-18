"use client";
import { useState, useTransition } from "react";
import { Upload, Link2, Shield, TrendingUp, FileText, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Textarea, FormField, EmptyState, StatCard } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface BacklinkUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  total_backlinks: number;
  dofollow_count: number;
  nofollow_count: number;
  high_da_count: number;
  niche_count: number;
  notes: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
}

export default function BacklinkUploadManager({
  initialUploads, userId, profile,
}: {
  initialUploads: BacklinkUpload[];
  userId: string;
  profile: Profile | null;
}) {
  const [uploads, setUploads] = useState<BacklinkUpload[]>(initialUploads);
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<BacklinkUpload | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{total:number;dofollow:number;nofollow:number;highDA:number;niche:number} | null>(null);
  const [isPending, start] = useTransition();
  const isAdmin = profile?.role === "admin";

  async function parseFile(f: File) {
    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
          let dofollow = 0, nofollow = 0, highDA = 0, niche = 0;
          rows.forEach((row) => {
            const type = (row["link_type"] || row["Link Type"] || row["type"] || "dofollow").toString().toLowerCase();
            const da = parseInt((row["domain_authority"] || row["DA"] || "0").toString());
            const cat = (row["category"] || row["Category"] || row["niche"] || "").toString().toLowerCase();
            if (type.includes("dofollow")) dofollow++; else nofollow++;
            if (da >= 50) highDA++;
            if (cat && cat !== "" && cat !== "general") niche++;
          });
          setParsed({ total: rows.length, dofollow, nofollow, highDA, niche });
          toast.success(`Parsed ${rows.length} backlinks!`);
        } catch {
          toast.error("Could not parse file.");
        }
      };
      reader.readAsArrayBuffer(f);
    } catch {
      toast.error("Failed to load parser.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    parseFile(f);
  }

  async function handleSubmit() {
    if (!file || !parsed) { toast.error("Please upload a file first"); return; }
    start(async () => {
      try {
        const sb = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase();
        const fileType = ext === "pdf" ? "pdf" : ext === "csv" ? "csv" : "excel";
        const { data, error } = await sb.from("backlink_uploads").insert({
          user_id: userId,
          file_name: file.name,
          file_type: fileType,
          total_backlinks: parsed.total,
          dofollow_count: parsed.dofollow,
          nofollow_count: parsed.nofollow,
          high_da_count: parsed.highDA,
          niche_count: parsed.niche,
          notes: notes || null,
          status: "pending",
        }).select().single();
        if (error) throw new Error(error.message);
        setUploads((p) => [data, ...p]);
        setShowModal(false);
        setFile(null); setParsed(null); setNotes("");
        toast.success("Upload submitted!");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  async function handleAdminNote() {
    if (!selectedUpload) return;
    start(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.from("backlink_uploads")
          .update({ admin_notes: adminNote, status: "reviewed" }).eq("id", selectedUpload.id);
        if (error) throw new Error(error.message);
        setUploads((p) => p.map((u) => u.id === selectedUpload.id
          ? { ...u, admin_notes: adminNote, status: "reviewed" } : u));
        setShowAdminModal(false);
        toast.success("Note saved!");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  const totalBacklinks = uploads.reduce((s, u) => s + u.total_backlinks, 0);
  const totalDofollow = uploads.reduce((s, u) => s + u.dofollow_count, 0);
  const totalHighDA = uploads.reduce((s, u) => s + u.high_da_count, 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backlink Upload & Analysis</h1>
          <p className="page-subtitle">Upload and analyze your backlink reports</p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowModal(true)}>
            <Upload className="h-4 w-4" /> Upload Report
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Backlinks" value={totalBacklinks} icon={<Link2 className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
        <StatCard label="Dofollow" value={totalDofollow} icon={<Shield className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
        <StatCard label="High DA (50+)" value={totalHighDA} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-purple-500/10 text-purple-500" />
        <StatCard label="Reports" value={uploads.length} icon={<FileText className="h-4 w-4" />} iconColor="bg-amber-500/10 text-amber-500" />
      </div>

      <div className="space-y-3">
        {uploads.length === 0 ? (
          <EmptyState icon={<Upload className="h-10 w-10" />} title="No uploads yet" description="Upload your first backlink report." />
        ) : uploads.map((upload) => (
          <div key={upload.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{upload.file_name}</span>
                  <span className={cn("badge text-xs", {
                    "bg-amber-500/10 text-amber-600": upload.status === "pending",
                    "bg-blue-500/10 text-blue-600": upload.status === "reviewed",
                    "bg-green-500/10 text-green-600": upload.status === "approved",
                  })}>{upload.status}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{fmtDate(upload.created_at)}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: "Total", value: upload.total_backlinks, color: "text-foreground" },
                    { label: "Dofollow", value: upload.dofollow_count, color: "text-green-600" },
                    { label: "Nofollow", value: upload.nofollow_count, color: "text-amber-600" },
                    { label: "High DA", value: upload.high_da_count, color: "text-purple-600" },
                    { label: "Niche", value: upload.niche_count, color: "text-blue-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-lg bg-surface-2">
                      <p className={cn("text-xl font-bold", color)}>{value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {upload.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-surface-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">SEO Specialist Note</p>
                    <p className="text-sm text-foreground">{upload.notes}</p>
                  </div>
                )}
                {upload.admin_notes && (
                  <div className="mt-2 p-3 rounded-lg bg-brand/5 border border-brand/20">
                    <p className="text-xs font-medium text-brand mb-1">Admin Note</p>
                    <p className="text-sm text-foreground">{upload.admin_notes}</p>
                  </div>
                )}
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedUpload(upload);
                  setAdminNote(upload.admin_notes ?? "");
                  setShowAdminModal(true);
                }}>
                  <MessageSquare className="h-3.5 w-3.5" /> Note
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Upload Backlink Report" size="lg">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Upload Excel or CSV</p>
            <p className="text-xs text-muted-foreground mb-4">Columns: source_url, link_type, domain_authority, category</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload" />
            <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
              Choose File
            </Button>
            {file && <p className="text-xs text-brand mt-2">✓ {file.name}</p>}
          </div>
          {parsed && (
            <div className="grid grid-cols-5 gap-2 p-4 rounded-xl bg-surface-2">
              {[
                { label: "Total", value: parsed.total },
                { label: "Dofollow", value: parsed.dofollow },
                { label: "Nofollow", value: parsed.nofollow },
                { label: "High DA", value: parsed.highDA },
                { label: "Niche", value: parsed.niche },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}
          <FormField label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this backlink report..." rows={3} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending} disabled={!parsed}>Submit Report</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAdminModal} onClose={() => setShowAdminModal(false)} title="Add Admin Note">
        <div className="space-y-4">
          <FormField label="Admin Note">
            <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Write your feedback..." rows={4} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAdminModal(false)}>Cancel</Button>
            <Button onClick={handleAdminNote} loading={isPending}>Save Note</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
