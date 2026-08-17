# 0006 — Honour `do_not_contact`

**Status:** ready
**Roadmap:** N6
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against live DB:** 2026-08-17

## Problem

Twenty-three leads in production are flagged `do_not_contact`. The dashboard ignores
the flag completely, serves those leads as ordinary workable leads, and will happily
let an admin assign one to a rep and a rep call it.

The column is live **and typed in `types.ts`**, and has zero references anywhere in
`src/` outside the type definition. Nobody decided to ignore it; it was never wired.

This is a conduct and correctness failure, not a missing feature. A rep contacting a
company that asked not to be contacted is a real-world consequence with the sales
team's name on it, not a rendering bug.

## Evidence

Measured 2026-08-17 against `epyumxjezftahosvegmn`:

- `select count(*) from leads where do_not_contact` → **23** (of 104).
- `grep -rn "do_not_contact" src/` → one hit, the type declaration in
  `src/lib/supabase/types.ts` line 138.
- No query filters on it; no page renders it; no action checks it. It appears in
  neither the inbox tabs, the kanban, the marketplace, nor `/leads/[id]`.

Who sets the flag is not established in this repo — it is upstream output, like the
rest of the lead record. Twenty-three of 104 is too high a proportion to be
accidental.

## Decision

Make the flag visible and make acting on it deliberate. **Do not silently hide the
23 leads** — hiding data the admin has been working with, with no explanation, is its
own failure and would look like leads vanishing.

- **`/leads/[id]`** — a prominent do-not-contact banner at the top of the page, above
  the narrative block. It is the first thing a rep sees.
- **Inbox row and kanban card** — a do-not-contact marker with a word, not a tint
  alone.
- **Outreach and contact actions** — where the UI offers a `mailto:` handoff or
  presents drafted outreach copy for a flagged lead, it warns before handing off. The
  human can still proceed; the product does not pretend to be a compliance system it
  is not. But it never hands over a draft silently.
- **Assignment** — `assignLeadToRep` and `listLead` warn on a flagged lead and require
  the admin to confirm. Assigning a do-not-contact lead to a rep is the moment the
  mistake becomes someone else's problem.
- **Filter** — a filter on the inbox so the admin can see the 23 as a set and deal
  with them, and exclude them from a working view when they choose to.

Rejected: hard-blocking contact on flagged leads. The flag's provenance is upstream
and unverified; a hard block on data this repo does not own could strand a legitimate
lead with no override. Warn loudly, let the human decide — consistent with "the machine
proposes, the human disposes."

## Scope

### In

- Include `do_not_contact` in the relevant reads: inbox list, kanban cards, lead
  detail, marketplace.
- Banner component on `/leads/[id]`. Extends `context/DESIGN.md`.
- Marker on the inbox row and the kanban card.
- Confirmation on assign and on list-to-marketplace for a flagged lead.
- Warning before a `mailto:` handoff or presenting outreach copy on a flagged lead.
- Inbox filter for do-not-contact.
- Fixtures: at least two flagged leads, at least one of them assigned, so every path
  is reachable in mock mode.
- Regenerate `context/DESIGN.md`; update `context/DATA.md` §3.

### Out

- Setting or clearing the flag from this app. It is upstream data; this repo does not
  own it. If the admin needs to set it, that is a separate decision and a separate
  spec.
- Hard-blocking any action.
- Anything about `archived` / `killed`, which are separate mechanisms.
- Auditing who contacted a flagged lead. Would need per-user identity, which does not
  exist — see `context/ROADMAP.md` §4.

## Data

| Column | Table | Type | Populated (2026-08-17) | Notes |
|---|---|---|---|---|
| `do_not_contact` | leads | boolean | **23 flagged** / 104 | Live, typed, zero UI references. Upstream-set; provenance unknown. |

No schema change. No DDL.

## Empty and degraded states

- `false` or `null` — nothing renders. No "safe to contact" badge; the absence of a
  warning is the signal, and a positive badge on 81 leads would be noise.
- A flagged lead that is already assigned — the banner shows on the rep's view too,
  not only the admin's. The rep is the one about to make the call.
- A flagged lead in the marketplace — marker on the card before a rep claims it.

## Design notes

- The banner is the one place in this product where a **warning** register is
  appropriate. Semantic warning colour is available (`#cf9a3a`) and is UX convention,
  not brand — but the word "Do not contact" carries the meaning, and colour only
  reinforces it. Status is never conveyed by colour alone.
- Orange `#e06c00` is for tiny accents only and is **not** a banner surface. Do not
  reach for it here.
- On the kanban card and inbox row, space is tight: a short marker plus icon, legible
  at small widths, no layout shift for the 81 unflagged leads.
- Confirmation dialogs use the existing `Dialog` primitive.

## Acceptance

- [ ] All 23 flagged leads show the banner on `/leads/[id]`, for both roles.
- [ ] The marker appears on the inbox row, the kanban card, and the marketplace card.
- [ ] Assigning or listing a flagged lead requires explicit confirmation.
- [ ] A `mailto:` handoff or outreach draft on a flagged lead warns first.
- [ ] The inbox filter isolates and excludes flagged leads.
- [ ] No layout shift on unflagged leads.
- [ ] Meaning does not rest on colour alone anywhere in the change.
- [ ] `npm run build` passes.
- [ ] `routines/REVIEW.md` passes.
- [ ] Fixtures include ≥2 flagged leads, ≥1 assigned.
- [ ] `context/DESIGN.md` regenerated; `context/DATA.md` §3 updated;
      `context/ROADMAP.md` N6 moved out of Now.

## Risks

- Touches the inbox row, the kanban card and the marketplace card — three dense
  surfaces at once. Keep the marker small and check small widths.
- Adding a confirmation step to assignment slows the admin's most common action. It
  must fire **only** for flagged leads; a confirmation on all 104 would be a real
  regression in judgement speed.
- The kanban card path means touching `kanban-board.tsx` (25k, drag-and-drop). Keep
  the change additive.

## Open questions

Who sets `do_not_contact` upstream, and on what basis? Worth asking whoever runs
Hermes — 23 of 104 is high enough that the answer might change how prominent the
warning should be. **Not blocking:** honouring the flag is right regardless of its
provenance.
