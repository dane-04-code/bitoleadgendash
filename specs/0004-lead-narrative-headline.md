# 0004 — `why_is_this_a_lead` becomes the lead's headline

**Status:** ready
**Roadmap:** N4
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against live DB:** 2026-08-17

## Problem

The upstream pipeline's best output never reaches the person it was built for.

`leads.why_is_this_a_lead` is a paragraph of sourced reasoning — a named buyer, a
dated event, a contract value, facility detail. It is the strongest signal Hermes
produces. It has **zero references anywhere in `src/`**: not typed, not queried, not
rendered.

Today the admin triages from a number (`score`) and a one-line `signal_summary`, and
then has to open the source URL to find out whether the lead is real. That is the
single largest gap between what the company pays for upstream and what a human sees.

## Evidence

Measured 2026-08-17 against `epyumxjezftahosvegmn`.

| Field | Type | Populated | In `types.ts` | Referenced in `src/` |
|---|---|---|---|---|
| `why_is_this_a_lead` | text | **16 / 104** | no | **no** |
| `score_reason` | text | 104 / 104 | yes | yes |
| `signal_summary` | text | 104 / 104 | yes | yes |

The coverage asymmetry is the whole design problem: the field that replaces two
others is present on 15% of leads, while both fields it replaces are on 100%.

Sixteen is up from 14 four days ago, and the newest lead was created 2026-08-17
04:28 UTC — so coverage grows only on new leads. Assume the existing 88 will never
have one unless upstream backfills.

## Decision

The narrative becomes the headline where it exists, and the older fields become the
fallback where it does not. Decided by Dane 2026-08-17: the narrative **replaces**
`score_reason` and `signal_summary` in the UI. Both are retained in the database.

- **`/leads/[id]`** — a narrative/evidence block at the top of the page, above the
  score and contacts. When absent, the block falls back to `signal_summary`,
  visibly labelled as the older, thinner summary rather than silently substituted.
  `score_reason` moves to sit with the score, as the "why this number" line, and
  stops being a headline in its own right.
- **Inbox row (`/dashboard`)** — a two-line clamp of the narrative. When absent,
  `signal_summary` in the same slot.
- The user must always be able to tell which they are reading. A thin narrative and a
  rich one look similar at a glance, and the difference matters to a triage decision.

Rejected: showing the narrative only when present and leaving the row empty otherwise.
It would make 85% of leads look degraded and would break triage on the existing book.

## Scope

### In

- Type `why_is_this_a_lead` (arrives free if `specs/0002` has landed; otherwise add
  it by hand).
- Add to the relevant reads in `src/lib/queries.ts` — including the inbox list query
  and the lead detail query. Confirm the kanban card query does **not** need it
  (cards should stay light).
- New component: narrative / evidence block. Extends `context/DESIGN.md`.
- `/leads/[id]` layout change: narrative block at top; `score_reason` relocated
  beside the score; `signal_summary` retired from its current position.
- Inbox row: two-line clamp with the fallback.
- Fixtures in `src/lib/mock-data.ts`: at least three leads with a realistic narrative
  and at least three with `null`, so both paths are visible in mock mode. Do not
  invent new company names — use the existing mock set.
- Regenerate `context/DESIGN.md` and its `.impeccable` sidecar.

### Out

- Removing `score_reason` or `signal_summary` from the database or the types. UI
  retirement only.
- Contact-quality surfacing — `specs/0005`.
- `score_breakdown`. It is `NULL` on all 104 leads and all 8 fixtures; the rubric
  stays dark until upstream writes it. See the Appendix.
- Search or filtering on the narrative text.
- Any request to Hermes. Tracked separately in `context/DATA.md` §5.

## Data

| Column | Table | Type | Populated (2026-08-17) | Notes |
|---|---|---|---|---|
| `why_is_this_a_lead` | leads | text | 16 / 104 | Grows on new leads only. Not typed today. |
| `signal_summary` | leads | text | 104 / 104 | Becomes the fallback. |
| `score_reason` | leads | text | 104 / 104 | Relocates to the score. |

## Empty and degraded states

This is the crux of the spec, not an afterthought.

| Case | Detail page | Inbox row |
|---|---|---|
| Narrative present | Narrative block at top, full text | Two-line clamp of the narrative |
| Narrative absent, `signal_summary` present | Fallback block showing `signal_summary`, labelled so the user knows it is the thinner summary | `signal_summary`, same clamp |
| Both absent | An explicit "no reasoning available for this lead" state — never a blank panel | Company and score only; no empty slot holding space |
| Narrative present but very short | Renders as-is. Do not pad it, and do not present a one-liner as though it were sourced reasoning |

Every one of these must be visible in mock mode.

## Design notes

- Extends the existing `.panel` card pattern. Borderless on the ground; hairlines
  only for dividers inside a panel.
- Tokens only. No new hex, no arbitrary radius.
- The narrative is prose, not a data field — it needs a comfortable measure and line
  height, which is a departure from the Attio/Linear density used for tables. That is
  correct: density applies to lists, not to a paragraph a human has to read and judge.
- **The machine proposes, the human disposes.** Frame the narrative as sourced
  reasoning to weigh, never as a verdict. Attribute it — it came from the pipeline,
  not from a colleague.
- Any provenance or freshness marker needs a non-colour carrier: a word or an icon,
  never hue alone.

## Acceptance

- [ ] `/leads/[id]` leads with the narrative when present.
- [ ] The inbox row shows a two-line clamp with no layout shift between the
      narrative, the fallback, and the absent case.
- [ ] `score_reason` appears with the score, not as a headline.
- [ ] `signal_summary` no longer appears in its old position, and appears as the
      labelled fallback.
- [ ] All four rows of the empty-state table are reachable in mock mode.
- [ ] A user can tell whether they are reading the narrative or the fallback.
- [ ] `npm run build` passes.
- [ ] `routines/REVIEW.md` passes.
- [ ] Fixtures updated (≥3 with, ≥3 without). No new company names invented.
- [ ] `context/DESIGN.md` regenerated with the new component.
- [ ] `context/DATA.md` §3 row updated; `context/ROADMAP.md` N4 moved out of Now.

## Risks

- Touches the inbox row, which is the admin's most-used surface. A layout shift
  between leads with and without a narrative would be a daily irritation — check
  with a mixed list, not a uniform one.
- Retiring `signal_summary` from its current position is a capability change in
  appearance. It is covered by Dane's 2026-08-17 decision; note it in the handback so
  it is not mistaken for an accident.
- Narrative length is unbounded upstream. Clamp on the row and let the detail page
  breathe; do not assume a maximum.

## Open questions

Open decision **D3** (`context/ROADMAP.md`): will upstream extend coverage past 16 of
104, and does the narrative supersede the older fields upstream too, or only in the
UI? This does **not** block the build — the fallback is required regardless. It
decides only whether the fallback is permanent.

---

## Appendix — `score_breakdown` writer spec, for upstream

Not part of this spec's scope. Recorded here because it is the same conversation with
Hermes, and it is the only place the spec exists.

`leads.score_breakdown` is `JSONB`: an array of objects, one per criterion.

```json
[
  { "key": "signal_fresh", "label": "Signal freshness (< 30 days)",
    "passed": true,  "note": "Contract awarded 2026-07-29" },
  { "key": "verified_contact", "label": "Verified contact found",
    "passed": false, "note": null }
]
```

`key` must be one of the eight in `SCORE_BREAKDOWN_CRITERIA`
(`src/lib/supabase/types.ts`): `signal_fresh`, `hiring_signal`, `expansion_signal`,
`industry_match`, `verified_contact`, `gcc_location`, `company_scale`, `product_fit`.
`passed` is a boolean. `note` is a short evidence string or `null`. Omitted keys
render as a greyed, unevaluated row, so a partial array is safe. Backfilling existing
leads is optional.

The mock fixtures must also be populated — all 8 are `null`, which is why the dark
feature went unnoticed through design and review.

Status: open upstream request, decision **D5**.
