# 0007 — Staleness surfaced: the going-cold view

**Status:** blocked — open decision D1
**Roadmap:** N7
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against live DB:** 2026-08-17

## Problem

Twenty-three open assigned leads have not been touched in 21 days or more, and
nothing anywhere in the product says so.

"Nothing falls through" is one of five stated product principles
(`context/PRODUCT.md`). It is the principle this product currently fails hardest. The
admin cannot see which leads are dying without opening them one at a time, and a rep
has no prompt on their own board either. Leads do not fall through loudly; they just
stop moving, and the current UI is silent about exactly that.

## Evidence

Measured 2026-08-17 against `epyumxjezftahosvegmn`.

- Open assigned leads with `updated_at` older than 21 days: **23** (was 27 four days
  earlier).
- `leads.last_contacted_at` — live, **typed in `types.ts`**, `NULL` on **all 104
  rows**, zero references in `src/`. Nothing writes it: not this repo, not Hermes.
- `leads.last_contacts_attempt` — live, not typed, 67 of 104 populated. This is
  upstream's *enrichment*-attempt clock, **not** a human-contact clock. Do not use it
  as one.
- The kanban already computes `days_in_stage` and `days_since_created` server-side on
  `KanbanLead`, and the board can filter on time in stage. **Time in stage is a
  different clock from last touch** — a lead can sit in `contacted` for 40 days having
  been called yesterday, or having never been called.
- No last-touch column exists in the inbox. No going-cold view exists anywhere.

## Blocker — open decision D1

**There is no true last-touch clock in this system.** Two options, and the choice
changes what this feature can honestly claim:

**Option A — build on `updated_at` (ship now, weaker claim).** Available immediately.
But upstream enrichment writes bump `updated_at`, so a lead can appear "touched" when
no human has acted. The column must then be labelled **"last activity"**, not "last
contacted", and the going-cold view is a useful approximation rather than the truth.

**Option B — this app writes `last_contacted_at` (stronger claim, more work).** The
column already exists. This app would set it on the actions that represent actual
human contact — status moves to `contacted` and beyond, notes added, outreach marked
used, the `mailto:` handoff. Only this app knows when a human acted, so only this app
can populate it honestly. Costs: a decision about which actions count as contact, and
104 rows with no history, so every existing lead starts as never-contacted.

**My recommendation: B, shipped in two steps.** Start writing `last_contacted_at` now
so history accrues from today, and ship the going-cold view on `updated_at` labelled
as "last activity" in the meantime. Switch the view over once the new column has real
coverage. That way nothing waits, and nothing lies.

**This spec stays `blocked` until Dane picks.** Do not start building. Everything
below is written for B with the two-step rollout; if A is chosen, drop the write path
and keep the "last activity" label permanently.

## Decision (pending D1)

- **A last-activity / last-contact column in the inbox**, sortable, showing days
  elapsed. Word plus number, never a bare colour.
- **A "going cold" view for the admin** — open assigned leads past a threshold, worst
  first. This is a view, not just a filter: the admin should be able to land on it and
  work the list top to bottom.
- **The same signal on the rep's board at `/my`**, so a rep sees their own cold leads
  without the admin having to tell them.
- **Threshold: 21 days**, matching the figure the plan has been tracking, and defined
  in one place as a named constant rather than inlined.
- Under option B: `last_contacted_at` is written by the actions that represent human
  contact, and only those.

## Scope

### In

- (B) Write `last_contacted_at` from: status moves to `contacted` / `meeting` /
  `quote` / `won`, `addLeadNote`, `markOutreachUsed`, and the contact-copy /
  `mailto:` handoff. Each write is deliberate and listed — no blanket "any mutation
  touches it".
- Last-activity column in the inbox, sortable.
- Going-cold view for the admin, worst first.
- Staleness indicator on the rep's board and on the kanban card.
- Named threshold constant.
- Fixtures spanning fresh, warm, and 21+ days cold, in both roles' views.
- Regenerate `context/DESIGN.md`; update `context/DATA.md`.

### Out

- Notifications or nudges of any kind. Upstream owns sending
  (`context/DECISIONS.md`, 2026-08-17); in-app assignment awareness is `ROADMAP.md`
  X4, separately.
- Backfilling `last_contacted_at` for the existing 104 leads. There is no history to
  backfill from; inventing one would be fabrication.
- Auto-archiving or auto-returning cold leads. A human decides a lead's fate.
- Changing the existing time-in-stage filter. It stays; it answers a different
  question.
- Using `last_contacts_attempt` as a human-contact signal. It is not one.

## Data

| Column | Table | Type | Populated (2026-08-17) | Role here |
|---|---|---|---|---|
| `updated_at` | leads | timestamptz | 104 / 104 | Proxy clock. Bumped by upstream enrichment. |
| `last_contacted_at` | leads | timestamptz | **0 / 104** | The honest clock, if this app starts writing it. Already typed. |
| `last_contacts_attempt` | leads | timestamptz | 67 / 104 | Upstream enrichment attempts. **Not** human contact. |

No DDL. `last_contacted_at` already exists.

## Empty and degraded states

| Case | Behaviour |
|---|---|
| Never contacted (all 104 at launch, under B) | "Never contacted" — an explicit, and in most cases *correct and alarming*, state. Not a blank, and not sorted as if it were fresh. |
| Cold but unassigned | Excluded from the going-cold view, which is about assigned work falling through. Visible in the inbox column regardless. |
| Won / dead / returned | Excluded. A closed lead going cold is meaningless. |
| Going-cold view empty | A genuine success state, worded as such. Do not render an empty table. |
| Archived | Excluded, as everywhere else. |

## Design notes

- **Status must never rest on colour alone** — this is the change where that rule is
  most tempting to break. Ship the number of days and a word ("21d cold", "never
  contacted"), with tint as reinforcement only.
- Semantic warning `#cf9a3a` and bad `#b8503f` are available as UX convention. Orange
  `#e06c00` is for tiny accents only and is not a surface here.
- Inbox column stays at Attio/Linear density: a compact relative age, not a full
  timestamp. Full timestamp on hover or on the detail page.
- The going-cold view reuses the existing inbox table rather than introducing a new
  layout. Fewer new surfaces, less to keep consistent.

## Acceptance

- [ ] D1 answered and recorded in `context/DECISIONS.md` before any code was written.
- [ ] The inbox has a sortable last-activity / last-contact column.
- [ ] The admin has a going-cold view listing open assigned leads past the threshold,
      worst first, and it surfaces all 23 (or the current figure) on the live data.
- [ ] A rep sees the same signal on `/my` for their own leads.
- [ ] The column label matches the clock actually being used — no "last contacted"
      over `updated_at` data.
- [ ] (B) `last_contacted_at` is written by exactly the listed actions, and by nothing
      else.
- [ ] Every empty-state row is reachable in mock mode.
- [ ] Nothing conveys staleness by colour alone.
- [ ] `npm run build` passes.
- [ ] `routines/REVIEW.md` passes.
- [ ] `context/DESIGN.md` regenerated; `context/DATA.md` updated (including the
      `last_contacted_at` row, which changes meaning under B);
      `context/ROADMAP.md` N7 moved out of Now and D1 closed.

## Risks

- **Touches the inbox, the kanban card, `/my`, and — under B — several server
  actions.** The widest blast radius of anything in Now. Strong argument for shipping
  the read-only view first and the write path second, as two commits on one branch.
- Under B, adding a write to `applyLeadStatus` puts it in the hottest mutation path in
  the app. Keep it a single field update, and never let it fail the status change.
- A new inbox column costs horizontal space on a dense table and on mobile. Check both
  before landing.
- If the going-cold view is honest, it will show 23 leads on day one. That is the
  point, and it should be framed as work to do, not as an error state.

## Open questions

**D1 — who writes the last-touch clock?** Blocking. See above; recommendation is B
with a two-step rollout.
