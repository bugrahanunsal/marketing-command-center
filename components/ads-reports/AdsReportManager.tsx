"use client";
import { useState, useTransition } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Input, Textarea, FormField, EmptyState, StatCard } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface AdsReport {
  id: string;
  user_id: string;
  report_date: string;
  week_start: string;
  week_end: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpc: number;
  ctr: number;
  prev_year_impressions: number;
  prev_year_clicks: number;
  prev_year_spend: number;
  prev_year_conversions: number;
  prev_year_revenue: number;
  prev_year_roas: number;
  shopify_orders: number;
  shopify_revenue: number;
  shopify_aov: number;
  prev_year_shopify_orders: number;
  prev_year_shopify_revenue: number;
  notes: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
}

const EMPTY = {
  report_date: "", week_start: "", week_end: "",
  impressions: "", clicks: "", spend: "", conversions: "", revenue: "", roas: "", cpc: "", ctr: "",
  prev_year_impressions: "", prev_year_clicks: "", prev_year_spend: "", prev_year_conversions: "", prev_year_revenue: "", prev_year_roas: "",
  shopify_orders: "", shopify_revenue: "", shopify_aov: "",
  prev_year_shopify_orders: "", prev_year_shopify_revenue: "",
  notes: "",
};

function pct(curr: number, prev: number) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

function Change({ curr, prev }: { curr: number; prev: number }) {
  const p = pct(curr, prev);
  if (p === null) return <span className="text-xs text-muted-foreground">—</span>;
  const up = p >= 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", up ? "text-green-600" : "text-red-500")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{p.toFixed(1)}%
    </span>
  );
}

export default function AdsReportManager({ initialReports, userId, profile }: { initialReports: AdsReport[]; userId: string; profile: Profile | null }) {
  const [reports, setReports] = useState<AdsReport[]>(initialReports);
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AdsReport | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [activeTab, setActiveTab] = useState<"current" | "prev" | "shopify">("current");
  const [isPending, start] = useTransition();
  const isAdmin = profile?.role === "admin";
  const setF = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.report_date) { toast.error("Report date is required"); return; }
    start(async () => {
      try {
        const sb = createClient();
        const n = (v: string) => parseFloat(v) || 0;
        const payload = {
          user_id: userId,
          report_date: form.report_date,
          week_start: form.week_start || null,
          week_end: form.week_end || null,
          impressions: n(form.impressions), clicks: n(form.clicks), spend: n(form.spend),
          conversions: n(form.conversions), revenue: n(form.revenue), roas: n(form.roas),
          cpc: n(form.cpc), ctr: n(form.ctr),
          prev_year_impressions: n(form.prev_year_impressions), prev_year_clicks: n(form.prev_year_clicks),
          prev_year_spend: n(form.prev_year_spend), prev_year_conversions: n(form.prev_year_conversions),
          prev_year_revenue: n(form.prev_year_revenue), prev_year_roas: n(form.prev_year_roas),
          shopify_orders: n(form.shopify_orders), shopify_revenue: n(form.shopify_revenue),
          shopify_aov: n(form.shopify_aov), prev_year_shopify_orders: n(form.prev_year_shopify_orders),
          prev_year_shopify_revenue: n(form.prev_year_shopify_revenue),
          notes: form.notes || null, status: "submitted",
        };
        const { data, error } = await sb.from("ads_reports").insert(payload).select().single();
        if (error) throw new Error(error.message);
        setReports((p) => [data, ...p]);
        setShowModal(false); setForm(EMPTY);
        toast.success("Report submitted!");
      } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Error"); }
    });
  }

  async function handleAdminNote() {
    if (!selectedReport) return;
    start(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.from("ads_reports").update({ admin_notes: adminNote, status: "reviewed" }).eq("id", selectedReport.id);
        if (error) throw new Error(error.message);
        setReports((p) => p.map((r) => r.id === selectedReport.id ? { ...r, admin_notes: adminNote, status: "reviewed" } : r));
        setShowAdminModal(false);
        toast.success("Note saved!");
      } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Error"); }
    });
  }

  const totalSpend = reports.reduce((s, r) => s + Number(r.spend), 0);
  const totalRevenue = reports.reduce((s, r) => s + Number(r.revenue), 0);
  const avgRoas = reports.length ? reports.reduce((s, r) => s + Number(r.roas), 0) / reports.length : 0;
  const totalOrders = reports.reduce((s, r) => s + Number(r.shopify_orders), 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ads Reports</h1>
          <p className="page-subtitle">Weekly ads performance with year-over-year comparison</p>
        </div>
        {!isAdmin && <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Submit Report</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Spend" value={`$${totalSpend.toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-red-500/10 text-red-500" />
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
        <StatCard label="Avg ROAS" value={avgRoas.toFixed(2) + "x"} icon={<BarChart2 className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
        <StatCard label="Total Orders" value={totalOrders} icon={<ShoppingBag className="h-4 w-4" />} iconColor="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <EmptyState icon={<BarChart2 className="h-10 w-10" />} title="No reports yet" description="Submit your first weekly ads report." />
        ) : reports.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-foreground">{fmtDate(r.report_date)}</span>
                  {r.week_start && r.week_end && (
                    <span className="text-xs text-muted-foreground">({fmtDate(r.week_start)} — {fmtDate(r.week_end)})</span>
                  )}
                  <span className={cn("badge text-xs", {
                    "bg-amber-500/10 text-amber-600": r.status === "submitted",
                    "bg-blue-500/10 text-blue-600": r.status === "reviewed",
                    "bg-green-500/10 text-green-600": r.status === "approved",
                  })}>{r.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">This Period</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Impressions", curr: r.impressions, prev: r.prev_year_impressions },
                        { label: "Clicks", curr: r.clicks, prev: r.prev_year_clicks },
                        { label: "Spend", curr: r.spend, prev: r.prev_year_spend, prefix: "$" },
                        { label: "Revenue", curr: r.revenue, prev: r.prev_year_revenue, prefix: "$" },
                        { label: "ROAS", curr: r.roas, prev: r.prev_year_roas, suffix: "x" },
                        { label: "Conversions", curr: r.conversions, prev: r.prev_year_conversions },
                      ].map(({ label, curr, prev, prefix = "", suffix = "" }) => (
                        <div key={label} className="p-2 rounded-lg bg-surface-2">
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                          <p className="text-sm font-bold text-foreground">{prefix}{Number(curr).toLocaleString()}{suffix}</p>
                          <Change curr={Number(curr)} prev={Number(prev)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shopify</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Orders", curr: r.shopify_orders, prev: r.prev_year_shopify_orders },
                        { label: "Revenue", curr: r.shopify_revenue, prev: r.prev_year_shopify_revenue, prefix: "$" },
                        { label: "AOV", curr: r.shopify_aov, prev: 0, prefix: "$" },
                      ].map(({ label, curr, prev, prefix = "" }) => (
                        <div key={label} className="p-2 rounded-lg bg-surface-2">
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                          <p className="text-sm font-bold text-foreground">{prefix}{Number(curr).toLocaleString()}</p>
                          {prev > 0 && <Change curr={Number(curr)} prev={Number(prev)} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {r.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-surface-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{r.notes}</p>
                  </div>
                )}
                {r.admin_notes && (
                  <div className="mt-2 p-3 rounded-lg bg-brand/5 border border-brand/20">
                    <p className="text-xs font-medium text-brand mb-1">Admin Note</p>
                    <p className="text-sm text-foreground">{r.admin_notes}</p>
                  </div>
                )}
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => { setSelectedReport(r); setAdminNote(r.admin_notes ?? ""); setShowAdminModal(true); }}>
                  <MessageSquare className="h-3.5 w-3.5" /> Note
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit Weekly Ads Report" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Report Date" required><Input type="date" value={form.report_date} onChange={(e) => setF("report_date", e.target.value)} /></FormField>
            <FormField label="Week Start"><Input type="date" value={form.week_start} onChange={(e) => setF("week_start", e.target.value)} /></FormField>
            <FormField label="Week End"><Input type="date" value={form.week_end} onChange={(e) => setF("week_end", e.target.value)} /></FormField>
          </div>

          <div className="flex gap-1 rounded-lg border border-border bg-surface-1 p-1 w-fit">
            {(["current", "prev", "shopify"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors", activeTab === t ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground")}>
                {t === "current" ? "This Period" : t === "prev" ? "Previous Year" : "Shopify"}
              </button>
            ))}
          </div>

          {activeTab === "current" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "impressions", label: "Impressions" }, { key: "clicks", label: "Clicks" },
                { key: "spend", label: "Ad Spend ($)" }, { key: "revenue", label: "Revenue ($)" },
                { key: "conversions", label: "Conversions" }, { key: "roas", label: "ROAS" },
                { key: "cpc", label: "CPC ($)" }, { key: "ctr", label: "CTR (%)" },
              ].map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <Input type="number" step="0.01" value={form[key as keyof typeof EMPTY]} onChange={(e) => setF(key as keyof typeof EMPTY, e.target.value)} placeholder="0" />
                </FormField>
              ))}
            </div>
          )}

          {activeTab === "prev" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "prev_year_impressions", label: "Impressions (Prev Year)" },
                { key: "prev_year_clicks", label: "Clicks (Prev Year)" },
                { key: "prev_year_spend", label: "Spend (Prev Year) ($)" },
                { key: "prev_year_revenue", label: "Revenue (Prev Year) ($)" },
                { key: "prev_year_conversions", label: "Conversions (Prev Year)" },
                { key: "prev_year_roas", label: "ROAS (Prev Year)" },
              ].map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <Input type="number" step="0.01" value={form[key as keyof typeof EMPTY]} onChange={(e) => setF(key as keyof typeof EMPTY, e.target.value)} placeholder="0" />
                </FormField>
              ))}
            </div>
          )}

          {activeTab === "shopify" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "shopify_orders", label: "Orders" },
                { key: "shopify_revenue", label: "Revenue ($)" },
                { key: "shopify_aov", label: "AOV ($)" },
                { key: "prev_year_shopify_orders", label: "Orders (Prev Year)" },
                { key: "prev_year_shopify_revenue", label: "Revenue (Prev Year) ($)" },
              ].map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <Input type="number" step="0.01" value={form[key as keyof typeof EMPTY]} onChange={(e) => setF(key as keyof typeof EMPTY, e.target.value)} placeholder="0" />
                </FormField>
              ))}
            </div>
          )}

          <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} placeholder="Campaign notes..." rows={2} /></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>Submit Report</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAdminModal} onClose={() => setShowAdminModal(false)} title="Add Admin Note">
        <div className="space-y-4">
          <FormField label="Admin Note"><Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Write your feedback..." rows={4} /></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAdminModal(false)}>Cancel</Button>
            <Button onClick={handleAdminNote} loading={isPending}>Save Note</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
