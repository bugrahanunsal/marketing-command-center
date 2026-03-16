-- ================================================================
-- MarketingOS — Full Database Schema
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role       AS ENUM ('admin', 'member', 'viewer');
  CREATE TYPE task_status     AS ENUM ('todo', 'in_progress', 'review', 'done');
  CREATE TYPE task_priority   AS ENUM ('low', 'medium', 'high', 'urgent');
  CREATE TYPE backlink_type   AS ENUM ('dofollow', 'nofollow');
  CREATE TYPE backlink_status AS ENUM ('active', 'lost', 'pending');
  CREATE TYPE content_status  AS ENUM ('idea', 'draft', 'in_review', 'scheduled', 'published');
  CREATE TYPE content_type    AS ENUM ('blog', 'social', 'email', 'video', 'ad');
  CREATE TYPE blog_status     AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      task_status NOT NULL DEFAULT 'todo',
  priority    task_priority NOT NULL DEFAULT 'medium',
  due_date    DATE,
  assigned_to UUID REFERENCES profiles(id),
  project     TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status  ON tasks(status);

-- ── SEO Keywords ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_keywords (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword       TEXT NOT NULL,
  current_rank  SMALLINT CHECK (current_rank > 0),
  previous_rank SMALLINT CHECK (previous_rank > 0),
  search_volume INTEGER,
  difficulty    SMALLINT CHECK (difficulty BETWEEN 0 AND 100),
  url           TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_user_id ON seo_keywords(user_id);

-- ── Backlinks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backlinks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_url        TEXT NOT NULL,
  target_url        TEXT NOT NULL,
  anchor_text       TEXT,
  domain_authority  SMALLINT CHECK (domain_authority BETWEEN 0 AND 100),
  link_type         backlink_type NOT NULL DEFAULT 'dofollow',
  status            backlink_status NOT NULL DEFAULT 'active',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backlinks_user_id ON backlinks(user_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_status  ON backlinks(status);

-- ── Content Items (Calendar) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS content_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  content_type   content_type NOT NULL DEFAULT 'blog',
  status         content_status NOT NULL DEFAULT 'idea',
  scheduled_date DATE,
  platform       TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_user_id        ON content_items(user_id);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_date ON content_items(scheduled_date);

-- ── Blog Posts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL,
  content          TEXT,
  excerpt          TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  status           blog_status NOT NULL DEFAULT 'draft',
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_slug    ON blog_posts(user_id, slug);
CREATE INDEX        IF NOT EXISTS idx_blog_user_id ON blog_posts(user_id);
CREATE INDEX        IF NOT EXISTS idx_blog_status  ON blog_posts(status);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords   ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts     ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Profiles: anyone can read; users can only update their own row
CREATE POLICY "profiles_read_all"  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_write" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_ins" ON profiles FOR INSERT WITH CHECK (get_my_role() = 'admin');

-- Tasks: users own their tasks; admins see all
CREATE POLICY "tasks_own"   ON tasks FOR ALL USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- SEO Keywords
CREATE POLICY "seo_own"     ON seo_keywords FOR ALL USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- Backlinks
CREATE POLICY "bl_own"      ON backlinks FOR ALL USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- Content items
CREATE POLICY "content_own" ON content_items FOR ALL USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- Blog posts
CREATE POLICY "blog_own"    ON blog_posts FOR ALL USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- ── Triggers: auto-updated_at ─────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_upd      BEFORE UPDATE ON profiles      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  CREATE TRIGGER trg_tasks_upd         BEFORE UPDATE ON tasks          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  CREATE TRIGGER trg_seo_upd           BEFORE UPDATE ON seo_keywords   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  CREATE TRIGGER trg_content_upd       BEFORE UPDATE ON content_items  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  CREATE TRIGGER trg_blog_upd          BEFORE UPDATE ON blog_posts     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Auto-create profile on signup ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
