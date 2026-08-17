# Architecture

How BITO LeadIntelligence is actually wired, and the rules that follow from it.
Verified against the repo and the live database **2026-08-17**.

This is the "/app" context document: what the application is, where each kind of
code lives, and where the load-bearing constraints are.

---

## 1. Shape

```
Hermes (upstream, not in this repo)
  │  discovers · enriches · scores leads
  │  writes directly to Postgres / the Supabase REST API
  ▼
Supabase Postgres  ── 13 tables · RLS on, deny-by-default, zero policies
  ▲
  │  service-role key · server-side only
  ▼
Next.js 14 App Router  ── this repo
  ├─ src/lib/queries.ts    every read
  ├─ src/app/actions.ts    every mutation
  ├─ src/middleware.ts     page-level role routing
  └─ src/app/(app)/**      authenticated pages
  ▼
Admin (desktop + mobile) · Sales rep (desktop + mobile)
```

The app is a thin, honest decision layer. It renders what Hermes produced and
records what a human decided. It never computes lead intelligence itself.

## 2. Layout

| Path | Role |
|---|---|
| `src/app/(app)/**` | Authenticated pages, server components by default. |
| `src/app/login`, `src/app/signup` | Public. |
| `src/app/actions.ts` | **Every mutation**, as server actions. ~930 lines, 23 exported actions. |
| `src/app/api/auth/{login,logout,signup}/route.ts` | Session issue/clear; rep self-signup. |
| `src/app/api/search/route.ts` | Backs the command palette. |
| `src/lib/queries.ts` | **Every read**. ~1000 lines. |
| `src/lib/mock-data.ts` | Full fixture set powering mock mode (~1200 lines). |
| `src/lib/supabase/server.ts` | The only client the app actually uses. |
| `src/lib/supabase/browser.ts` | **Zero callers. Must stay at zero.** |
| `src/lib/supabase/types.ts` | Hand-maintained types. Currently incomplete — see `DATA.md`. |
| `src/lib/auth.ts` / `auth-edge.ts` | Session, hashing, role helpers. `auth-edge` is the edge-safe half used by middleware. |
| `src/lib/styles.ts` | Shared control class strings (`PILL_CONTROL`, `PILL_GHOST`) composed through `cn`. |
| `src/components/**` | Client components; `src/components/ui/**` are the shadcn-style primitives. |
| `src/middleware.ts` | Role routing only. |
| `supabase/migrations/` | **Not a reliable record of production.** See `DATA.md`. |
| `.impeccable/` | Design-system sidecar + generated critiques. Tooling output, not authored context. |

## 3. Routes and access

| Route | Access | What it is |
|---|---|---|
| `/login`, `/signup` | public | Password gate; rep self-signup behind `REP_SIGNUP_CODE` |
| `/dashboard` | admin | Stat tiles + lead inbox. Tabs: New / Leads / Assigned / Returned / Archived / Killed. Filters: search, status, industry, score |
| `/pipeline` | admin | Kanban across all nine stages. Filters: salesman, region, score, time in stage, "New this week". Archived leads never appear |
| `/reps`, `/reps/[id]` | admin | Add rep, set/reset password, deactivate, delete, per-rep counts |
| `/settings` | admin | Settings |
| `/leads/[id]` | both | Full lead detail: score breakdown, contacts, outreach, notes, review scorecard, deal profile |
| `/marketplace` | both | Unassigned listed leads reps can claim / unclaim |
| `/my`, `/my/account` | rep | Rep-scoped board (same filters minus salesman) and profile |
| `/feedback` | both | In-app suggestions box with admin-set status |

Root `/` redirects by role: admin → `/dashboard`, rep → `/my`.

## 4. Auth — not Supabase Auth

| Piece | How |
|---|---|
| Admin | One shared `DASHBOARD_PASSWORD` env var. No per-user admin accounts. |
| Reps | PBKDF2 hashes in the `reps` table. Self-signup gated by shared `REP_SIGNUP_CODE`. Admin-set passwords always set `must_change_password`, forcing the rep to choose their own on next login. |
| Session | HMAC-signed `li_session` cookie (`DASHBOARD_SESSION_SECRET`), verified in middleware via `readSession`. |
| Role | `session.role` is `"admin"` or `"rep"`; for a rep, `session.subject` is the rep id. |

Helpers in `src/lib/auth.ts`: `getSession`, `isAuthenticated`, `isAdmin`,
`getCurrentRepId`.

Consequence: there is no per-user admin identity and no audit trail of *which*
human acted as admin. Notes and reviews are stamped `"Admin"`. This is a known
limitation, relevant to the Dean handover — see `ROADMAP.md`.

## 5. The security model, and where it is currently broken

Since 2026-08-15 (migration `0015`), **RLS is enabled with zero policies on all
13 public tables**. `anon` and `authenticated` can read nothing. The app reaches
Supabase with `SUPABASE_SERVICE_ROLE_KEY`, which has `rolbypassrls = true`.

Two rules follow, and both are load-bearing:

**Rule 1 — every data access stays server-side.** A client-side query path would
either leak the service-role key or read nothing at all. `src/lib/supabase/browser.ts`
has zero callers; the one client component that imports from `@/lib/queries`
(`src/components/rep-leads-view.tsx`) uses `import type`, which is erased at
compile time.

**Rule 2 — authorization lives entirely in application code.** The database will
not stop a bad request, because the key bypasses RLS. Middleware protects
*pages*, not server actions — a server action is a POST endpoint any authenticated
session can call directly.

### Current state of Rule 2: failing

Audited 2026-08-17. Of 23 exported server actions in `src/app/actions.ts`, **nine
perform no session or role check**:

| Unguarded action | Severity |
|---|---|
| `setRepPassword` | **Critical.** Any authenticated rep can set any other rep's password — including overwriting it and forcing a change — which is account takeover. |
| `clearRepPassword` | **Critical.** Any rep can null another rep's password. |
| `deleteRep` | **Critical.** Any rep can delete any rep, cascading their assignments. |
| `createRep` | High. Any rep can create rep accounts. |
| `assignLeadToRep` | High. Any rep can assign any lead to anyone. |
| `updateLeadStatus` / `moveLeadToStatus` / `applyLeadStatus` | High. Any authenticated session can move any lead to any stage, including `won`. |
| `addLeadNote` | Medium. Calls `currentActorName()`, which reads the session, but does not *reject* a missing one — an unauthenticated call writes a note with a `null` author. |
| `deleteLeadNote` | Medium. No check, no ownership test. |
| `saveLeadReview` | Medium. Same shape as `addLeadNote`. |

Guarded actions establish the correct pattern, e.g. `toggleRepActive`:

```ts
const session = await getSession();
if (session?.role !== "admin") return { ok: false, error: "Admins only." };
```

and for rep-scoped work, `getCurrentRepId()` plus `isLeadOwnedByRep()` — see
`returnLead`, `claimLead`, `unclaimLead`, `updateMyProfile`, `changeMyPassword`.

This is the current P0. Fix spec: `specs/0001-server-action-authorization.md`.
Two actions previously shipped unguarded and were caught late (commit `bb89ff5`);
this is that same failure mode, unresolved at scale.

### Outstanding hygiene

The anon key has been in browsers and still needs rotating. It no longer grants
data access, so this is hygiene rather than urgency.

## 6. Data flow patterns

**Reads.** Server components call `src/lib/queries.ts`. Most queries use
`select("*")`, so a column absent in production arrives as `undefined` rather
than raising — drift fails silently. Do not add a new `select("*")` read of a
field you have not verified live today.

**Writes.** Client components call server actions from `src/app/actions.ts`.
The house shape is:

1. Parse and validate input (`FormData` or typed args).
2. **Assert session and role.** Assert ownership for rep-scoped work.
3. Branch on `isMockMode()` and mutate the fixtures, returning early.
4. Mutate Supabase; on error, `console.error` and return `{ ok: false, error }`.
5. Log the stage change to `pipeline_updates` where a stage moved.
6. `revalidatePath` every affected route.
7. Return `{ ok: true }`.

Step 2 is the one that keeps getting skipped. Steps 3 and 6 are the ones that get
half-done — a missed `revalidatePath` looks like a broken write to the user.

**Mock mode.** `isMockMode()` is true when the Supabase env vars are absent or
still placeholders. The entire app then runs from `src/lib/mock-data.ts` with no
database. Both modes must keep working; a new field must be added to the fixtures
in the same change, or the feature will render as empty everywhere and nobody will
notice.

## 7. Design system

`context/DESIGN.md` is authoritative and was regenerated from the shipped build on
2026-08-15. `src/app/globals.css` + `tailwind.config.ts` are the literal tokens;
`DESIGN.md` is the system they express. If you ship a new component or change a
token, regenerate `DESIGN.md` in the same change rather than letting it drift.

Non-negotiables, verified against the tokens:

- **BITO teal `#00797f`** (`--accent`) and white. Single-hue teal ramp.
- **Barlow / Barlow Condensed / IBM Plex Mono**, wired in `src/app/layout.tsx`.
  `.mono` is a real monospace; `.display-serif` is Barlow Condensed.
- **Rounded corners** on a four-step scale: `--radius-sm` 5px, `--radius-md` 9px,
  `--radius` 11px, `--radius-xl` 14px.
- Surfaces are **borderless `.panel` cards on the ground**; hairlines
  (`--line-soft`) are for dividers *inside* a panel only.
- **Orange `#e06c00` (`--flare`) for tiny accents only** — never a surface.
- **Never place the BITO logo.** The reserved slot stays empty.
- Light and dark themes both ship.
- **Status never rests on colour alone** — the ramp is one hue, so every stage
  chip ships the stage word beside its tint.

## 8. Where change is expensive

Know these before proposing work.

- **`src/app/actions.ts` and `src/lib/queries.ts` are large single files**
  (~930 and ~1000 lines). They are the two chokepoints every feature touches.
  Splitting them is tempting and is *not* currently scoped — see `ROADMAP.md`
  "Later". Adding to them is fine; reorganising them mid-feature is not.
- **`types.ts` is hand-maintained and wrong.** Any field work pays a verification
  tax until `specs/0002` lands.
- **The kanban is one 25k component** (`src/components/kanban-board.tsx`) carrying
  drag-and-drop, filters and nine columns. High blast radius.
- **No test suite.** `npm run build` is the only gate, so behavioural regressions
  are caught by humans in production. This is the strongest argument for small
  diffs.
- **Local dev writes to production.** There is no staging environment.
