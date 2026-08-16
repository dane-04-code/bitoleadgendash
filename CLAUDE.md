# CLAUDE.md

Working notes for Claude Code on **BITO LeadIntelligence** (`bitoleadgendash`).
Read this before touching anything. Last verified against the live database
2026-08-16.

**Current position: `HANDOVER.md`** — what shipped in v1.0.1, the live data as
measured 2026-08-16, open asks for the upstream Hermes agent, and what comes
next. Read it before `V2_PLAN.md`.

## What this repo is

The **frontend only** — a Next.js 14 App Router console over a Supabase
database. The lead data is produced upstream by an autonomous research pipeline
("Hermes" / the agents), which writes directly into Supabase. This repo does not
discover, enrich, or score leads. It is the human decision layer on top.

Consequence: **the database schema can change without a commit in this repo.**
Never assume `src/lib/supabase/types.ts` matches production. Verify with the
Supabase MCP tools before relying on a column.

## Commands

```bash
npm run dev     # localhost:3000
npm run build   # production build / typecheck
npm run lint
```

There is no test suite. `npm run build` is the only gate.

## Live Supabase project

| | |
|---|---|
| Name | `BITOLEADGEN` |
| Project ref | `epyumxjezftahosvegmn` |
| Region | ap-northeast-1 |
| Status | ACTIVE_HEALTHY |

Reach it with the Supabase MCP tools (`list_tables`, `execute_sql`,
`apply_migration`, `get_advisors`) using that project ref.

**⚠️ `.env.local` in this checkout now points at the live project** (changed
2026-08-16), so `isMockMode()` is **false** and `npm run dev` reads and writes
**production**. A local click can kill a real lead. It also holds
`SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS entirely.

To go back to the mock demo path, restore the placeholder
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` values recorded in
the comment at the top of `.env.local`. That flips `isMockMode()` true and the
whole app renders from `src/lib/mock-data.ts` with no database.

### Migrations are not in sync with `supabase/migrations/`

The remote `supabase_migrations` table records exactly one migration
(`20260813120634_lead_status_quote_rename`). Files `0001`–`0013` were applied by
hand through the SQL editor, or never applied at all. **A file existing in
`supabase/migrations/` is not evidence that it ran in production.** Check the
live schema.

Known live-vs-repo drift is tracked in `V2_PLAN.md` § "Schema drift". Keep that
section current.

## Architecture

- `src/app/(app)/**` — authenticated pages. `src/app/login`, `/signup` are public.
- `src/app/actions.ts` — every mutation, as server actions (~900 lines).
- `src/lib/queries.ts` — every read (~1000 lines). Most use `select("*")`, so a
  column missing in production surfaces as `undefined`, not an error. This is why
  schema drift fails silently instead of loudly.
- `src/lib/mock-data.ts` — full fixture set powering mock mode.
- `src/lib/supabase/types.ts` — hand-maintained types. Not generated; can lie.
- `src/middleware.ts` — role routing. Admin-only: `/dashboard`, `/pipeline`,
  `/reps`, `/settings`. Rep-only: `/my`. Root redirects by role.

### Auth is not Supabase Auth

- Admin: one shared `DASHBOARD_PASSWORD` env var.
- Reps: PBKDF2 hashes in the `reps` table, self-signup gated by `REP_SIGNUP_CODE`.
- Session: HMAC-signed `li_session` cookie, verified in middleware.

### Database access — service-role key, RLS deny-by-default

Since migration `0015` (applied 2026-08-16), **RLS is on with no policies on all
13 tables**. The anon key reads nothing — it returns empty result sets, not
errors. The app reaches Supabase through `SUPABASE_SERVICE_ROLE_KEY`, which holds
`rolbypassrls`.

That key must never be exposed. It is deliberately not `NEXT_PUBLIC_`, and
`src/lib/supabase/server.ts` must only ever be imported from server code. All
authorization is enforced in application code, so:

- **Do not add a client-side query path.** `getSupabaseBrowserClient` has zero
  callers by design; keep it that way.
- **Guard every server action.** Middleware protects the *page*, not the action —
  a server action is a live endpoint. Two actions shipped unguarded and were only
  safe because nothing called them (`bb89ff5`).

The upstream Hermes pipeline is on the service-role key too. Anon key rotation is
still outstanding — see `HANDOVER.md` §4.

## Design constraints — binding

**`DESIGN.md` was regenerated 2026-08-15 (`447f464`) from the build that actually
shipped** — globals.css, tailwind.config.ts, layout.tsx and the components — so
it is current and the old staleness banner is gone. `PRODUCT.md` holds the
product contract and remains authoritative. Where the two could ever disagree,
the shipped tokens in `globals.css` + `tailwind.config.ts` win.

The `ui-overhaul/inbox` branch rebuilt the console on the Claude Design comps
(Lead Inbox, Pipeline), which replaced the visual language. Current
non-negotiables, verified against the tokens on 2026-08-14:

- **BITO teal `#00797f`** (`--accent`) and white. Single-hue teal ramp.
- **Barlow / Barlow Condensed / IBM Plex Mono**, wired in `src/app/layout.tsx`.
  `.mono` is a real monospace and `.display-serif` is Barlow Condensed — the
  comps replaced the earlier Quicksand-only rule.
- **Rounded corners**, on the comps' four-step scale: `--radius-sm` 5px,
  `--radius-md` 9px, `--radius` 11px, `--radius-xl` 14px.
- Surfaces are **borderless `.panel` cards on the ground**, with hairlines
  (`--line-soft`) reserved for dividers inside a panel.
- **Orange `#e06c00` (`--flare`) for tiny accents only** — never a surface.
- **Never place the BITO logo.** A slot is reserved and stays empty.
- Light and dark themes both ship.
- Status must never be conveyed by colour alone (the ramp is one hue) — every
  stage chip ships the stage word beside its tint.

**Convention is the commitment.** The operator asked for the familiar CRM path —
Attio/Linear density for tables and lists, roomier kanban cards. Execute the
category standard at full fidelity. Do not reopen the aesthetic, do not smuggle
in quirk.

## House rules

1. **A redesign replaces the look, never the function.** The feature set is in
   daily use and hard-won. Removing a capability needs explicit approval — and
   this binds *feature* commits too, not just redesigns. `aa82dc9` shipped the
   marketplace and, in passing, deleted the reps' list view and narrowed the
   manager's default tab, each mentioned in one line of the commit body. Both
   came back as bug reports weeks later; the list was restored 2026-08-16. If a
   commit removes a surface someone works from, that goes in the subject line
   and gets asked about first. See `HANDOVER.md` §4.
2. **Verify against the live DB before wiring a field.** See drift note above.
3. **Do not fabricate** customer names beyond the mock set, win rates, revenue
   figures, or any claim about what the upstream agents can do.
4. **Production DDL needs explicit approval**, even additive columns.
5. Mock mode and live mode must both keep working. If you add a field, add it to
   `mock-data.ts` too.
6. **The mock branch and the live branch of a query must apply the same
   filters.** Two of the last three bugs were the two halves disagreeing:
   `getPipelineLeads` dropped the `archived` filter on the live branch only
   (`a0ba67a`, put 32 dismissed leads back on the board in production), and the
   sign-up route had no mock branch at all (`f580bd4`). Mock mode cannot catch
   these — no fixture is archived — so read both branches side by side.
7. **Never hard-delete a lead.** Archive it (`archived` + `archived_reason`); the
   Archived tab exists for this and it keeps the audit trail. This applies to
   upstream too — see `HANDOVER.md` §3.
