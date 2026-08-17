# 0002 — Generated types + a drift check that fails the build

**Status:** ready
**Roadmap:** N2
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against live DB:** 2026-08-17

## Problem

`src/lib/supabase/types.ts` is hand-maintained and does not match production. Five
live `leads` columns are missing from it. Because almost every read in
`src/lib/queries.ts` uses `select("*")`, a column the types do not know about arrives
as `undefined` rather than raising — so drift produces **silently wrong UI**, not an
error.

The drift count grew between two audits four days apart. Every other item in Now
pays a verification tax until this is fixed, and each one that ships without it adds
another place drift can hide.

## Evidence

Measured 2026-08-17 against `epyumxjezftahosvegmn`.

Live in `leads`, absent from `types.ts`:

| Column | Type | Populated |
|---|---|---|
| `why_is_this_a_lead` | text | 16 / 104 |
| `signal_date` | date | 91 / 104 |
| `signal_url` | text | — |
| `contacts_count` | integer | 104 / 104 |
| `last_contacts_attempt` | timestamptz | 67 / 104 |

Typed but referenced nowhere in `src/` outside the type definition:
`last_contacted_at` (0 / 104 populated), `do_not_contact` (23 flagged),
`last_article_check`.

`grep -rn 'select("\*")' src/lib/queries.ts` shows the pattern is the norm, not the
exception.

## Decision

Generate types from the live database, commit the generated file, and add a script
that regenerates and diffs — failing when the committed types no longer match
production. Wire it into `npm run build` so it cannot be skipped, since `build` is
the only gate this repo has.

Keep hand-written domain types (`LeadStatus`, `SCORE_BREAKDOWN_CRITERIA`,
`FEEDBACK_CATEGORIES`, `ScoreBreakdownItem`, the display-label maps) in a separate
file. They encode product meaning that no generator can produce, and they must not
be clobbered on every regeneration.

Rejected: continuing to hand-maintain with a lint rule. The failure is that nobody
knows a column appeared — a rule cannot check for the unknown.

## Scope

### In

- `src/lib/supabase/database.types.ts` — generated, committed, never hand-edited.
  Header comment saying so.
- `src/lib/supabase/types.ts` — becomes the domain layer: re-exports the generated
  row types under the existing names (`Lead`, `Contact`, `Rep`, …) so no import site
  changes, plus the hand-written product types.
- `package.json`:
  - `types:generate` — regenerate from the live project.
  - `types:check` — regenerate to a temp file, diff against the committed one, exit
    non-zero on a difference with a message naming the drifting columns.
  - `build` — runs `types:check` first.
- Fix every type error the newly-honest types surface. Expect some: nullability will
  be stricter than the hand-written guesses.
- Add the five missing columns to `src/lib/mock-data.ts` fixtures — at least one
  fixture populated and one not, for each.
- Document the workflow in `context/ARCHITECTURE.md` §2 and the drift-resolution in
  `context/DATA.md` §3.

### Out

- **Removing `select("*")`.** Tempting, and a much larger diff across ~1000 lines
  with no test coverage. Generated types make `select("*")` safe enough. If it is
  worth doing, it is a separate spec.
- Rendering any of the newly-typed columns. Typing is not surfacing —
  `why_is_this_a_lead` is `specs/0004`, `do_not_contact` is `specs/0006`.
- Reconciling migration files — `specs/0003`.
- Any DDL.

## Data

No schema change. Read-only introspection of the live project.

**Requires a Supabase access token in the environment for generation.** If CI has no
token, `types:check` must fail loudly with an explanatory message rather than
silently passing — a check that skips itself is worse than no check.

## Empty and degraded states

Not user-facing. The developer-facing failure state matters: when `types:check`
fails, the message must name the drifting table and columns, and point at
`routines/VERIFY-SCHEMA.md`. A bare "types are out of date" wastes the next
person's time.

## Design notes

None.

## Acceptance

- [ ] `src/lib/supabase/database.types.ts` exists, is generated, matches production.
- [ ] `types.ts` re-exports the existing type names; no import site in `src/`
      changed.
- [ ] The five missing `leads` columns are present in the types.
- [ ] `npm run types:check` passes against current production.
- [ ] Introducing a fake drift makes `types:check` fail with a message naming the
      column.
- [ ] `npm run build` runs the check and passes.
- [ ] Fixtures carry all five new fields, populated in some and not others.
- [ ] `routines/REVIEW.md` passes.
- [ ] `context/DATA.md` §3 rows for the five columns updated to "typed"; the
      "five live columns missing" claim removed from `CLAUDE.md` §3,
      `context/ARCHITECTURE.md` §8 and `routines/VERIFY-SCHEMA.md`.
- [ ] `context/ROADMAP.md` N2 moved out of Now.

## Risks

- **Stricter nullability will surface real type errors** across `queries.ts`,
  `actions.ts` and the pages. That is the point, but it makes the diff wider than it
  looks. Fix them honestly — never widen a type or add `as any` to make an error go
  away.
- Tying `build` to a live-database call means the build now needs network access and
  a token. If that is unacceptable in the deployment environment, make the check a
  separate command and say so explicitly in `CLAUDE.md` — do not leave it optional
  and unmentioned.
- The generator may name types differently than the current hand-written ones. The
  re-export layer is what keeps that from becoming a repo-wide rename.

## Open questions

None blocking. Confirm during the work whether the deployment environment can hold a
Supabase access token; if not, note the fallback in `CLAUDE.md` §5.
