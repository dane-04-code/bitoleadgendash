# BITO LeadIntelligence

Lead-intelligence and sales-pipeline console for **BITO UAE** — warehouse
racking, shelving, and automation across the GCC.

An upstream research pipeline ("Hermes") finds companies showing buying signals,
scores them, and writes them into Supabase. This app is where a human decides
what to do with each one: triage, assign, work, close.

Next.js 14 (App Router) · TypeScript · Tailwind · Radix / shadcn-style primitives · Supabase.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in
npm run dev                  # http://localhost:3000
```

Environment variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key — **reads nothing since the RLS lockout**; still required for `isMockMode()` detection |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** The credential the app actually reads and writes with. Bypasses RLS. Must never be `NEXT_PUBLIC_*` or reach the browser |
| `DASHBOARD_PASSWORD` | Shared admin password |
| `DASHBOARD_SESSION_SECRET` | Long random string signing session cookies |
| `REP_SIGNUP_CODE` | Shared code gating rep self-signup |

Since migration `0015` (2026-08-16) row-level security is enabled with no
policies on all 13 tables, so **without `SUPABASE_SERVICE_ROLE_KEY` every query
returns an empty result set rather than an error.** An app that renders but shows
no data is the signature of a missing service-role key.

### Mock mode

Set the two Supabase variables to their placeholder values and `isMockMode()`
becomes true: the entire app runs off `src/lib/mock-data.ts` with no database.

> **The checked-in `.env.local` no longer does this.** It points at the live
> project, so `npm run dev` reads and writes **production**. Restore the
> placeholders recorded in the comment at the top of that file to get the demo
> path back.

## Roles

- **Admin / manager** — triages every inbound lead, scores and reviews it,
  assigns it to a rep or lists it on the marketplace, watches the whole pipeline.
- **Sales rep** — works only their own assigned or claimed leads: contacts them,
  moves them through stages, records the deal, returns what they can't progress.

Roles are enforced in `src/middleware.ts`. Auth is *not* Supabase Auth — see
`CLAUDE.md`.

## Routes

| Route | Access | What it is |
|---|---|---|
| `/login`, `/signup` | public | Password gate; rep self-signup behind a shared code |
| `/dashboard` | admin | Stat tiles + lead inbox, tabbed New / Leads / Assigned / Returned / Archived / Killed. **"Leads" is the unowned triage queue** (`new`/`listed`/`returned`, not archived) — not an index of every lead; owned leads live under Assigned and on the Pipeline board |
| `/pipeline` | admin | Kanban across all stages |
| `/reps`, `/reps/[id]` | admin | Rep management: add, set/reset password, delete, per-rep counts |
| `/settings` | admin | Settings |
| `/leads/[id]` | both | Full lead detail: score breakdown, contacts, outreach, notes, review, deal profile |
| `/marketplace` | both | Unassigned leads reps can claim / unclaim |
| `/my`, `/my/account` | rep | The rep's book of work, two ways: kanban board (default) or dense inbox list at `/my?view=inbox`. Plus their profile |
| `/feedback` | both | In-app suggestions box with admin-set status |

## Lead lifecycle

`new → listed → assigned → contacted → meeting → quote → won | dead | returned`

`listed` = published to the internal marketplace. `returned` = a rep handed it
back. `leads.status` is a plain `text` column with no check constraint.

## Database

Live project: **`BITOLEADGEN`** (`epyumxjezftahosvegmn`).

Tables: `leads`, `contacts`, `reps`, `assignments`, `outreach`,
`pipeline_updates`, `call_briefs`, `lead_notes`, `lead_reviews`, `feedback`,
`deal_profiles`, `deal_sales`, `assignment_pings`.

> **The files in `supabase/migrations/` are not a reliable record of the live
> schema.** Only one migration is registered remotely; the rest were applied by
> hand or not at all, and the upstream agents alter the schema independently of
> this repo. Verify against the live project before relying on a column.
> Current known drift is listed in `V2_PLAN.md`.

## Design

`PRODUCT.md` holds the product contract and is binding. Summary: BITO teal
`#00797f` on white, **Barlow / Barlow Condensed**, rounded corners (5–14px),
orange `#e06c00` for tiny accents only, no logo anywhere, light and dark themes.

`DESIGN.md` was regenerated on 2026-08-15 from the build that shipped, so it is
current. `src/app/globals.css` and `tailwind.config.ts` hold the tokens
themselves and win any disagreement.

## Further reading

- `HANDOVER.md` — **start here.** Current position: what shipped in v1.0.1, the
  live data as measured, open asks for the upstream Hermes agent, what's next
- `CLAUDE.md` — working notes, architecture, house rules
- `PRODUCT.md` — users, purpose, constraints, principles
- `DESIGN.md` — design system reference
- `V2_PLAN.md` — the v2 plan and current schema drift
