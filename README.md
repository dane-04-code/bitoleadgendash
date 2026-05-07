# LeadIntelligence

Sales lead management dashboard for **BITO UAE** — a warehouse solutions company operating across the GCC region.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key
   - `DASHBOARD_PASSWORD` — single shared password to access the dashboard
   - `DASHBOARD_SESSION_SECRET` — long random string used to sign session cookies

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Pages

- `/login` — password gate
- `/dashboard` — overview with stats and lead inbox
- `/leads/[id]` — full lead detail with contacts, outreach, assignment
- `/pipeline` — kanban board across the sales stages
- `/reps` — sales rep management
- `/settings` — basic settings

## Database

Supabase tables expected: `leads`, `contacts`, `reps`, `assignments`, `outreach`, `pipeline_updates`, `call_briefs`. See `src/lib/supabase/types.ts` for the full schema.

## Design

- Dark theme, BITO navy `#1a2744` and BITO orange `#E8590A`.
- Score badges: red (HOT 80+), amber (WARM 50–79), blue (COLD <50).
