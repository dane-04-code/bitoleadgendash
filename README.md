# BITO LeadIntelligence

Lead-intelligence and sales-pipeline console for **BITO UAE** — warehouse
racking, shelving, and automation across the GCC.

An upstream research pipeline ("Hermes") finds companies showing buying signals,
scores them, and writes them into Supabase. This app is where a human decides
what to do with each one: triage, assign, work, close.

Next.js 14 (App Router) · TypeScript · Tailwind · Radix / shadcn-style primitives · Supabase.

## Working on this repo

**Start at [`CLAUDE.md`](CLAUDE.md).** It is the entry point for humans and agents
alike: the read order, who the product is for, the code quality bar, and the hard
rules.

```
CLAUDE.md              entry point · rules · quality bar
context/
  PRODUCT.md           users, purpose, principles, brand commitments — binding
  ARCHITECTURE.md      how the app is wired, and the constraints that follow
  DATA.md              live schema truth, drift, coverage figures
  ROADMAP.md           Now / Next / Later, and what is permanently out of scope
  DESIGN.md            the design system as shipped
  DECISIONS.md         standing decisions, with dates and what they foreclose
  archive/             superseded plans — history only, never plan from it
specs/                 one spec per unit of work; README.md has the template
routines/
  REVIEW.md            the gate every change passes before it lands
  SHIP.md              request → landed change, end to end
  VERIFY-SCHEMA.md     how to check the live database before wiring a field
```

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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. **Grants no data access** — RLS denies it by default. Kept only so mock-mode detection and the fallback path still work. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required against the live database.** Server-only; bypasses RLS. Never prefix `NEXT_PUBLIC_` and never let it reach the browser. |
| `DASHBOARD_PASSWORD` | Shared admin password |
| `DASHBOARD_SESSION_SECRET` | Long random string signing session cookies |
| `REP_SIGNUP_CODE` | Shared code gating rep self-signup |

### Mock mode

Leave the two Supabase variables at their placeholder values and `isMockMode()`
stays true: the entire app runs off `src/lib/mock-data.ts` with no database.
This is the offline demo path, and any change must keep working in both modes.

> **The local `.env.local` is pointed at the live project** (since 2026-08-16),
> so `npm run dev` reads and writes **production data**. Restore the placeholder
> Supabase values — they are kept in a comment at the top of that file — to go
> back to mock mode. There is no staging environment.

## Roles

- **Admin / manager** — triages every inbound lead, scores and reviews it,
  assigns it to a rep or lists it on the marketplace, watches the whole pipeline.
- **Sales rep** — works only their own assigned or claimed leads: contacts them,
  moves them through stages, records the deal, returns what they can't progress.

Roles are enforced for *pages* in `src/middleware.ts`. Server actions must guard
themselves — see `context/ARCHITECTURE.md` §5. Auth is *not* Supabase Auth.

## Routes

| Route | Access | What it is |
|---|---|---|
| `/login`, `/signup` | public | Password gate; rep self-signup behind a shared code |
| `/dashboard` | admin | Stat tiles + lead inbox, tabbed New / Leads / Assigned / Returned / Archived / Killed, with search, status, industry and score filters |
| `/pipeline` | admin | Kanban across all stages, filtered by salesman, region, score and time in stage (archived leads excluded) |
| `/reps`, `/reps/[id]` | admin | Rep management: add, set/reset password, delete, per-rep counts |
| `/settings` | admin | Settings |
| `/leads/[id]` | both | Full lead detail: score breakdown, contacts, outreach, notes, review, deal profile |
| `/marketplace` | both | Unassigned leads reps can claim / unclaim |
| `/my`, `/my/account` | rep | Rep-scoped board (same filters, no salesman picker) and profile |
| `/feedback` | both | In-app suggestions box with admin-set status |

## Lead lifecycle

`new → listed → assigned → contacted → meeting → quote → won | dead | returned`

`listed` = published to the internal marketplace. `returned` = a rep handed it
back. `leads.status` is a plain `text` column with no check constraint.

## Database

Live project: **`BITOLEADGEN`** (`epyumxjezftahosvegmn`).

Thirteen tables. **Row-level security is on, deny-by-default, with zero policies
on all 13** (migration `0015`, applied 2026-08-15). The app connects with the
service-role key from the server only; the anon key can read nothing. All
authorization is enforced in application code — including in every server action,
since middleware protects pages, not actions.

> **The files in `supabase/migrations/` are not a reliable record of the live
> schema.** Only three migrations are registered remotely; `0001`–`0013` were
> applied by hand or not at all, and the upstream agents alter the schema
> independently of this repo. Verify before relying on a column —
> `routines/VERIFY-SCHEMA.md`. Current drift and live figures are in
> `context/DATA.md`.

## Design

`context/PRODUCT.md` holds the product contract and is binding. Summary: BITO
teal `#00797f` on white, **Barlow / Barlow Condensed**, rounded corners (5–14px),
orange `#e06c00` for tiny accents only, no logo anywhere, light and dark themes.

`context/DESIGN.md` was regenerated from the shipped build on 2026-08-15 and is
current. `src/app/globals.css` and `tailwind.config.ts` are the literal tokens.

## Status — 2026-08-17

The UI overhaul is merged and the database lockout is done. Three things are open
and current:

- **Nine server actions have no authorization check**, four of them
  admin-privileged rep management. Any authenticated rep can take over another
  rep's account. `specs/0001` — top of Now.
- **No v2 field the pipeline produces is surfaced in the UI.**
  `why_is_this_a_lead` (16 of 104 leads), contact-quality evidence on 182
  contacts, `contacts_count`, `signal_date` — all live, all unread.
- **23 open assigned leads are 21+ days untouched, and 23 leads flagged
  `do_not_contact` are served as workable.** Both invisible in the UI.

`context/ROADMAP.md` is the plan of record; `context/DATA.md` carries the live
figures and when they were last measured.
