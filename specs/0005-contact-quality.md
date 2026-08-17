# 0005 — Contact quality made visible

**Status:** ready
**Roadmap:** N5
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against live DB:** 2026-08-17

## Problem

A rep opening a lead sees an undifferentiated list of contacts and has to guess who
to call. The information that would answer it already exists on every row and is
rendered nowhere.

`contacts.email_verified`, `role_fit`, `enrichment_method` and `note` are live,
populated, and **typed in `types.ts`** — and referenced only by `types.ts` and
`mock-data.ts`. No UI surface. Meanwhile 62 of 182 contacts have no email at all,
and only 34 have a verified one, so an untriaged list also wastes the rep's time on
contacts that cannot be reached.

## Evidence

Measured 2026-08-17.

| Field | Type | Populated / total | In UI |
|---|---|---|---|
| `email_verified` | boolean | **34 verified** / 182 | no |
| `role_fit` | text | populated across the set | no |
| `enrichment_method` | text | populated across the set | no |
| `note` | text | partial | no |
| `email` | text | 120 / 182 | yes |
| `phone` | text | **1 / 182** | yes |
| `is_primary` | boolean | — | yes |

`grep -rn "email_verified\|role_fit\|enrichment_method" src/` returns hits only in
`types.ts` and `mock-data.ts`.

Note `role_fit` is free `text`, not an enum — its actual value distribution must be
measured before the UI assumes a set of levels. Do that in step 2 of
`routines/VERIFY-SCHEMA.md` before designing the ranking.

## Decision

Rank the contact list by usefulness and mark the evidence behind the ranking, so the
first contact in the list is the one to call.

- **Order:** primary contact first, then by `role_fit`, then verified email, then any
  email, then the rest. The ordering rule ships as a single documented comparator in
  `src/lib/queries.ts` — not scattered across the component — so it can be changed in
  one place when `role_fit` values turn out messier than expected.
- **Mark:** a verified email carries a verified marker. Role fit is shown as a chip.
  `enrichment_method` is provenance — quiet, secondary, available but not shouting.
  `note` renders inline where present.
- **Phone:** per Dane's 2026-08-17 decision, phone stays as a channel and sourcing is
  an upstream request. Until coverage improves, phone renders **only when present** —
  no empty labelled phone field. The UI must not imply a working channel that exists
  for 1 contact in 182.

Rejected: a computed "contact quality score". This product's principle is that the
machine proposes and the human disposes; a synthesised number would hide the evidence
the rep actually needs, and would be a scoring behaviour in a repo that explicitly
does not score.

## Scope

### In

- Measure the real `role_fit` value distribution first, and record it in
  `context/DATA.md`.
- A documented comparator in `src/lib/queries.ts` for contact ordering.
- Contact-quality chip set as a new component. Extends `context/DESIGN.md`.
- Verified-email marker, role-fit chip, provenance line, inline `note`.
- Phone rendered only when present.
- `/leads/[id]` contact list updated to use the ordering and the chips.
- Fixtures: contacts covering verified and unverified, each observed `role_fit`
  value, present and absent `note`, and the no-email case. Use existing mock names.
- Regenerate `context/DESIGN.md` and its sidecar.

### Out

- The narrative headline — `specs/0004`.
- Any computed quality score.
- Editing contacts. This repo does not own contact data; enrichment is upstream.
- Contact-level filtering or search.
- Removing phone from the UI (decided against, 2026-08-17).
- Requesting phone coverage from Hermes — tracked in `context/DATA.md` §5, not built
  here.

## Data

| Column | Table | Type | Populated (2026-08-17) | Notes |
|---|---|---|---|---|
| `email_verified` | contacts | boolean | 34 verified / 182 | Already typed |
| `role_fit` | contacts | text | across the set | **Free text — measure values first** |
| `enrichment_method` | contacts | text | across the set | Provenance |
| `note` | contacts | text | partial | Inline |
| `email` | contacts | text | 120 / 182 | 62 contacts unreachable by email |
| `phone` | contacts | text | 1 / 182 | Render only when present |

## Empty and degraded states

| Case | Behaviour |
|---|---|
| Unverified email | Shown, marked as unverified. Not hidden — an unverified email is still the best channel available for most contacts. |
| No email at all (62 of 182) | Contact still listed, sorted below those with one, with an explicit "no email" state. Never a blank where an address would be. |
| No phone (181 of 182) | No phone row at all. No empty labelled field. |
| `role_fit` absent or an unrecognised value | No chip rather than an "unknown" chip. Sorts below known values. Do not crash on an unexpected string. |
| `note` absent | Nothing rendered. |
| Lead with zero contacts | Explicit empty state naming what is missing. 6 of 104 leads have no contact at all. |

## Design notes

- Chips follow existing `Badge` / `StatusChip` patterns in `src/components/ui/`.
  Extend, do not invent a parallel system.
- **Verified vs unverified must not rest on colour** — the ramp is a single hue.
  Word or icon plus tint.
- Attio/Linear density applies here: this is a list, so it stays tight.
- Provenance (`enrichment_method`) is the quietest thing on the row. It answers "where
  did this come from" when asked, and otherwise stays out of the way.
- Tokens only.

## Acceptance

- [ ] `role_fit` values measured and recorded in `context/DATA.md` before the UI was
      designed.
- [ ] The contact list is ordered by the documented comparator; the top contact is the
      most callable.
- [ ] Verified emails are distinguishable without relying on colour.
- [ ] Role fit, provenance and `note` are visible where present.
- [ ] Phone never renders as an empty labelled field.
- [ ] Every row of the empty-state table is reachable in mock mode.
- [ ] An unexpected `role_fit` string does not break the list.
- [ ] `npm run build` passes.
- [ ] `routines/REVIEW.md` passes.
- [ ] Fixtures cover all cases. No new names invented.
- [ ] `context/DESIGN.md` regenerated; `context/DATA.md` §3 rows updated;
      `context/ROADMAP.md` N5 moved out of Now.

## Risks

- `role_fit` is free text from an upstream generator. Values may be inconsistent in
  case or wording. Normalise defensively at the comparator, and never let an
  unrecognised value throw.
- Reordering the contact list changes what a rep sees first on a surface they use
  daily. It is the point of the change, but call it out in the handback.
- Blast radius is limited to `/leads/[id]` and the contact query. Low.

## Open questions

None blocking. If `role_fit` turns out to have no usable value distribution, stop and
report — the ranking would then be an upstream request rather than a UI change.
