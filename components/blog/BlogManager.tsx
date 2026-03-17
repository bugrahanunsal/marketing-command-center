"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, FileText, Sparkles, Loader2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import {
  Button, Input, Select, Textarea, FormField, EmptyState, StatCard, Spinner
} from "@/components/ui";
import { createBlogPost, updateBlogPost, deleteBlogPost } from "@/lib/actions";
import { cn, fmtDate } from "@/lib/utils";
import type { BlogPost, BlogStatus } from "@/types";
import type { AiGenerateInput } from "@/lib/validations";

const STATUSES: { value: BlogStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const TONES = ["professional", "casual", "technical", "persuasive"] as const;
const LENGTHS = [
  { value: "short", label: "Short (~400 words)" },
  { value: "medium", label: "Medium (~800 words)" },
  { value: "long", label: "Long (~1,400 words)" },
] as const;

const EMPTY_POST = { title: "", content: "", excerpt: "", meta_title: "", meta_description: "", tags: "", status: "draft" as BlogStatus };
const EMPTY_AI: AiGenerateInput = { topic: "", keywords: "", tone: "professional", length: "medium" };

export default function BlogManager({ initialPosts, userId }: { initialPosts: BlogPost[]; userId: string }) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [tab, setTab] = useState<"posts" | "editor" | "ai">("posts");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState(EMPTY_POST);
  const [aiForm, setAiForm] = useState<AiGenerateInput>(EMPTY_AI);
  const [aiResult, setAiResult] = useState<{ title: string; content: string; excerpt: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogStatus | "all">("all");
  const [isPending, start] = useTransition();

  const total = posts.length;
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  const setP = (k: keyof typeof EMPTY_POST, v: string) => setPostForm((prev) => ({ ...prev, [k]: v }));
  const setA = (k: keyof AiGenerateInput, v: string) =>
    setAiForm((prev) => ({ ...prev, [k]: v } as AiGenerateInput));

  function openNew() {
    setPostForm(EMPTY_POST);
    setEditingPost(null);
    setTab("editor");
  }

  function openEdit(post: BlogPost) {
    setPostForm({
      title: post.title,
      content: post.content ?? "",
      excerpt: post.excerpt ?? "",
      meta_title: post.meta_title ?? "",
      meta_description: post.meta_description ?? "",
      tags: post.tags.join(", "),
      status: post.status,
    });
    setEditingPost(post);
    setTab("editor");
  }

  async function handleSavePost() {
    if (!postForm.title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: postForm.title,
      content: postForm.content || null,
      excerpt: postForm.excerpt || null,
      meta_title: postForm.meta_title || null,
      meta_description: postForm.meta_description || null,
      tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: postForm.status,
    };
    start(async () => {
      try {
        if (editingPost) {
          await updateBlogPost(editingPost.id, payload);
          setPosts((p) => p.map((post) => post.id === editingPost.id
            ? { ...post, ...payload, updated_at: new Date().toISOString() } : post));
          toast.success("Post updated");
        } else {
          await createBlogPost(payload);
          toast.success("Post created");
          window.location.reload();
        }
        setTab("posts");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    start(async () => {
      try { await deleteBlogPost(id); setPosts((p) => p.filter((post) => post.id !== id)); toast.success("Deleted"); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  async function handleAIGenerate() {
    if (!aiForm.topic.trim()) { toast.error("Topic is required"); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }
      const data = await res.json();
      setAiResult(data);
      toast.success("Content generated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  function useAIContent() {
    if (!aiResult) return;
    setPostForm({
      title: aiResult.title,
      content: aiResult.content,
      excerpt: aiResult.excerpt,
      meta_title: aiResult.title,
      meta_description: aiResult.excerpt.slice(0, 155),
      tags: aiForm.keywords ?? "",
      status: "draft",
    });
    setEditingPost(null);
    setTab("editor");
    toast.success("Content loaded into editor");
  }

  const filtered = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Blog & AI Generator</h1>
          <p className="page-subtitle">Write, manage, and AI-generate blog content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTab("ai")}>
            <Sparkles className="h-4 w-4 text-amber-500" /> AI Generate
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> New post</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-1 p-1 w-fit">
        {(["posts", "editor", "ai"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t === "ai" ? "✦ AI Generator" : t === "editor" ? (editingPost ? "Edit post" : "New post") : "Posts"}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === "posts" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total posts" value={total} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-500/10 text-blue-500" />
            <StatCard label="Published" value={published} icon={<Eye className="h-4 w-4" />} iconColor="bg-green-500/10 text-green-500" />
            <StatCard label="Drafts" value={drafts} icon={<Edit2 className="h-4 w-4" />} iconColor="bg-amber-500/10 text-amber-500" />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Input placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[220px]" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BlogStatus | "all")} className="w-[130px]">
                <option value="all">All statuses</option>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
            {filtered.length === 0 ? (
              <EmptyState icon={<FileText className="h-10 w-10" />} title="No posts yet" description="Create your first post or use AI to generate one." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> New post</Button>} />
            ) : (
              <table className="data-table">
                <thead><tr><th>Title</th><th>Status</th><th>Tags</th><th>Created</th><th></th></tr></thead>
                <tbody>
                  {filtered.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <p className="max-w-[280px] truncate font-medium text-foreground">{post.title}</p>
                        {post.excerpt && <p className="mt-0.5 max-w-[280px] truncate text-xs text-muted-foreground">{post.excerpt}</p>}
                      </td>
                      <td><span className={cn("badge status-" + post.status, "text-xs capitalize")}>{post.status}</span></td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                          ))}
                          {post.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{post.tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground">{fmtDate(post.created_at)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(post)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(post.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Editor tab */}
      {tab === "editor" && (
        <div className="card p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <FormField label="Post title" required>
                <Input value={postForm.title} onChange={(e) => setP("title", e.target.value)} placeholder="Enter post title…" className="text-base font-medium" />
              </FormField>
              <FormField label="Content (Markdown supported)">
                <Textarea
                  value={postForm.content}
                  onChange={(e) => setP("content", e.target.value)}
                  placeholder="Start writing your post…"
                  className="min-h-[400px] font-mono text-sm"
                />
              </FormField>
            </div>
            <div className="space-y-4">
              <FormField label="Status">
                <Select value={postForm.status} onChange={(e) => setP("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </FormField>
              <FormField label="Excerpt">
                <Textarea value={postForm.excerpt} onChange={(e) => setP("excerpt", e.target.value)} rows={3} placeholder="Brief post summary…" />
              </FormField>
              <FormField label="Tags (comma-separated)">
                <Input value={postForm.tags} onChange={(e) => setP("tags", e.target.value)} placeholder="seo, marketing, tools" />
              </FormField>
              <FormField label="Meta title">
                <Input value={postForm.meta_title} onChange={(e) => setP("meta_title", e.target.value)} placeholder="SEO title…" />
              </FormField>
              <FormField label="Meta description" hint="Keep under 160 characters">
                <Textarea value={postForm.meta_description} onChange={(e) => setP("meta_description", e.target.value)} rows={2} placeholder="SEO description…" />
                <p className="text-right text-[11px] text-muted-foreground">{postForm.meta_description.length}/160</p>
              </FormField>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setTab("posts")}>Cancel</Button>
                <Button className="flex-1" onClick={handleSavePost} loading={isPending}>
                  {editingPost ? "Save changes" : "Publish draft"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI tab */}
      {tab === "ai" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">AI Blog Generator</h3>
            </div>
            <div className="space-y-4">
              <FormField label="Topic" required>
                <Input value={aiForm.topic} onChange={(e) => setA("topic", e.target.value)} placeholder="e.g. How to improve SEO rankings in 2025" />
              </FormField>
              <FormField label="Target keywords" hint="Comma-separated">
                <Input value={aiForm.keywords} onChange={(e) => setA("keywords", e.target.value)} placeholder="e.g. SEO, rankings, backlinks" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tone">
                  <Select value={aiForm.tone} onChange={(e) => setA("tone", e.target.value)}>
                    {TONES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </Select>
                </FormField>
                <FormField label="Length">
                  <Select value={aiForm.length} onChange={(e) => setA("length", e.target.value)}>
                    {LENGTHS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </Select>
                </FormField>
              </div>
              <Button className="w-full" onClick={handleAIGenerate} disabled={aiLoading}>
                {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate blog post</>}
              </Button>
              {!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase") && (
                <p className="text-xs text-muted-foreground text-center">Configure OPENAI_API_KEY for real AI generation. Demo mode returns placeholder content.</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Generated content</h3>
            {aiLoading && (
              <div className="flex h-48 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner />
                  <p className="text-xs text-muted-foreground">Writing your post…</p>
                </div>
              </div>
            )}
            {!aiLoading && !aiResult && (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">Generated content will appear here</p>
              </div>
            )}
            {aiResult && !aiLoading && (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</p>
                  <p className="text-base font-semibold text-foreground">{aiResult.title}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Excerpt</p>
                  <p className="text-sm text-muted-foreground">{aiResult.excerpt}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Content preview</p>
                  <div className="max-h-[200px] overflow-y-auto rounded-lg bg-surface-2 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {aiResult.content.slice(0, 600)}{aiResult.content.length > 600 ? "…" : ""}
                  </div>
                </div>
                <Button className="w-full" onClick={useAIContent}>
                  <Edit2 className="h-4 w-4" /> Open in editor
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
