# MarketingOS

A production-ready, full-stack marketing management SaaS built with **Next.js 14**, **TypeScript**, **TailwindCSS**, and **Supabase**.

---

## Features

| Module | Description |
|---|---|
| **Authentication** | Email/password sign-up, login, password reset via Supabase Auth |
| **Dashboard** | Overview of all modules with live stats |
| **Task Manager** | Kanban board + list view with status, priority, due dates |
| **SEO Tracker** | Keyword rank tracking with difficulty scores and volume |
| **Backlink Tracker** | Monitor dofollow/nofollow links with domain authority |
| **Content Calendar** | Visual calendar for scheduling blog, social, email content |
| **Blog + AI Generator** | Write posts with a full editor; generate drafts via OpenAI GPT-4o-mini |
| **Settings** | Profile management, password change, notification preferences |

---

## Tech Stack

- **Framework**: Next.js 14 App Router (TypeScript)
- **Styling**: TailwindCSS with custom design tokens
- **Database + Auth**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Validation**: Zod
- **AI**: OpenAI GPT-4o-mini (optional)
- **Toasts**: react-hot-toast
- **Date utilities**: date-fns
- **Icons**: lucide-react

---

## Project Structure

```
marketing-saas/
├── app/
│   ├── (auth)/              # Login, signup, reset-password
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Overview page
│   │   ├── tasks/           # Task manager
│   │   ├── seo/             # SEO keyword tracker
│   │   ├── backlinks/       # Backlink tracker
│   │   ├── calendar/        # Content calendar
│   │   ├── blog/            # Blog manager + AI generator
│   │   └── settings/        # Account settings
│   ├── api/
│   │   ├── auth/callback/   # Supabase OAuth callback
│   │   └── ai/generate/     # OpenAI blog generation
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                  # Button, Input, Modal, Badge, etc.
│   ├── layout/              # Sidebar, Header
│   ├── auth/                # LoginForm, SignupForm, ResetPasswordForm
│   ├── dashboard/           # SettingsPage
│   ├── tasks/               # TaskManager
│   ├── seo/                 # SEOTracker
│   ├── backlinks/           # BacklinkTracker
│   ├── calendar/            # ContentCalendar
│   └── blog/                # BlogManager
├── lib/
│   ├── supabase/            # server.ts, client.ts, middleware.ts
│   ├── actions/             # Server actions for all CRUD
│   ├── hooks/               # useUser, useProfile, useDebounce
│   ├── utils/               # cn, fmtDate, slugify, etc.
│   └── validations/         # Zod schemas
├── types/                   # Shared TypeScript types
├── supabase/
│   └── migrations/          # SQL schema
├── middleware.ts             # Auth route protection
├── .env.example
└── README.md
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/marketing-saas.git
cd marketing-saas
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New query**
3. Paste the contents of `supabase/migrations/001_schema.sql` and run it
4. Go to **Project Settings → API** and copy your credentials

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="MarketingOS"

# Optional — for AI blog generation
OPENAI_API_KEY=sk-...
```

### 4. Configure Supabase Auth

In your Supabase dashboard:

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/api/auth/callback`

2. **Authentication → Email Templates** (optional)
   - Customize confirmation and reset emails

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### 6. Create your first user

- Navigate to `/signup` and create an account
- Check your email for the confirmation link
- Or in Supabase dashboard: **Authentication → Users**, create a user manually (enable "Auto Confirm User")

---

## AI Blog Generator Setup

The AI generator uses OpenAI's GPT-4o-mini model.

1. Get an API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Add it to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   ```

**Without an API key**: The generator returns placeholder content so you can still test the UI.

---

## Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL        # https://yourdomain.com
vercel env add OPENAI_API_KEY
```

After deploying, update Supabase Auth:
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: `https://yourdomain.com/api/auth/callback`

### Other platforms (Railway, Render, Fly.io)

```bash
npm run build
npm start
```

Set all environment variables from `.env.example` in your hosting platform's dashboard.

---

## Database

### Schema overview

| Table | Description |
|---|---|
| `profiles` | Extended user data (name, role, avatar) |
| `tasks` | Task manager items with status and priority |
| `seo_keywords` | Tracked keywords with rank history |
| `backlinks` | Link building tracker |
| `content_items` | Content calendar entries |
| `blog_posts` | Blog posts with SEO metadata |

All tables use **Row Level Security (RLS)** — users can only access their own data. Admins can access all records.

### Generate TypeScript types from your schema

```bash
npm run db:types
```

### Push schema changes

```bash
npm run db:push
```

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript check (no emit)
npm run format       # Format with Prettier
npm run db:types     # Regenerate Supabase TypeScript types
npm run db:push      # Push migrations to Supabase
npm run db:reset     # Reset local Supabase database
```

---

## Extending the Project

### Adding a new module

1. Create `app/(dashboard)/your-module/page.tsx` (server component for data fetching)
2. Create `components/your-module/YourModule.tsx` (client component for interactivity)
3. Add CRUD server actions to `lib/actions/index.ts`
4. Add the database table to `supabase/migrations/001_schema.sql`
5. Add the route to `components/layout/Sidebar.tsx` navigation
6. Add types to `types/index.ts`

### Adding OAuth providers (Google, GitHub)

1. Enable the provider in **Supabase → Authentication → Providers**
2. Add the OAuth button to `components/auth/LoginForm.tsx`:
   ```ts
   await createClient().auth.signInWithOAuth({
     provider: "google",
     options: { redirectTo: `${window.location.origin}/api/auth/callback` },
   });
   ```

---

## License

MIT — use freely for personal or commercial projects.

---

## Contributing

Pull requests welcome. Please open an issue first for major changes.
