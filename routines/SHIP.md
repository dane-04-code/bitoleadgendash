# Routine: SHIP

The end-to-end path from a request to a landed change. Follow it in order. It is
written for an agent working with nobody watching the turn, and it is the same
path a human should take.

---

## 1. Orient (always, even for a small change)

Read, in this order:

1. `CLAUDE.md` — the rules and the quality bar.
2. `context/ROADMAP.md` — is this in **Now**? If it is in **Next**, it needs a
   spec first. If it is in **Later** or **Out of scope**, **stop and say so** —
   Later is a proposal, not a commitment, and Out of scope needs Dane.
3. `context/PRODUCT.md` — who this is for.
4. `context/ARCHITECTURE.md` — how it is wired.
5. Whatever else the task touches: `context/DATA.md` for fields,
   `context/DESIGN.md` for surfaces, `context/DECISIONS.md` when something looks
   arbitrary.

If the request contradicts a decision in `DECISIONS.md`, do not quietly comply.
Name the decision and ask.

## 2. Verify the ground truth

Before designing anything that touches data, run `routines/VERIFY-SCHEMA.md`.

Confirm the columns exist, and — just as important — **how many rows actually have
a value**. A column that exists and is `NULL` everywhere is not a feature you can
ship; it is an upstream request. `score_breakdown` is the standing example: live,
typed, read by the UI, and `NULL` on all 104 leads and all 8 fixtures.

Record what you measured. It goes into the spec and into `context/DATA.md` if the
numbers moved.

## 3. Write or update the spec

One spec per unit of work, in `specs/`. Template and conventions:
`specs/README.md`.

The spec is the contract the diff gets reviewed against. Writing it is not
overhead — it is where you discover that the field is empty, the decision is
unmade, or the scope is three changes wearing one coat.

If a spec already exists, read it and confirm it still matches reality. Amend it
explicitly if not. Never let the code drift from the spec silently.

**If the work needs a decision listed as open in `ROADMAP.md` §5: stop here.**
Finish the spec, state the decision needed, hand back. Do not pick the option you
prefer and proceed.

## 4. Branch

```bash
git checkout -b <kind>/<short-slug>     # feat/ fix/ chore/ docs/
```

One spec, one branch, one concern. Never work on `main`.

## 5. Build

**First, turn the task into something you can verify.** A weak criterion ("make it
work") means you cannot tell when you are done and will need a human to say so. A
strong one lets you loop on your own. This repo has **no test suite**, so the
instruments are the build, mock mode, and `routines/REVIEW.md` — not tests. Do not
stand up a test framework to satisfy this step; that is scope nobody asked for.

Restate the task as a plan of steps, each with the check that proves it:

```
1. Add field to types + fixtures    → verify: build passes, one populated
                                              and one null fixture render
2. Read path in queries.ts          → verify: field reaches the page in mock mode
3. Guard + mutate in actions.ts     → verify: denied for the wrong role,
                                              works for the right one
4. UI + empty states               → verify: every row of the spec's
                                              empty-state table is reachable
5. REVIEW.md                        → verify: report block, all blocking PASS
```

Translations that work here:

| Vague | Verifiable in this repo |
|---|---|
| "Add validation" | Exercise each invalid input in mock mode; the action returns `{ ok: false, error }` and the caller shows it |
| "Fix the bug" | Reproduce it in mock mode first, with the fixture that triggers it, then confirm the same path is clean |
| "Surface field X" | All four empty-state cases reachable in mock mode, not just the happy one |
| "Refactor X" | Build passes before and after, and the diff removes no capability |

Then work in small steps against the house patterns in `context/ARCHITECTURE.md` §6.

The order that avoids rework:

1. **Types first** — until `specs/0002` lands, `types.ts` is hand-maintained and
   incomplete. Add the field you verified in step 2.
2. **Fixtures next** — `src/lib/mock-data.ts`, with at least one fixture where the
   field is populated and one where it is not. Doing this second, not last, is what
   makes the empty state real instead of theoretical.
3. **Read path** — `src/lib/queries.ts`.
4. **Write path** — `src/app/actions.ts`. Guard first, then mutate. See
   `toggleRepActive` for the admin shape, `returnLead` for the rep-scoped shape.
5. **UI last** — server component, then client component if it needs interaction.
   Tokens only. Status never by colour alone.

Run `npm run build` as you go, not once at the end. It is the only automated gate
in the repo.

Remember `npm run dev` reads and writes **production data**. There is no staging.
If you need to exercise a destructive path, restore the placeholder Supabase values
in `.env.local` to get mock mode back first.

## 6. Review

Run `routines/REVIEW.md` against your own diff, in full, and fill in the report
block.

A **FAIL** on any blocking check means the change does not land. Fix it and re-run
rather than explaining why it is acceptable.

## 7. Update the context

In the **same change**, not a follow-up:

- `context/ROADMAP.md` — move the shipped item out; note the date; check whether it
  unblocked anything in Next.
- `context/DATA.md` — new drift, new columns, new coverage figures. Overwrite §1
  with the new measurement and timestamp; do not append.
- `context/DECISIONS.md` — any decision that got answered.
- `context/DESIGN.md` — regenerate if a component or token changed, along with its
  `.impeccable` sidecar.
- The spec — mark it shipped, and record anything that turned out differently than
  planned.

## 8. Commit and hand back

Commit messages: what changed and why, referencing the spec.

```
feat: guard rep-management server actions (specs/0001)

Adds session + admin role assertions to createRep, setRepPassword,
clearRepPassword and deleteRep. Any authenticated rep could previously
take over another rep's account via setRepPassword.
```

Do **not** push or open a PR unless asked.

Hand back with:

- What changed, in one or two sentences.
- The filled-in REVIEW report block.
- Anything you escalated, and precisely what decision is needed.
- Anything you discovered that is not in the context files yet.

Do not claim a change is tested. There is no test suite.

## 9. If you get stuck

Stop and report rather than expanding scope. Specifically, stop on:

- Production DDL needed.
- A capability would have to be removed.
- Anything touching auth beyond adding a guard.
- An open decision from `ROADMAP.md` §5 blocks the design.
- The spec turns out to be wrong in a way you cannot amend confidently.
- Three attempts at the same failure.

Report what you tried, what you found, and the specific question. A clear
escalation is a good outcome. Guessing is not.
