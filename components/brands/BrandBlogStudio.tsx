"use client";
import { useState, useTransition } from "react";
import { Plus, Sparkles, Edit2, Trash2, FileText, Eye, ArrowLeft, Loader2, Tag, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Modal, Input, Textarea, FormField, EmptyState, Select } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import Link from "next/link";

interface BrandProfile {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  target_audience: string | null;
  brand_tone: string;
  brand_keywords: string[] | null;
  shopify_url: string | null;
  website_url: string | null;
}

interface BrandPost {
  id: string;
  brand_id: string;
  user_id: string;
  title: string;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  status: string;
  scheduled_date: string | null;
  published_at: string | null;
  created_at: string;
}

const EMPTY_POST = { title: "", content: "", excerpt: "", meta_title: "", meta_description: "", tags: "", status: "draft", scheduled_date: "" };
const EMPTY_AI = { topic: "", keywords: "", length: "medium" as "short" | "medium" | "long", extra_instructions: "" };

export default function BrandBlogStudio({
  brand, initialPosts, userId, profile,
}: {
  brand: BrandProfile;
  initialPosts: BrandPost[];
  userId: string;
  profile: Profile | null;
}) {
  const [posts, setPosts] = useState<BrandPost[]>(initialPosts);
  const [tab, setTab] = useState<"posts" | "editor" | "ai">("posts");
  const [editingPost, setEditingPost] = useState<BrandPost | null>(null);
  const [postForm, setPostForm] = useState(EMPTY_POST);
  const [aiForm, setAiForm] = useState(EMPTY_AI);
  const [aiResult, setAiResult] = useState<{ title: string; content: string; excerpt: string; meta_description: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isPending, start] = useTransition();

  const setP = (k: keyof typeof EMPTY_POST, v: string) => setPostForm((p) => ({ ...p, [k]: v }));
  const setA = (k: keyof typeof EMPTY_AI, v: string) => setAiForm((p) => ({ ...p, [k]: v as never }));

  function openNew() { setPostForm(EMPTY_POST); setEditingPost(null); setTab("editor"); }
  function openEdit(post: BrandPost) {
    setPostForm({
      title: post.title, content: post.content ?? "", excerpt: post.excerpt ?? "",
      meta_title: post.meta_title ?? "", meta_description: post.meta_description ?? "",
      tags: post.tags.join(", "), status: post.status,
      scheduled_date: post.scheduled_date ? post.scheduled_date.split("T")[0] : "",
    });
    setEditingPost(post); setTab("editor");
  }

  async function handleSavePost() {
    if (!postForm.title.trim()) { toast.error("Title is required"); return; }
    start(async () => {
      try {
        const sb = createClient();
        const slug = postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
        const payload = {
          brand_id: brand.id, user_id: userId,
          title: postForm.title, slug,
          content: postForm.content || null, excerpt: postForm.excerpt || null,
          meta_title: postForm.meta_title || null, meta_description: postForm.meta_description || null,
          tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
          status: postForm.status,
          scheduled_date: postForm.scheduled_date ? new Date(postForm.scheduled_date).toISOString() : null,
        };
        if (editingPost) {
          const { error } = await sb.from("brand_blog_posts").update(payload).eq("id", editingPost.id);
          if (error) throw new Error(error.message);
          setPosts((p) => p.map((post) => post.id === editingPost.id ? { ...post, ...payload } : post));
          toast.success("Post updated!");
        } else {
          const { data, error } = await sb.from("brand_blog_posts").insert(payload).select().single();
          if (error) throw new Error(error.message);
          setPosts((p) => [data, ...p]);
          toast.success("Post created!");
        }
        setTab("posts");
      } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Error"); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    start(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.from("brand_blog_posts").delete().eq("id", id);
        if (error) throw new Error(error.message);
        setPosts((p) => p.filter((post) => post.id !== id));
        toast.success("Deleted!");
      } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Error"); }
    });
  }

  async function handleAIGenerate() {
    if (!aiForm.topic.trim()) { toast.error("Topic is required"); return; }
    setAiLoading(true); setAiResult(null);
    try {
      const keywords = [
        ...(brand.brand_keywords ?? []),
        ...aiForm.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      ].join(", ");

      const brandContext = `
Brand: ${brand.name}
Industry: ${brand.industry ?? ""}
Description: ${brand.description ?? ""}
Target Audience: ${brand.target_audience ?? ""}
Brand Voice: ${brand.brand_tone}
Core Keywords: ${keywords}
Website: ${brand.website_url ?? ""}
${aiForm.extra_instructions ? `Additional Instructions: ${aiForm.extra_instructions}` : ""}
      `.trim();

      const res = await fetch("/api/ai/brand-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiForm.topic,
          keywords,
          tone: brand.brand_tone,
          length: aiForm.length,
          brand_context: brandContext,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Generation failed"); }
      const data = await res.json();
      setAiResult(data);
      toast.success("Content generated!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally { setAiLoading(false); }
  }

  function useAIContent() {
    if (!aiResult) return;
    setPostForm({
      title: aiResult.title, content: aiResult.content, excerpt: aiResult.excerpt,
      meta_title: aiResult.title, meta_description: aiResult.meta_description || aiResult.excerpt.slice(0, 155),
      tags: (brand.brand_keywords ?? []).slice(0, 5).join(", "),
      status: "draft", scheduled_date: "",
    });
    setEditingPost(null); setTab("editor");
    toast.success("Content loaded into editor!");
  }

  const wordCount = (postForm.content.match(/\S+/g) ?? []).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/brands">
            <button className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-2">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="page-title">{brand.name} — Blog Studio</h1>
            <p className="page-subtitle">{brand.brand_tone} tone · {(brand.brand_keywords ?? []).slice(0, 3).join(", ")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab("ai")}>
            <Sparkles className="h-4 w-4 text-amber-500" /> AI Generate
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> New Post</Button>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface-1 p-1 w-fit">
        {(["posts", "editor", "ai"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t === "ai" ? "✦ AI Generator" : t === "editor" ? (editingPost ? "Edit Post" : "New Post") : `Posts (${posts.length})`}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="card overflow-hidden">
          {posts.length === 0 ? (
            <EmptyState icon={<FileText className="h-10 w-10" />} title="No posts yet"
              description="Create your first post or use AI to generate one."
              action={<Button onClick={openNew}><Plus className="h-4 w-4" /> New Post</Button>} />
          ) : (
            <table className="data-table">
              <thead><tr><th>Title</th><th>Status</th><th>Scheduled</th><th>Tags</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <p className="max-w-[260px] truncate font-medium text-foreground">{post.title}</p>
                      {post.excerpt && <p className="mt-0.5 max-w-[260px] truncate text-xs text-muted-foreground">{post.excerpt}</p>}
                    </td>
                    <td><span className={cn("badge text-xs capitalize", {
                      "bg-zinc-500/10 text-zinc-600": post.status === "draft",
                      "bg-green-500/10 text-green-600": post.status === "published",
                      "bg-blue-500/10 text-blue-600": post.status === "scheduled",
                    })}>{post.status}</span></td>
                    <td className="text-xs text-muted-foreground">{post.scheduled_date ? fmtDate(post.scheduled_date) : "—"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                        ))}
                        {post.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{post.tags.length - 2}</span>}
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
      )}

      {tab === "editor" && (
        <div className="card p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <FormField label="Post Title" required>
                <Input value={postForm.title} onChange={(e) => setP("title", e.target.value)} placeholder="Enter post title..." className="text-base font-medium" />
              </FormField>
              <FormField label="Content (Markdown supported)">
                <Textarea value={postForm.content} onChange={(e) => setP("content", e.target.value)}
                  placeholder={`Start writing for ${brand.name}...`} className="min-h-[400px] font-mono text-sm" />
                <p className="text-right text-[11px] text-muted-foreground">{wordCount} words</p>
              </FormField>
            </div>
            <div className="space-y-4">
              <FormField label="Status">
                <Select value={postForm.status} onChange={(e) => setP("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </Select>
              </FormField>
              {postForm.status === "scheduled" && (
                <FormField label="Schedule Date">
                  <Input type="datetime-local" value={postForm.scheduled_date} onChange={(e) => setP("scheduled_date", e.target.value)} />
                </FormField>
              )}
              <FormField label="Excerpt">
                <Textarea value={postForm.excerpt} onChange={(e) => setP("excerpt", e.target.value)} rows={3} placeholder="Brief summary..." />
              </FormField>
              <FormField label="Tags (comma-separated)">
                <Input value={postForm.tags} onChange={(e) => setP("tags", e.target.value)} placeholder="glass railing, toronto, install" />
              </FormField>
              <FormField label="Meta Title">
                <Input value={postForm.meta_title} onChange={(e) => setP("meta_title", e.target.value)} placeholder="SEO title..." />
              </FormField>
              <FormField label="Meta Description" hint="Max 160 characters">
                <Textarea value={postForm.meta_description} onChange={(e) => setP("meta_description", e.target.value)} rows={2} placeholder="SEO description..." />
                <p className="text-right text-[11px] text-muted-foreground">{postForm.meta_description.length}/160</p>
              </FormField>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setTab("posts")}>Cancel</Button>
                <Button className="flex-1" onClick={handleSavePost} loading={isPending}>
                  {editingPost ? "Save Changes" : "Save Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">AI Generator — {brand.name}</h3>
            </div>
            <div className="mb-4 p-3 rounded-lg bg-brand/5 border border-brand/20">
              <p className="text-xs font-medium text-brand mb-1">Brand Context (auto-applied)</p>
              <p className="text-xs text-muted-foreground">{brand.brand_tone} tone · {brand.industry} · {(brand.brand_keywords ?? []).slice(0, 3).join(", ")}</p>
            </div>
            <div className="space-y-4">
              <FormField label="Blog Topic" required>
                <Input value={aiForm.topic} onChange={(e) => setA("topic", e.target.value)}
                  placeholder={`e.g. Benefits of frameless glass railings for ${brand.name}`} />
              </FormField>
              <FormField label="Additional Keywords" hint="Comma-separated — adds to brand keywords">
                <Input value={aiForm.keywords} onChange={(e) => setA("keywords", e.target.value)}
                  placeholder="e.g. installation, maintenance, cost" />
              </FormField>
              <FormField label="Length">
                <Select value={aiForm.length} onChange={(e) => setA("length", e.target.value)}>
                  <option value="short">Short (~400 words)</option>
                  <option value="medium">Medium (~800 words)</option>
                  <option value="long">Long (~1,400 words)</option>
                </Select>
              </FormField>
              <FormField label="Extra Instructions" hint="Any specific requirements for this post">
                <Textarea value={aiForm.extra_instructions} onChange={(e) => setA("extra_instructions", e.target.value)}
                  rows={2} placeholder="e.g. Include a FAQ section, mention Toronto location, add CTA at the end..." />
              </FormField>
              <Button className="w-full" onClick={handleAIGenerate} disabled={aiLoading}>
                {aiLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating for {brand.name}...</>
                  : <><Sparkles className="h-4 w-4" /> Generate Blog Post</>}
              </Button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Generated Content</h3>
            {aiLoading && (
              <div className="flex h-48 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                  <p className="text-xs text-muted-foreground">Writing for {brand.name}...</p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Title</p>
                  <p className="text-base font-semibold text-foreground">{aiResult.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Excerpt</p>
                  <p className="text-sm text-muted-foreground">{aiResult.excerpt}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Content Preview</p>
                  <div className="max-h-[200px] overflow-y-auto rounded-lg bg-surface-2 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {aiResult.content.slice(0, 600)}{aiResult.content.length > 600 ? "…" : ""}
                  </div>
                </div>
                <Button className="w-full" onClick={useAIContent}>
                  <Edit2 className="h-4 w-4" /> Open in Editor
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
