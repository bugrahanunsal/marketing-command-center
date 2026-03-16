"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO,
} from "date-fns";
import toast from "react-hot-toast";
import { Button, Modal, Input, Select, Textarea, FormField, EmptyState, StatCard } from "@/components/ui";
import { createContentItem, updateContentItem, deleteContentItem } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { ContentItem, ContentStatus, ContentType } from "@/types";

const CONTENT_TYPES: { value: ContentType; label: string; color: string }[] = [
  { value: "blog",   label: "Blog",   color: "bg-blue-500" },
  { value: "social", label: "Social", color: "bg-pink-500" },
  { value: "email",  label: "Email",  color: "bg-amber-500" },
  { value: "video",  label: "Video",  color: "bg-red-500" },
  { value: "ad",     label: "Ad",     color: "bg-purple-500" },
];

const STATUSES: { value: ContentStatus; label: string }[] = [
  { value: "idea",       label: "Idea" },
  { value: "draft",      label: "Draft" },
  { value: "in_review",  label: "In Review" },
  { value: "scheduled",  label: "Scheduled" },
  { value: "published",  label: "Published" },
];

const EMPTY = {
  title: "", content_type: "blog" as ContentType,
  status: "idea" as ContentStatus, scheduled_date: "",
  platform: "", notes: "",
};

export default function ContentCalendar({ initialItems, userId }: { initialItems: ContentItem[]; userId: string }) {
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [isPending, start] = useTransition();

  const setF = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const total = items.length;
  const published = items.filter((i) => i.status === "published").length;
  const scheduled = items.filter((i) => i.status === "scheduled").length;
  const drafts = items.filter((i) => i.status === "draft" || i.status === "idea").length;

  function openCreate(date?: Date) {
    setForm({ ...EMPTY, scheduled_date: date ? format(date, "yyyy-MM-dd") : "" });
    setEditing(null); setShowModal(true);
  }
  function openEdit(item: ContentItem) {
    setForm({
      title: item.title, content_type: item.content_type, status: item.status,
      scheduled_date: item.scheduled_date ?? "", platform: item.platform ?? "", notes: item.notes ?? "",
    });
    setEditing(item); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: form.title, content_type: form.content_type, status: form.status,
      scheduled_date: form.scheduled_date || null, platform: form.platform || null, notes: form.notes || null,
    };
    start(async () => {
      try {
        if (editing) {
          await updateContentItem(editing.id, payload);
          setItems((p) => p.map((i) => i.id === editing.id ? { ...i, ...payload, updated_at: new Date().toISOString() } : i));
          toast.success("Updated");
        } else {
          await createContentItem(payload);
          toast.success("Content added");
          window.location.reload();
        }
        setShowModal(false);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content item?")) return;
    start(async () => {
      try { await deleteContentItem(id); setItems((p) => p.filter((i) => i.id !== id)); toast.success("Deleted"); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  // Calendar helpers
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = startOfMonth(currentMonth).getDay(); // 0=Sun

  function itemsForDay(day: Date) {
    return items.filter((i) => i.scheduled_date && isSameDay(parseISO(i.scheduled_date), day));
  }

  function typeColor(type: ContentType) {
    return CONTENT_TYPES.find((t) => t.value === type)?.color ?? "bg-zinc-500";
  }

  const selectedItems = selectedDay ? itemsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Calendar</h1>
          <p className="page-subtitle">Plan and track your content publishing schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {(["calendar", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  view === v ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground")}>
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => openCreate()}><Plus className="h-4 w-4" /> Add content</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total items" value={total} icon={<CalendarDays className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
        <StatCard label="Published" value={published} icon={<CalendarDays className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
        <StatCard label="Scheduled" value={scheduled} icon={<CalendarDays className="h-4 w-4" />} iconColor="bg-amber-500/10 text-amber-500" />
        <StatCard label="Drafts / Ideas" value={drafts} icon={<CalendarDays className="h-4 w-4" />} iconColor="bg-purple-500/10 text-purple-500" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {CONTENT_TYPES.map((t) => (
          <span key={t.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", t.color)} />{t.label}
          </span>
        ))}
      </div>

      {view === "calendar" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Calendar grid */}
          <div className="card overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-semibold text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day of week headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {/* Padding cells */}
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-border/50 bg-surface-0/50 last:border-r-0" />
              ))}
              {days.map((day, idx) => {
                const dayItems = itemsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const colPos = (idx + startPad) % 7;
                return (
                  <div key={day.toISOString()}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                    className={cn(
                      "min-h-[80px] cursor-pointer border-b border-r border-border/50 p-1.5 transition-colors",
                      colPos === 6 && "border-r-0",
                      isToday(day) && "bg-brand/5",
                      isSelected && "bg-brand/10",
                      "hover:bg-surface-2"
                    )}>
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day) && "bg-brand text-white",
                      !isToday(day) && "text-foreground",
                    )}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayItems.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] hover:opacity-80"
                          style={{ background: "hsl(var(--surface-3))" }}
                          onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", typeColor(item.content_type))} />
                          <span className="truncate text-foreground">{item.title}</span>
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <p className="px-1 text-[10px] text-muted-foreground">+{dayItems.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day sidebar */}
          <div className="card p-4">
            {selectedDay ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{format(selectedDay, "MMMM d, yyyy")}</h3>
                  <Button size="icon-sm" onClick={() => openCreate(selectedDay)}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
                {selectedItems.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">Nothing scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="group rounded-lg border border-border p-3 hover:bg-surface-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(item)} className="rounded p-1 text-muted-foreground hover:text-foreground"><Edit2 className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(item.id)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="mt-1.5 flex gap-1.5">
                          <span className={cn("badge status-" + item.status, "text-[10px]")}>{item.status.replace("_", " ")}</span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className={cn("h-1.5 w-1.5 rounded-full", typeColor(item.content_type))} />
                            {item.content_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Click a day to see content</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="card overflow-hidden">
          {items.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No content scheduled" description="Start planning your content calendar." action={<Button onClick={() => openCreate()}><Plus className="h-4 w-4" /> Add content</Button>} />
          ) : (
            <table className="data-table">
              <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Platform</th><th>Scheduled date</th><th></th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-foreground">{item.title}</td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                        <span className={cn("h-2 w-2 rounded-full", typeColor(item.content_type))} />
                        {item.content_type}
                      </span>
                    </td>
                    <td><span className={cn("badge status-" + item.status, "text-xs capitalize")}>{item.status.replace("_", " ")}</span></td>
                    <td className="text-xs text-muted-foreground">{item.platform ?? "—"}</td>
                    <td className="text-xs text-muted-foreground">{item.scheduled_date ?? "—"}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(item.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit content" : "Add content"}>
        <div className="space-y-4">
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="Content title…" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type">
              <Select value={form.content_type} onChange={(e) => setF("content_type", e.target.value)}>
                {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setF("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Scheduled date"><Input type="date" value={form.scheduled_date} onChange={(e) => setF("scheduled_date", e.target.value)} /></FormField>
            <FormField label="Platform"><Input value={form.platform} onChange={(e) => setF("platform", e.target.value)} placeholder="e.g. WordPress, Twitter" /></FormField>
          </div>
          <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} rows={2} placeholder="Optional notes…" /></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>{editing ? "Save changes" : "Add content"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
