import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().nullable().optional(),
  project: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export const seoKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  current_rank: z.number().nullable().optional(),
  search_volume: z.number().nullable().optional(),
  difficulty: z.number().min(0).max(100).nullable().optional(),
  url: z.string().url().nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional(),
});

export const backlinkSchema = z.object({
  source_url: z.string().url("Must be a valid URL"),
  target_url: z.string().url("Must be a valid URL"),
  anchor_text: z.string().nullable().optional(),
  domain_authority: z.number().min(0).max(100).nullable().optional(),
  link_type: z.enum(["dofollow", "nofollow"]),
  status: z.enum(["active", "lost", "pending"]),
  notes: z.string().nullable().optional(),
});

export const contentItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content_type: z.enum(["blog", "social", "email", "video", "ad"]),
  status: z.enum(["idea", "draft", "in_review", "scheduled", "published"]),
  scheduled_date: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().max(160).nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]),
});

export const aiGenerateSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  keywords: z.string().optional(),
  tone: z.enum(["professional", "casual", "technical", "persuasive"]),
  length: z.enum(["short", "medium", "long"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type SeoKeywordInput = z.infer<typeof seoKeywordSchema>;
export type BacklinkInput = z.infer<typeof backlinkSchema>;
export type ContentItemInput = z.infer<typeof contentItemSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;
