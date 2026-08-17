# CLAUDE.md

Entry point for any agent working on **BITO LeadIntelligence** (`bitoleadgendash`).
Read this file in full before touching anything. It is short on purpose: it tells
you where the real context lives, who you are building for, and the bar the code
has to clear.

Last verified against the live database **2026-08-17**.

---

## 0. Read order

Do not start work from this file alone. Load what the task needs:

| Read this | When |
|---|---|
| `context/PRODUCT.md` | Always. Users, purpose, principles, brand commitments. Binding. |
| `context/ARCHITECTURE.md` | Always before writing code. How the app is wired and the rules that follow from it. |
| `context/DATA.md` | Before touching any database field. Live schema truth, drift, and the queries to verify it. |
| `context/ROADMAP.md` | Before proposing or picking up work. What is committed, what is proposed, what is permanently out of scope. |
| `context/DESIGN.md` | Before any visual change. The design system as shipped. |
| `context/DECISIONS.md` | When something looks arbitrary. It probably was decided, with a reason and a date. |
| `specs/` | One file per unit of work. If a spec exists for your task, it is the contract. If none exists, write one first. |
| `routines/REVIEW.md` | Before declaring any change done. This is a gate, not a suggestion. |
| `routines/SHIP.md` | The end-to-end workflow from request to landed change. |
| `routines/VERIFY-SCHEMA.md` | Any time you are about to rely on a column. |

`context/archive/` holds superseded plans. Historical only — never plan from it.

## 1. What this repo is

The **frontend only** — a Next.js 14 App Router console over a Supabase
database. Lead data is produced upstream by an autonomous research pipeline
("Hermes" / the agents), which writes directly into Supabase. This repo does not
discover, enrich, or score leads. It is the human decision layer on top.

Two consequences that shape everything:

1. **The database schema changes without a commit in this repo.** Never assume
   `src/lib/supabase/types.ts` matches production. Verify first —
   `routines/VERIFY-SCHEMA.md`.
2. **This repo does not own the data.** Rows appear, get enriched, and get
   deleted upstream. Design for that, do not fight it.

## 2. Who you are coding for

Two humans, both in daily use, both frequently away from a desk. Full detail in
`context/PRODUCT.md` — that file is binding, this is the sketch.

- **The admin / manager.** Currently Dane; being handed to Dean. Triages every
  inbound lead, assigns or lists it, watches the whole pipeline. Their scarce
  resource is **attention** — they are deciding the fate of ~100 live leads and
  cannot afford to hunt for the ones going cold.
- **The sales rep.** A named seller working UAE/KSA/GCC. Works only their own
  book. Their scarce resource is **certainty about what to work next** — a rep who
  has to interpret the UI falls back to their own notes and the pipeline data rots.

Neither is a power user, neither will read documentation. Write for the person
mid-conversation on a phone, not for the demo. The five product principles in
`PRODUCT.md` are the tiebreaker in any design argument; the one that decides most
of them is **judgement speed over data entry**.

## 3. The quality bar

`routines/REVIEW.md` §A is the enforced list. This section is **why** those checks
exist — the history a reviewer cannot infer from the rules.

**Verify before you surface.** Almost every read in `src/lib/queries.ts` uses
`select("*")`, so a column that does not exist in production arrives as
`undefined` rather than raising. Drift fails **silently**. `score_breakdown` sat
"shipped" and completely dark for weeks that way: `NULL` on all 104 production
leads *and* all 8 mock fixtures, with `ScoreBreakdown` quietly returning `null`. A
feature that renders nothing looks finished, which is worse than one that is
obviously missing.

**Every server action guards itself.** Middleware protects *pages*; a server
action is a POST endpoint any authenticated session can call directly. The
database will not stop it either — the app holds the service-role key, which
bypasses RLS. Two actions shipped unguarded and were caught late (`bb89ff5`), and
as of 2026-08-17 **nine** are unguarded, four of them admin-privileged rep
management. That is `specs/0001`. Do not add a tenth.

**Both modes, or the feature is untested.** `isMockMode()` serves the entire app
with no database. Add a field to the schema, add it to `src/lib/mock-data.ts` in
the same change — with one fixture populated and one not. Uniformly-`null`
fixtures are precisely how a dark feature passes design *and* review.

**Coverage is partial and will stay partial.** 16 of 104 leads have a narrative,
34 of 182 contacts a verified email, 1 of 182 a phone number. Every field needs a
designed empty state. Never leave a labelled field pretending to be a capability.

**Types describe reality, not convenience.** `types.ts` is hand-maintained and
currently missing five live columns. Treat the live database as the truth until
`specs/0002` lands, and never widen a type or reach for `as any` to make an error
go away.

**Convention is the commitment.** Attio/Linear density for tables and lists,
roomier kanban cards. Execute the category standard at full fidelity. Do not
reopen the aesthetic; do not smuggle in quirk.

**Small, reviewable, described.** One spec, one branch, one concern. `npm run
build` is the only automated gate in this repo — there is no test suite, so your
own discipline is the rest of it.

## 4. Hard rules — violating any of these fails review

1. **No production DDL without explicit approval from Dane**, even additive
   columns.
2. **No client-side data access**, ever. Zero callers on the browser client.
3. **Every server action asserts session and role** before it touches data.
4. **Never fabricate** customer names beyond the mock set, win rates, revenue
   figures, or any claim about what the upstream agents can do. If you do not
   know, say so and mark it.
5. **Never place the BITO logo.** A slot is reserved in the layout and stays
   empty. Colours and type only.
6. **Do not remove a capability** to simplify a change.
7. **Do not edit `context/archive/`.** It is history.
8. **Local dev writes to production.** `.env.local` points at the live project,
   so a status change in dev is a status change for the sales team. To get the
   offline path back, restore the placeholder Supabase values kept in the comment
   at the top of `.env.local`; `isMockMode()` flips true and the app renders
   entirely from fixtures.
9. **Every changed line traces to the request.** Do not improve adjacent code,
   comments or formatting. Do not refactor what is not broken. Match the existing
   style even where you would do it differently. Notice unrelated dead code —
   mention it, do not delete it. `actions.ts` and `queries.ts` are ~930 and ~1000
   lines with no test coverage; tidying while you work is how a regression ships
   unnoticed.
10. **Minimum code that solves the problem.** No features beyond what was asked.
    No abstraction for single-use code. No configurability nobody requested. No
    error handling for states that cannot occur. If you wrote 200 lines and it
    could be 50, rewrite it before handing it back.
11. **Clean up only your own mess.** Remove the imports, variables and helpers
    *your* change orphaned. Leave pre-existing dead code alone unless asked.
12. **Never hard-delete a lead.** Archive it (`archived` + `archived_reason`);
    the Archived tab exists for this and it keeps the audit trail.
13. **The mock branch and the live branch of a query must apply the same
    filters.** `getPipelineLeads` dropped the `archived` filter on the live
    branch only (`a0ba67a`) and put 32 dismissed leads back on the board in
    production; the sign-up route had no mock branch at all (`f580bd4`). No
    fixture is archived, so mock mode cannot catch these — read both branches
    side by side.

## 5. Commands

```bash
npm run dev     # localhost:3000 — reads and writes PRODUCTION data
npm run build   # production build + typecheck — the only automated gate
npm run lint
```

There is no test suite. Do not claim a change is tested.

## 6. Live Supabase project

| | |
|---|---|
| Name | `BITOLEADGEN` |
| Project ref | `epyumxjezftahosvegmn` |
| Region | ap-northeast-1 |

Reach it with the Supabase MCP tools (`list_tables`, `execute_sql`,
`apply_migration`, `get_advisors`) using that project ref. RLS is enabled
deny-by-default on all 13 tables with zero policies; the app connects with
`SUPABASE_SERVICE_ROLE_KEY` from the server only. Details and current row counts
in `context/DATA.md`.

## 7. Working autonomously

This project is moving to an agentic workflow: a controlling agent invokes you
through the CLI, and there may be nobody watching the turn. In that mode:

- **Pick work from `context/ROADMAP.md` "Now", never from your own judgement of
  what would be nice.** If Now is empty, stop and report rather than inventing
  scope.
- **Write or update the spec before the code.** `specs/README.md` has the
  template. The spec is what a reviewer — human or agent — checks the diff
  against.
- **Run `routines/REVIEW.md` on your own diff** and include the filled-in
  evidence block in your report. A change without a passed review is not done.
- **Escalate rather than guess** on: production DDL, removing a capability,
  anything touching auth, anything requiring a decision listed as open in
  `context/ROADMAP.md`. Do the preparatory work, then stop and state the decision
  needed. Off that list, do not stall waiting for a human who may not be there —
  take the most reasonable reading, **state the assumption at the top of your
  report**, and proceed.
- **Never hide confusion.** If the request has two plausible readings, say both
  and name which you took — do not pick silently. If a simpler approach exists,
  say so before building the complicated one; push back when the request looks
  wrong. An unstated assumption is the expensive kind.
- **Update the ledger.** If you change what is true — ship an item, discover
  drift, close a question — update `context/ROADMAP.md` and `context/DATA.md` in
  the same change. Stale context is how this project loses time.
- **Do not silently rescope.** If the spec turns out to be wrong, say so in the
  report and amend the spec explicitly.
