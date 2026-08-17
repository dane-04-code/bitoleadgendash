# Roadmap

The plan of record. Supersedes `V2_PLAN.md`, which is retained unedited at
`context/archive/V2_PLAN.md` for history.

Written 2026-08-17, grounded in a direct measurement of the live database taken
the same morning (`context/DATA.md`).

**How to read this file.** Three horizons. **Now** is committed and an agent may
pick from it without asking. **Next** is agreed in direction but each item still
needs a spec and, where marked, a decision from Dane. **Later** is a horizon, not
a commitment — items there are *my proposal from the evidence*, explicitly marked
as such, and none of them are approved. **Out of scope** is the most important
section: it is what stops scope creep in an autonomous workflow.

---

## 0. Where the project is going

**BITO only. Single-tenant. Deepen, do not broaden.** Decided by Dane
2026-08-17.

One company, two roles, one sales team — made excellent. The ambition is depth of
judgement support for the admin and certainty of next action for the rep, not
breadth of surface. Concretely this means: no multi-tenancy, no white-labelling,
no productisation for other companies, no auth rebuild chasing enterprise
features, and no absorption of Hermes' pipeline surface into this console. Those
are not "later" — they are out of scope, permanently, until Dane says otherwise.

The measure of success is unchanged from `PRODUCT.md`: **no qualified lead sits
unactioned, every rep knows what to work next, and the manager can see win/loss
reality at a glance.** On today's numbers the product fails the first of those —
23 open assigned leads are 21+ days untouched and nothing in the UI says so — and
cannot yet do the third, because `deal_profiles` and `deal_sales` are empty.

## 1. What matters, in order

The ranking that should settle any argument about what to do next:

1. **Do not lose or corrupt the sales team's data.** Nine unguarded server actions
   currently let any authenticated rep delete reps and take over accounts. Nothing
   else matters more.
2. **Tell the truth about the data.** A field that renders blank because production
   is `NULL`, or a type that lies about the schema, costs more than the feature was
   worth. Verification before surface.
3. **Surface the intelligence Hermes already produces.** The single largest gap
   between what the company pays for upstream and what a human sees. `why_is_this_a_lead`,
   contact quality, `contacts_count`, `signal_date` — all live, all unread.
4. **Enforce "nothing falls through."** Staleness, do-not-contact, returned leads.
   The product's stated principle, currently unmet.
5. **Cut time-to-decision.** Triage from the row, keyboard paths, mobile parity.
6. **Close the loop on outcomes.** Deal profile and sale records are the only way
   the manager ever sees win/loss reality. Both tables are empty; find out whether
   that is a UX failure or simply that no deal has closed yet.

## 2. Now — committed

An agent may pick any of these up. Each has a spec. Ordered.

| # | Item | Spec | Why now |
|---|---|---|---|
| N1 | **Guard every server action.** Session + role + ownership on all 23; nine currently have none. | `specs/0001-server-action-authorization.md` | Live privilege escalation: any rep can call `setRepPassword` on any other rep. Blocks nothing, blocked by nothing, and cannot wait. |
| N2 | **Generated types + a drift check that fails the build.** Replace hand-maintained `types.ts`. | `specs/0002-generated-types-and-drift-check.md` | Five live `leads` columns are missing from the types, and the count grew between two audits four days apart. Every item below pays a tax until this lands. |
| N3 | **Reconcile `supabase/migrations/` with production.** Register what ran; write the missing migrations so the repo describes reality. | `specs/0003-migration-reconciliation.md` | `0001`–`0013` are invisible remotely. Without this, nobody can reason about the schema from the repo. |
| N4 | **`why_is_this_a_lead` becomes the lead's headline.** Top of `/leads/[id]`, two-line clamp in the inbox row. Retires `score_reason` and `signal_summary` from the UI. | `specs/0004-lead-narrative-headline.md` | The highest-value user-visible work available. Decided 2026-08-17: the narrative replaces both older fields. Needs a real fallback — only 16 of 104 leads have it, while the two it replaces are on all 104. |
| N5 | **Contact quality made visible.** Rank by `role_fit`, mark verified emails, show provenance and `note`. | `specs/0005-contact-quality.md` | 182 contacts carry this evidence and a rep sees none of it. Turns "read every row" into "call this one." |
| N6 | **Honour `do_not_contact`.** 23 flagged leads are currently served as workable, with zero references to the flag in `src/`. | `specs/0006-do-not-contact.md` | Correctness and conduct. Found 2026-08-17. Small change, unacceptable to leave. |
| N7 | **Staleness surfaced — the "going cold" view.** Age / last-touch column in the inbox, a going-cold view for the admin, the same signal on the rep's board. | `specs/0007-staleness.md` | 23 open assigned leads are 21+ days untouched. The board can filter time-in-stage, which is a different clock. **Carries an open decision — see §5 D1.** |

N1 and N2 are independent and can run in parallel. N4–N7 all get cheaper after
N2; do not start them before it unless N2 is blocked.

## 3. Next — agreed direction, needs a spec

Not yet specced. Do not start these without writing the spec first, and where
marked, without the decision.

| # | Item | Note |
|---|---|---|
| X1 | **Triage in one keystroke.** Assign / list / kill from the inbox row and from the command palette, without opening the lead. | `src/components/command-palette.tsx` exists but is navigation and search only — it performs no actions. Judgement speed over data entry. |
| X2 | **Graceful degradation pass across every v2 field.** Designed empty states, not blanks. | Coverage will stay partial: 16/104 narratives, 34/182 verified emails, 1/182 phones. Should be folded into N4–N7 as they ship rather than deferred into a cleanup task. |
| X3 | **Mobile parity audit.** `/dashboard`, `/leads/[id]`, `/my` at small widths. | Stated commitment in `PRODUCT.md`; both roles work away from a desk. Dense tables and a nine-column kanban are where this breaks. |
| X4 | **In-app assignment awareness on `/my`.** A rep should see that something new landed without being told. | Constrained by the 2026-08-17 decision that **upstream owns email sending**. So: in-app only — no email, no provider, no new secret. |
| X5 | **New v2 components extend `DESIGN.md`.** Narrative/evidence block, contact-quality chip set, staleness indicator. | None exist yet. Regenerate `DESIGN.md` and its `.impeccable` sidecar in the same change that ships them. |
| X6 | **Find out why `deal_profiles` and `deal_sales` are empty.** | 0 rows each. Either no deal has closed, or the closing flow is too heavy to use. The manager cannot see win/loss reality either way, and item 6 of §1 depends on the answer. Investigate before building. |

## 4. Later — horizon, not committed

**Everything in this section is my proposal from the evidence, not a decision.**
None of it is approved. An agent must not start any of it. Listed so the direction
is legible and so these do not get re-derived from scratch every time.

| Proposal | Rationale | Cost / risk |
|---|---|---|
| **Per-user admin identity for the Dean handover.** | Admin is one shared password today, and notes/reviews are stamped `"Admin"`. When Dane hands over to Dean, there is no way to tell who did what. | Touches auth, which is the highest-risk area in the codebase. Would not adopt Supabase Auth wholesale — likely just named admin accounts in a table, same PBKDF2 shape as reps. |
| **A last-touch clock this app owns.** | `last_contacted_at` is live, typed, and `NULL` on all 104 rows. `updated_at` is a poor proxy because upstream enrichment bumps it. | Needs a decision on who writes it (§5 D1) and a backfill story. |
| **Split `actions.ts` and `queries.ts`.** | ~930 and ~1000 lines; every feature touches both. | Pure churn with no user-visible gain, and a large diff over files with no test coverage. Only worth doing alongside a feature that already touches most of them. |
| **A minimal test suite around the authorization layer.** | There is no test suite at all, and the one thing that has now failed twice is action guarding. | Would need a testing setup from zero. Argument for it is strongest if N1's fix is expected to regress. |
| **Show when leads vanish underneath us.** | Ten archived leads were hard-deleted upstream between 2026-08-13 and 2026-08-17. The dashboard says nothing. | May be normal housekeeping — needs the upstream answer first (§5 D4). Low value if it is expected. |
| **Kanban decomposition.** | One 25k component carrying drag-and-drop, filters and nine columns; highest blast radius in the repo. | Same objection as the file split, plus drag-and-drop is easy to break invisibly. |

## 5. Open decisions blocking work

Each of these blocks something concrete. An agent that hits one should do the
preparatory work, then stop and state the decision needed.

| # | Decision | Blocks | Status |
|---|---|---|---|
| D1 | **Who writes the last-touch clock?** Build staleness on `updated_at` (proxy — upstream enrichment bumps it, so a lead can look "touched" when no human has), or have this app start writing `last_contacted_at` on the actions that represent human contact? | N7, and the "going cold" view's honesty | **Open — needs Dane.** My recommendation: this app writes `last_contacted_at`, because only this app knows when a human acted. Ship N7 on `updated_at` first if a decision is slow, and label the column honestly as "last activity", not "last contacted". |
| D2 | **When do we rotate the anon key?** | Nothing — hygiene | **Open — needs Dane.** It has been in browsers and no longer grants data access. |
| D3 | **`why_is_this_a_lead` coverage.** Will Hermes extend it past 16 of 104, and does it supersede `score_reason` / `signal_summary` upstream too, or only in the UI? | N4's fallback design, and whether the fallback is permanent | **Upstream request open.** The UI decision is made (narrative replaces both); what is unknown is whether the old fields keep being populated. |
| D4 | **Are upstream hard-deletes expected housekeeping?** | The "show when leads vanish" proposal in §4 | **Open — needs whoever runs Hermes.** |
| D5 | **Will Hermes populate `score_breakdown`?** | An already-shipped, permanently dark feature. If the answer is no, the rubric should come out of the UI rather than sit empty forever. | **Upstream request open.** Spec for the writer is in `specs/0004` §Appendix. |

Closed on 2026-08-17, recorded in `DECISIONS.md`: the narrative field replaces
`score_reason` and `signal_summary` in the UI; phone sourcing is an upstream
request and phone stays in the UI; upstream owns assignment notification sending;
the project stays single-tenant BITO-only. Also closed: lead ingestion is **not**
paused — the newest lead was created 2026-08-17 04:28 UTC.

## 6. Out of scope — permanently

Not "later". Not up for rediscovery by an agent looking for something useful to
do. Changing any of these requires Dane, explicitly.

**Product scope**

- **This repo never discovers, enriches, or scores leads.** That is Hermes. No
  scraping, no enrichment calls, no scoring logic, no writing `score_breakdown`.
- **Not a general CRM.** No contact management from scratch, no arbitrary custom
  fields, no deal pipelines beyond the nine defined stages, no marketing
  automation.
- **No multi-tenancy, no white-labelling, no productisation beyond BITO.**
- **No absorption of Hermes' surface.** No triggering discovery runs, no tuning
  scoring weights, no agent-output review console.
- **No email sending from this app.** Only `mailto:` links and drafted copy a
  human sends. Upstream owns notification sending (decided 2026-08-17). This
  means no email provider, no deliverability work, no new secret.
- **`assignment_pings` is not adopted by this repo.** Same decision.
- **No removing a capability to simplify.** The feature set is in daily use.

**Technical scope**

- **No client-side data access.** Zero callers on `getSupabaseBrowserClient`,
  forever. The service-role key never reaches the browser.
- **No production DDL without explicit approval**, even additive columns.
- **No reopening the visual system.** BITO teal and white, Barlow, rounded
  corners, orange for tiny accents only, no logo. Convention is the commitment:
  Attio/Linear density for tables and lists, roomier kanban cards. Execute the
  category standard at full fidelity; do not smuggle in quirk.
- **No framework or state-management migration.** Next.js 14 App Router, server
  components, server actions, Tailwind, Supabase. No client-side data library.
- **No auth rebuild** beyond what §4's per-user-admin proposal describes, and not
  without approval.
- **No fabricated content.** No customer names beyond the mock set, no win rates,
  no revenue figures, no claims about upstream capability.

## 7. Keeping this file honest

`ROADMAP.md` and `DATA.md` are the two files that go stale fastest and cost the
most when they do.

- Shipping a Now item: move it out, note the date, and re-check whether it
  unblocked anything in Next.
- Discovering drift or a new empty column: `DATA.md`, in the same change.
- Getting an answer to a §5 decision: record it in `DECISIONS.md` with the date,
  and update the blocked item.
- Re-measuring the database: overwrite `DATA.md` §1 with the new figures and the
  new timestamp. Do not append — a table of historical measurements is how this
  file became hard to read before.
