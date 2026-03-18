"use client";
import { useState, useTransition } from "react";
import { Plus, FileText, CheckCircle, Clock, Eye, MessageSquare, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Input, Textarea, FormField, EmptyState, StatCard } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface BlogReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_blogs: number;
  published_blogs: number;
  draft_blogs: number;
  notes: string | null;
  admin_notes: string | null;
  status: "submitted" | "reviewed" | "approved";
  created_at: string;
}

const EMPTY = {
  week_start: "", week_end: "",
  total_blogs: "", published_blogs: "", draft_blogs: "", notes: "",
};

export default function BlogReportManager({
  initialReports, userId, profile,
}: {
  initialReports: BlogReport[];
  userId: string;
  profile: Profile | null;
}) {
  const [reports, setReports] = useState<BlogReport[]>(initialReports);
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BlogReport | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [isPending, start] = useTransition();
  const isAdmin = profile?.role === "admin";
  const setF = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.week_start || !form.week_end) { toast.error("Week dates are required"); return; }
    start(async () => {
      try {
        const sb = createClient();
        const { data, error } = await sb.from("blog_reports").insert({
          user_id: userId,
          week_start: form.week_start,
          week_end: form.week_end,
          total_blogs: Number(form.total_blogs) || 0,
          published_blogs: Number(form.published_blogs) || 0,
          draft_blogs: Number(form.draft_blogs) || 0,
          notes: form.notes || null,
          status: "submitted",
        }).select().single();
        if (error) throw new Error(error.message);
        setReports((p) => [data, ...p]);
        setShowModal(false);
        setForm(EMPTY);
        toast.success("Report submitted!");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  async function handleAdminNote() {
    if (!selectedReport) return;
    start(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.from("blog_reports")
          .update({ admin_notes: adminNote, status: "reviewed" })
          .eq("id", selectedReport.id);
        if (error) throw new Error(error.message);
        setReports((p) => p.map((r) => r.id === selectedReport.id
          ? { ...r, admin_notes: adminNote, status: "reviewed" } : r));
        setShowAdminModal(false);
        toast.success("Note saved!");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  async function handleApprove(report: BlogReport) {
    start(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.from("blog_reports")
          .update({ status: "approved" }).eq("id", report.id);
        if (error) throw new Error(error.message);
        setReports((p) => p.map((r) => r.id === report.id ? { ...r, status: "approved" } : r));
        toast.success("Approved!");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  const submitted = reports.filter((r) => r.status === "submitted").length;
  const reviewed = reports.filter((r) => r.status === "reviewed").length;
  const approved = reports.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Blog Reports</h1>
          <p className="page-subtitle">Weekly blog performance reports</p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Submit Report
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Submitted" value={submitted} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-500/10 text-amber-500" />
        <StatCard label="Reviewed" value={reviewed} icon={<Eye className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
        <StatCard label="Approved" value={approved} icon={<CheckCircle className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <EmptyState icon={<FileText className="h-10 w-10" />} title="No reports yet" description="Submit your first weekly blog report." />
        ) : reports.map((report) => (
          <div key={report.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {fmtDate(report.week_start)} — {fmtDate(report.week_end)}
                  </span>
                  <span className={cn("badge text-xs", {
                    "bg-amber-500/10 text-amber-600": report.status === "submitted",
                    "bg-blue-500/10 text-blue-600": report.status === "reviewed",
                    "bg-green-500/10 text-green-600": report.status === "approved",
                  })}>{report.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: "Total", value: report.total_blogs, color: "text-foreground" },
                    { label: "Published", value: report.published_blogs, color: "text-green-600" },
                    { label: "Drafts", value: report.draft_blogs, color: "text-amber-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-3 rounded-lg bg-surface-2">
                      <p className={cn("text-2xl font-bold", color)}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                {report.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-surface-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{report.notes}</p>
                  </div>
                )}
                {report.admin_notes && (
                  <div className="mt-2 p-3 rounded-lg bg-brand/5 border border-brand/20">
                    <p className="text-xs font-medium text-brand mb-1">Admin Note</p>
                    <p className="text-sm text-foreground">{report.admin_notes}</p>
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedReport(report);
                    setAdminNote(report.admin_notes ?? "");
                    setShowAdminModal(true);
                  }}>
                    <MessageSquare className="h-3.5 w-3.5" /> Note
                  </Button>
                  {report.status !== "approved" && (
                    <Button size="sm" onClick={() => handleApprove(report)}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit Weekly Blog Report">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Week Start" required>
              <Input type="date" value={form.week_start} onChange={(e) => setF("week_start", e.target.value)} />
            </FormField>
            <FormField label="Week End" required>
              <Input type="date" value={form.week_end} onChange={(e) => setF("week_end", e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Total Blogs">
              <Input type="number" value={form.total_blogs} onChange={(e) => setF("total_blogs", e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Published">
              <Input type="number" value={form.published_blogs} onChange={(e) => setF("published_blogs", e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Drafts">
              <Input type="number" value={form.draft_blogs} onChange={(e) => setF("draft_blogs", e.target.value)} placeholder="0" />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} placeholder="Any notes about this week..." rows={3} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>Submit Report</Button>
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
