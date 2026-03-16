"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, CheckSquare, Calendar, Tag, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Input, Select, Textarea, FormField, EmptyState, Badge, Spinner } from "@/components/ui";
import { createTask, updateTask, deleteTask } from "@/lib/actions";
import { cn, fmtDate } from "@/lib/utils";
import type { Task, TaskStatus, TaskPriority } from "@/types";

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const EMPTY = { title: "", description: "", status: "todo" as TaskStatus, priority: "medium" as TaskPriority, due_date: "", project: "" };

export default function TaskManager({ initialTasks, userId }: { initialTasks: Task[]; userId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<"board" | "list">("board");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [isPending, start] = useTransition();

  const setF = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function openCreate() { setForm(EMPTY); setEditing(null); setShowModal(true); }
  function openEdit(t: Task) {
    setForm({ title: t.title, description: t.description ?? "", status: t.status, priority: t.priority, due_date: t.due_date ?? "", project: t.project ?? "" });
    setEditing(t); setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload = { title: form.title, description: form.description || null, status: form.status, priority: form.priority, due_date: form.due_date || null, project: form.project || null, tags: [] };
    start(async () => {
      try {
        if (editing) {
          await updateTask(editing.id, payload);
          setTasks((p) => p.map((t) => t.id === editing.id ? { ...t, ...payload, updated_at: new Date().toISOString() } : t));
          toast.success("Task updated");
        } else {
          await createTask(payload);
          // Optimistic: refetch would be better; for now close + refresh
          toast.success("Task created");
          window.location.reload();
        }
        setShowModal(false);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    start(async () => {
      try {
        await deleteTask(id);
        setTasks((p) => p.filter((t) => t.id !== id));
        toast.success("Task deleted");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by status for board view
  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s.value] = filtered.filter((t) => t.status === s.value);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Manager</h1>
          <p className="page-subtitle">{tasks.length} tasks · {tasks.filter((t) => t.status === "done").length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {(["board", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors", view === v ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground")}>
                {v}
              </button>
            ))}
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> New task</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[200px]" />
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-[140px]">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)} className="w-[140px]">
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
      </div>

      {/* Board view */}
      {view === "board" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map(({ value, label }) => (
            <div key={value} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className={cn("badge status-" + value, "capitalize")}>{label}</span>
                <span className="text-xs text-muted-foreground">{byStatus[value].length}</span>
              </div>
              <div className="min-h-[200px] space-y-2 rounded-xl border border-border bg-surface-1 p-2">
                {byStatus[value].length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>
                ) : byStatus[value].map((task) => (
                  <div key={task.id} className="group rounded-lg border border-border bg-surface-0 p-3 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)} className="rounded p-1 text-muted-foreground hover:text-foreground"><Edit2 className="h-3 w-3" /></button>
                        <button onClick={() => handleDelete(task.id)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={cn("badge priority-" + task.priority, "text-[10px]")}>{task.priority}</span>
                      {task.due_date && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5" />{fmtDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={<CheckSquare className="h-10 w-10" />} title="No tasks found" description="Create your first task or adjust filters." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New task</Button>} />
          ) : (
            <table className="data-table">
              <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Project</th><th>Due date</th><th></th></tr></thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td className="max-w-[240px]"><p className="truncate font-medium text-foreground">{task.title}</p>{task.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>}</td>
                    <td><span className={cn("badge status-" + task.status, "capitalize text-xs")}>{task.status.replace("_", " ")}</span></td>
                    <td><span className={cn("badge priority-" + task.priority, "capitalize text-xs")}>{task.priority}</span></td>
                    <td className="text-xs text-muted-foreground">{task.project ?? "—"}</td>
                    <td className="text-xs text-muted-foreground">{task.due_date ? fmtDate(task.due_date) : "—"}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(task)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(task.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit task" : "New task"}>
        <div className="space-y-4">
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="Task title…" /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Optional description…" rows={3} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setF("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onChange={(e) => setF("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Due date"><Input type="date" value={form.due_date} onChange={(e) => setF("due_date", e.target.value)} /></FormField>
            <FormField label="Project"><Input value={form.project} onChange={(e) => setF("project", e.target.value)} placeholder="Project name…" /></FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending}>{editing ? "Save changes" : "Create task"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
