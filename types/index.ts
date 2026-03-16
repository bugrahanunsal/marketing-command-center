// ─── Auth & Users ───────────────────────────────────────────
export type UserRole = "admin" | "member" | "viewer";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// ─── Tasks ──────────────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  project: string | null;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ─── SEO ────────────────────────────────────────────────────
export interface SeoKeyword {
  id: string;
  keyword: string;
  current_rank: number | null;
  previous_rank: number | null;
  search_volume: number | null;
  difficulty: number | null;
  url: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Backlinks ──────────────────────────────────────────────
export type BacklinkType = "dofollow" | "nofollow";
export type BacklinkStatus = "active" | "lost" | "pending";

export interface Backlink {
  id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  domain_authority: number | null;
  link_type: BacklinkType;
  status: BacklinkStatus;
  notes: string | null;
  user_id: string;
  created_at: string;
}

// ─── Calendar / Content ─────────────────────────────────────
export type ContentStatus = "idea" | "draft" | "in_review" | "scheduled" | "published";
export type ContentType = "blog" | "social" | "email" | "video" | "ad";

export interface ContentItem {
  id: string;
  title: string;
  content_type: ContentType;
  status: ContentStatus;
  scheduled_date: string | null;
  platform: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Blog Posts ─────────────────────────────────────────────
export type BlogStatus = "draft" | "published" | "archived";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  status: BlogStatus;
  published_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Shared helpers ─────────────────────────────────────────
export type SortDirection = "asc" | "desc";

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
