# CLAUDE.md

Working notes for Claude Code on **BITO LeadIntelligence** (`bitoleadgendash`).
Read this before touching anything. Last verified against the live database
2026-08-13.

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

**`.env.local` in this checkout holds placeholder Supabase values on purpose.**
That keeps `isMockMode()` true, so the whole app renders from
`src/lib/mock-data.ts` with no database. That is the intended local demo path —
do not "fix" it by pasting production credentials in.

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

Because the app talks to Supabase with the **anon key** and most tables have RLS
disabled, all authorization is enforced in application code. Do not add a
client-side query path that trusts the browser.

## Design constraints — binding

**`DESIGN.md` is a snapshot of the pre-comp build (2026-08-12) and is now stale
in several load-bearing ways — see the banner at the top of that file. Until it
is regenerated, the source of truth for shape, type and colour is
`src/app/globals.css` + `tailwind.config.ts`, i.e. the shipped tokens.**
`PRODUCT.md` still holds the product contract and remains authoritative.

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
   daily use and hard-won. Removing a capability needs explicit approval.
2. **Verify against the live DB before wiring a field.** See drift note above.
3. **Do not fabricate** customer names beyond the mock set, win rates, revenue
   figures, or any claim about what the upstream agents can do.
4. **Production DDL needs explicit approval**, even additive columns.
5. Mock mode and live mode must both keep working. If you add a field, add it to
   `mock-data.ts` too.
