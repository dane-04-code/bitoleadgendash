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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DASHBOARD_PASSWORD` | Shared admin password |
| `DASHBOARD_SESSION_SECRET` | Long random string signing session cookies |
| `REP_SIGNUP_CODE` | Shared code gating rep self-signup |

### Mock mode

Leave the two Supabase variables at their placeholder values and `isMockMode()`
stays true: the entire app runs off `src/lib/mock-data.ts` with no database.
This is the default local demo path and how the checked-in `.env.local` is set
up.

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
| `/dashboard` | admin | Stat tiles + lead inbox, tabbed New / Leads / Assigned / Returned / Archived / Killed |
| `/pipeline` | admin | Kanban across all stages |
| `/reps`, `/reps/[id]` | admin | Rep management: add, set/reset password, delete, per-rep counts |
| `/settings` | admin | Settings |
| `/leads/[id]` | both | Full lead detail: score breakdown, contacts, outreach, notes, review, deal profile |
| `/marketplace` | both | Unassigned leads reps can claim / unclaim |
| `/my`, `/my/account` | rep | Rep-scoped board and profile |
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

`DESIGN.md` is **stale** — it documents the pre-overhaul system and carries a
warning banner to that effect. Until it is regenerated, `src/app/globals.css`
and `tailwind.config.ts` are the source of truth for shape, type and colour.

## Further reading

- `CLAUDE.md` — working notes, architecture, house rules
- `PRODUCT.md` — users, purpose, constraints, principles
- `DESIGN.md` — design system reference
- `V2_PLAN.md` — the v2 plan and current schema drift
