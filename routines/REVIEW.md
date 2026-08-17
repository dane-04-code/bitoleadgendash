# Routine: REVIEW

**This is a gate, not a checklist to skim.** Every change to this repo passes it
before being declared done — including changes made by an agent, including changes
that look trivial. There is no test suite here; this routine is the only thing
standing between a mistake and the sales team.

**How to run it.** Work top to bottom. For each check, produce the *evidence*
named — a command output, a grep result, a file and line. A check without evidence
is a fail. Then fill in the report block at the bottom and state a verdict.

**Verdict rules.** Any blocking check failing = **FAIL**, and the change does not
land. Advisory findings do not block but must be listed. Do not soften a fail into
"mostly passing". Do not fix a blocking failure silently and report PASS without
saying what you fixed.

---

## A. Blocking checks

### A1 — The build passes

```bash
npm run build
```

**Evidence:** the final lines of output, including any warnings.
**Fails if:** non-zero exit, a type error, or a new warning your change introduced.
This is the only automated gate in the repo. Never report a change as done without
having run it.

### A2 — No client-side data access

```bash
grep -rn "getSupabaseBrowserClient" src/
grep -rn "supabase/browser" src/
```

**Evidence:** the full output (expected: only the definition in
`src/lib/supabase/browser.ts`).
**Fails if:** any caller exists anywhere. Also fails if a client component
(`"use client"`) imports from `@/lib/queries` as a *value* rather than with
`import type`, or imports `@/lib/supabase/server` at all.
**Why:** the app holds the service-role key. A client-side path either leaks it or
reads nothing. See `context/DECISIONS.md`, 2026-08-15.

### A3 — Every server action you touched guards itself

For every action added or modified in `src/app/actions.ts`:

```bash
grep -n "^export async function" src/app/actions.ts
```

**Evidence:** for each action in your diff, quote the guard lines.

An action passes only if, before it touches data, it:

1. Establishes the session — `getSession()` or `getCurrentRepId()`.
2. **Rejects** when there is none. Reading the session and continuing anyway is a
   fail; `currentActorName()` returning `null` is not a guard.
3. Asserts the role the action requires. Admin-only work needs
   `session?.role !== "admin"` → return an error.
4. For rep-scoped work, asserts **ownership** — `isLeadOwnedByRep()` — not just
   that the caller is some rep.

Reference implementation: `toggleRepActive`. Rep-scoped reference: `returnLead`,
`claimLead`.

**Fails if:** any action in your diff lacks any of the four, or if your change adds
a new unguarded action. Middleware does not cover this — a server action is a POST
endpoint any authenticated session can call directly, and the database will not
stop it because the service-role key bypasses RLS.

> Known pre-existing failures as of 2026-08-17: nine actions are unguarded
> (`setRepPassword`, `clearRepPassword`, `deleteRep`, `createRep`,
> `assignLeadToRep`, `updateLeadStatus`/`moveLeadToStatus`/`applyLeadStatus`,
> `addLeadNote`, `deleteLeadNote`, `saveLeadReview`). You are not required to fix
> all of them in an unrelated change — that is `specs/0001` — but you must not add
> a tenth, and you must not leave one you touched unfixed.

### A4 — Every field you render was verified live

For each database column your change reads or writes, run the verification in
`routines/VERIFY-SCHEMA.md`.

**Evidence:** the query output, with the date, showing the column exists and how
many rows have a non-null value.
**Fails if:** you rendered a column without checking, or checked only `types.ts`.
`types.ts` is hand-maintained and currently missing five live `leads` columns.
Almost every read uses `select("*")`, so a missing column arrives as `undefined`
rather than an error — drift fails silently.

### A5 — Partial data has a designed empty state

**Evidence:** name the empty state for each field, and the coverage figure that
makes it necessary.
**Fails if:** a field can be `NULL` in production and your UI renders a blank, a
bare label, or a component that returns `null` invisibly.
**Why this is blocking:** `score_breakdown` shipped, was reviewed, and has never
rendered for a single user in any environment — because it is `NULL` on all 104
production leads and all 8 mock fixtures, and `ScoreBreakdown` returns `null`
quietly. A feature that renders nothing looks finished. Coverage is partial by
nature here: 16/104 narratives, 34/182 verified emails, 1/182 phones.

### A6 — Mock mode still works

```bash
grep -rn "isMockMode" src/app/actions.ts | head -40
```

**Evidence:** confirm each action you touched has its `isMockMode()` branch, and
that any new field is present in `src/lib/mock-data.ts` with realistic values —
including at least one fixture where it is populated and one where it is not.

**Fails if:** a new field is absent from the fixtures, or a new action has no mock
branch. Both modes must keep working. Fixtures that are uniformly `null` for a new
field are how a dark feature passes review.

### A7 — Authorization is unchanged or tightened, never loosened

**Evidence:** state explicitly whether your diff touches `src/middleware.ts`,
`src/lib/auth.ts`, `src/lib/auth-edge.ts`, `src/app/api/auth/**`, or any guard in
an action. If it does, quote before and after.
**Fails if:** a route left `ADMIN_ONLY`, a guard was relaxed, a role check was
removed, or a rep gained access to anything outside their own book. "Two roles, one
truth" — a rep sees exactly their book, never a filtered illusion of the whole.

### A8 — Tokens only

```bash
git diff -U0 | grep -nE "#[0-9a-fA-F]{3,8}|rounded-\[|border-radius|rgba?\("
```

**Evidence:** the output (expected: empty).
**Fails if:** a new hex value, an arbitrary radius, or a raw colour function
appears outside `src/app/globals.css` / `tailwind.config.ts`. Colour, radius and
spacing come from the tokens via `context/DESIGN.md`.

### A9 — Status is never conveyed by colour alone

**Evidence:** for any status, stage or state indicator in your diff, name the
non-colour carrier — the word, an icon, a shape.
**Fails if:** meaning rests on hue. The stage palette is a **single-hue teal
ramp**; two stages differ only in tint, so colour alone is unreadable. Every stage
chip ships the stage word beside its tint.

### A10 — No capability was removed

**Evidence:** confirm no route, filter, tab, action or field disappeared. If one
did, quote Dane's approval.
**Fails if:** a capability was dropped to simplify the change. The feature set is
in daily use and hard-won. A redesign replaces the look, never the function.

### A11 — Nothing fabricated

**Evidence:** confirm no invented customer names beyond the existing mock set, no
win rates, no revenue figures, no claims about what Hermes can do.
**Fails if:** any appear, including in copy, fixtures, comments or the change
description. If you inferred something, label it as an inference.

### A12 — No unapproved production DDL

**Evidence:** state whether the change requires any schema change. If it does,
quote Dane's explicit approval, including for additive columns.
**Fails if:** DDL was applied without it. Writing a migration file is fine;
applying it is not.

### A13 — Scope matches the spec

**Evidence:** name the spec in `specs/` and confirm the diff does only what it
describes.
**Fails if:** there is no spec, or the diff exceeds it. If the spec turned out to
be wrong, amend the spec explicitly and say so — do not silently rescope. Pick work
from `context/ROADMAP.md` "Now", never from your own sense of what would be nice.

### A14 — Context files updated in the same change

**Evidence:** list the context files you touched, or state why none needed it.

Required updates:

| If your change… | Update |
|---|---|
| ships a Now item | `context/ROADMAP.md` |
| discovers drift, a new column, or new coverage figures | `context/DATA.md` |
| resolves an open decision | `context/DECISIONS.md` + the blocked item |
| adds or changes a component or token | `context/DESIGN.md` (regenerate) |
| changes how the app is wired | `context/ARCHITECTURE.md` |
| changes what a spec promised | the spec itself |

**Fails if:** the change makes a context file wrong and leaves it wrong. Stale
context is how this project loses time.

## B. Advisory — report, do not block

- **Revalidation.** Does every mutated route get a `revalidatePath`? A missed one
  looks like a broken write to the user.
- **Error surfacing.** Does the caller show the `{ ok: false, error }` the action
  returns, or swallow it into a silent no-op?
- **Blast radius.** Did the change touch `kanban-board.tsx` (25k, drag-and-drop,
  nine columns) or add to `actions.ts` / `queries.ts` (~930 / ~1000 lines)? Say so.
- **Mobile.** Both roles work away from a desk. Did you consider small widths?
- **Density.** Attio/Linear for tables and lists; roomier kanban cards. Does it hold?
- **Judgement speed.** Did this shorten the distance between seeing a lead and
  deciding its fate, or add a step? If it added one, justify it.
- **Machine vs human framing.** Is machine output presented as an input to a
  decision, never as a conclusion?

## C. Report block

Fill this in verbatim and include it in the handback. Do not abbreviate it.

```
REVIEW — <spec id> · <branch> · <date>

Change: <one sentence>
Spec:   specs/<file>

BLOCKING
A1  build            PASS / FAIL   <evidence>
A2  no client data   PASS / FAIL   <evidence>
A3  action guards    PASS / FAIL / N/A   <evidence per action>
A4  fields verified  PASS / FAIL / N/A   <query + date>
A5  empty states     PASS / FAIL / N/A   <evidence>
A6  mock mode        PASS / FAIL   <evidence>
A7  authz unchanged  PASS / FAIL   <evidence>
A8  tokens only      PASS / FAIL   <evidence>
A9  not colour-only  PASS / FAIL / N/A   <evidence>
A10 no capability lost PASS / FAIL <evidence>
A11 nothing fabricated PASS / FAIL <evidence>
A12 no unapproved DDL  PASS / FAIL <evidence>
A13 scope matches spec PASS / FAIL <evidence>
A14 context updated    PASS / FAIL <files>

ADVISORY
<findings, or "none">

ESCALATIONS
<decisions needed from Dane, or "none">

VERDICT: PASS / FAIL
```

## D. When to escalate instead of deciding

Stop and report rather than guessing on: production DDL, removing a capability,
anything touching auth, and anything that depends on an open decision in
`context/ROADMAP.md` §5. Do the preparatory work first, then stop and state
precisely what decision is needed and why.
