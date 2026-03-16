"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskInput, SeoKeywordInput, BacklinkInput, ContentItemInput, BlogPostInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// ── Helper ────────────────────────────────────────────────────
async function getUser() {
  const sb = createClient();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { sb, user };
}

// ── Tasks ─────────────────────────────────────────────────────
export async function createTask(input: TaskInput) {
  const { sb, user } = await getUser();
  const { error } = await sb.from("tasks").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const { sb } = await getUser();
  const { error } = await sb.from("tasks").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const { sb } = await getUser();
  const { error } = await sb.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

// ── SEO Keywords ──────────────────────────────────────────────
export async function createKeyword(input: SeoKeywordInput) {
  const { sb, user } = await getUser();
  const { error } = await sb.from("seo_keywords").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/seo");
}

export async function updateKeyword(id: string, input: Partial<SeoKeywordInput>) {
  const { sb } = await getUser();
  const { error } = await sb.from("seo_keywords").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/seo");
}

export async function deleteKeyword(id: string) {
  const { sb } = await getUser();
  const { error } = await sb.from("seo_keywords").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/seo");
}

// ── Backlinks ────────────────────────────────────────────────
export async function createBacklink(input: BacklinkInput) {
  const { sb, user } = await getUser();
  const { error } = await sb.from("backlinks").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/backlinks");
}

export async function updateBacklink(id: string, input: Partial<BacklinkInput>) {
  const { sb } = await getUser();
  const { error } = await sb.from("backlinks").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/backlinks");
}

export async function deleteBacklink(id: string) {
  const { sb } = await getUser();
  const { error } = await sb.from("backlinks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/backlinks");
}

// ── Content Calendar ─────────────────────────────────────────
export async function createContentItem(input: ContentItemInput) {
  const { sb, user } = await getUser();
  const { error } = await sb.from("content_items").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function updateContentItem(id: string, input: Partial<ContentItemInput>) {
  const { sb } = await getUser();
  const { error } = await sb.from("content_items").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function deleteContentItem(id: string) {
  const { sb } = await getUser();
  const { error } = await sb.from("content_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

// ── Blog Posts ────────────────────────────────────────────────
export async function createBlogPost(input: BlogPostInput) {
  const { sb, user } = await getUser();
  const slug = slugify(input.title) + "-" + Date.now();
  const { error } = await sb.from("blog_posts").insert({ ...input, slug, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
}

export async function updateBlogPost(id: string, input: Partial<BlogPostInput>) {
  const { sb } = await getUser();
  const { error } = await sb.from("blog_posts").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
}

export async function deleteBlogPost(id: string) {
  const { sb } = await getUser();
  const { error } = await sb.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
}

// ── Profile ───────────────────────────────────────────────────
export async function updateProfile(full_name: string, avatar_url?: string) {
  const { sb, user } = await getUser();
  const { error } = await sb.from("profiles").update({
    full_name,
    ...(avatar_url && { avatar_url }),
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
