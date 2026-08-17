# BITO LeadIntelligence — v2 Plan

Status: **accepted, in progress** · Written 2026-08-13 · Last verified against
live Supabase project `BITOLEADGEN` (`epyumxjezftahosvegmn`) and the repo on
**2026-08-17**.

---

## 0. Status at a glance — 2026-08-17

| Workstream | State |
|---|---|
| **UI overhaul** (pre-v2) | **Shipped.** PR #1 merged to `main` 2026-08-16. The console is rebuilt on the Claude Design comps; `DESIGN.md` was regenerated from the shipped build and is authoritative again. |
| **§6 Security / RLS** | **Done.** RLS deny-by-default on all 13 tables, migration `0015` applied 2026-08-15. App runs on `SUPABASE_SERVICE_ROLE_KEY`. One item left: **rotate the anon key** (hygiene). |
| **A — Truth & correctness** | A1 half done (column live, still `NULL` everywhere, no writer). **A2 and A3 not started.** A4 done. |
| **B — Surface v2 intelligence** | **Not started.** `why_is_this_a_lead` has zero references in `src/`; contact-quality fields are typed but rendered nowhere. |
| **C — Experience** | **Partial.** Board filters shipped (rep, region, score, time-in-stage, "New this week"), and the rep board got them too. C9's dedicated staleness view, C10 triage-from-the-row, C11 mobile audit and C12 notifications are all open. |
| **D — Visual pass** | Largely overtaken by the UI overhaul; re-scope against what actually shipped before doing more. |

Unmerged work: branch `pipeline-new-this-week` is **2 commits ahead of `main`**
("New this week" pipeline filter; the same filters on `/my`). Both build clean;
neither has been reviewed in a browser.

## 1. Where we actually are

Lead discovery is validated. The upstream agents have moved to v2 and are
writing richer records than the dashboard knows how to read. This repo is still
the v1 frontend on that axis — no v2 field is rendered anywhere.

Live numbers, measured **2026-08-17** (2026-08-13 figures in brackets where they
moved):

| | |
|---|---|
| Leads | 101 *(was 110)* — oldest 2026-05-07, newest **2026-08-13**, 1 in the last 7 days |
| Leads with at least one contact | 95 / 101 *(was 110/110)* |
| Contacts | 174 *(183)* · 112 with an email |
| Contacts with a verified email | 34 *(36)* |
| **Contacts with a phone number** | **1** — unchanged |
| Leads with `why_is_this_a_lead` | 14 — unchanged, still the 2026-08-13 cohort |
| Leads with `score_breakdown` | **0** — column now exists, populated on nothing |
| Outreach drafts | 257 *(275)* |
| Reps | 10 · 61 assignments |
| Open leads scoring 80+ | 20 *(21)* |
| Archived | 27 *(37)* |
| `assignment_pings` rows | 0 — unchanged |
| Open assigned leads untouched 21+ days | **27** *(was 17)* |

Read this table for three things.

**Staleness is getting worse, not better.** 27 open assigned leads are now 21+
days untouched, up from 17. The product principle "nothing falls through" is
failing harder in production than when the plan was written, and the UI is still
silent about it. This is the strongest argument for C9.

**Lead ingestion has paused; enrichment has not.** No lead has been *created*
since 2026-08-13, but `contacts`, `outreach` and `leads.updated_at` all show
writes on 2026-08-16 — so Hermes is alive and writing through the service-role
key, and the RLS lockout did not break it. The pause is upstream discovery, not
a permissions failure. Worth an explicit check with whoever runs Hermes.

**Rows were deleted upstream.** Leads 110 → 101 and archived 37 → 27 — ten
archived leads are simply gone, along with 9 contacts and 18 outreach drafts.
Nothing in this repo hard-deletes leads (archiving is a flag), so this happened
upstream. Not alarming, but it confirms the standing rule: this repo does not
own the data.

## 2. Schema drift — live vs. this repo

*Re-verified against production 2026-08-17.*

The remote `supabase_migrations` table now records **three** migrations —
`20260813120634_lead_status_quote_rename`, `20260813134149_score_breakdown`,
`20260815215259_enable_rls_deny_anon`. Files `0001`–`0013` were applied by hand
or not at all, and are still unregistered. Because nearly every query in
`src/lib/queries.ts` uses `select("*")`, a missing column arrives as `undefined`
rather than an error — drift fails silently.

| Drift | Direction | Impact |
|---|---|---|
| ~~`leads.score_breakdown`~~ | **column live, feature still dark** | Migration `0010` had never been applied; applied 2026-08-13 and registered. Still `NULL` on all 101 production leads — **and on all 8 mock leads**, so the rubric has never rendered for anyone, in any environment, since it was built. Nothing in this repo writes it; it is an upstream field. See §4 A1 for the writer spec the agents need. |
| `leads.why_is_this_a_lead` | **in production, absent from repo** | The agents' flagship v2 field. Sourced narrative — named company, dated event, contract value, facility size. Confirmed 2026-08-17: **zero occurrences in `src/`** — not typed, not queried, not rendered. |
| `leads.signal_date` · `signal_url` · `contacts_count` · `last_contacts_attempt` | **in production, absent from `types.ts`** | Found 2026-08-17. Four more columns the `Lead` type does not know about. `contacts_count` and `signal_date` in particular are directly useful for triage and staleness. Nothing reads them. |
| `contacts.email_verified` · `role_fit` · `enrichment_method` · `note` | in production **and** typed in `types.ts` | Types know them; only `mock-data.ts` and `types.ts` reference them. No UI surface. Contact-quality evidence going to waste. |
| `outreach.used` | **confirmed present 2026-08-17** | Flagged unverified when `OutreachUsedToggle` shipped (commit `bb89ff5`) because the Supabase tools were unavailable. The column exists, `boolean`. Resolved. |
| `assignment_pings` | **in production, absent from repo** | Assignment-notification send log (recipient, subject, lead count, status, error). Still 0 rows, still unreferenced in this codebase. Suggests upstream intends to notify reps by email. Needs an owner decision. |
| ~~RLS~~ | **resolved 2026-08-15** | Enabled deny-by-default on all 13 tables. See §6. |

The drift table has grown since 2026-08-13, which is exactly the failure mode A2
exists to stop: hand-maintained types will keep falling behind an upstream that
ships DDL without a commit here.

**Fix the direction of truth first.** Before feature work, generate types from
the live database rather than hand-maintaining `types.ts`, and add a check that
fails the build when they diverge. Otherwise v2 accumulates the same drift.

## 3. What v2 is

> The frontend catches up to what the agents now produce, and the working
> experience gets faster on top of it.

Not a rewrite. Not a new aesthetic — the design system was established
2026-08-12 and `PRODUCT.md` records the standing decision that **convention is
the commitment**. v2 extends that system; it does not reopen it.

## 4. Workstreams

### A — Truth and correctness *(do first, blocks everything else)*

1. ~~Apply `0010_score_breakdown` to production.~~ **Done 2026-08-13** (approved
   by Dane). The column is live but `NULL` on every row, so the rubric on
   `/leads/[id]` still renders nothing — `ScoreBreakdown` returns `null` for an
   empty value. **This repo never writes the field; the upstream agents must.**

   Hand the agents this spec. `leads.score_breakdown` is `JSONB`, an array of
   objects, one per criterion:

   ```json
   [
     { "key": "signal_fresh", "label": "Signal freshness (< 30 days)",
       "passed": true,  "note": "Contract awarded 2026-07-29" },
     { "key": "verified_contact", "label": "Verified contact found",
       "passed": false, "note": null }
   ]
   ```

   `key` must be one of the eight in `SCORE_BREAKDOWN_CRITERIA`
   (`src/lib/supabase/types.ts`): `signal_fresh`, `hiring_signal`,
   `expansion_signal`, `industry_match`, `verified_contact`, `gcc_location`,
   `company_scale`, `product_fit`. `passed` is a boolean. `note` is a short
   evidence string or `null`. Omitted keys render as a greyed, unevaluated row,
   so a partial array is safe. Backfilling the 101 existing leads is optional.

   Also populate `score_breakdown` on a few fixtures in `src/lib/mock-data.ts` —
   all 8 are `null`, which is why this went unnoticed through design and review.
2. **NOT STARTED — now the top priority.** Switch `src/lib/supabase/types.ts` to
   generated types + a drift check in CI. Four more untyped columns appeared
   between 2026-08-13 and 2026-08-17 (§2); this is the fix that stops the count
   climbing.
3. **NOT STARTED.** Reconcile `supabase/migrations/` with production: register
   what actually ran (`0001`–`0013` are still invisible remotely), and write the
   missing migrations for `why_is_this_a_lead`, `assignment_pings`,
   `signal_date`, `signal_url`, `contacts_count` and `last_contacts_attempt` so
   the repo describes reality.
4. ~~Decide on RLS (§6).~~ **DONE 2026-08-15** — deny-by-default, applied.

### B — Surface the v2 intelligence *(the highest-value user-visible work)*

*Status 2026-08-17: none of B5–B8 has been started. This is the largest
untouched block in the plan and, on the numbers in §1, still the highest value
per unit of work.*

5. **`why_is_this_a_lead` becomes the lead's headline.** It is a paragraph of
   sourced reasoning — a named buyer, a dated event, a contract value. Today the
   admin triages from a score and a one-line summary. Give this field the top of
   `/leads/[id]` and a two-line clamp in the inbox row. This is the single
   biggest triage-speed win available.
6. **Contact quality made visible.** `email_verified`, `role_fit`,
   `enrichment_method`, and `note` already exist on 183 contacts. Rank the
   contact list by role fit, mark verified emails, show provenance. A rep should
   see who to call first without reading every row.
7. **Own the phone gap.** 1 contact in 183 has a phone number. Either the UI
   stops implying phone is a channel, or phone sourcing becomes an upstream
   request. Do not leave an empty field pretending to be a capability.
8. Graceful degradation everywhere: 14 of 101 leads have `why_is_this_a_lead`,
   34 of 174 contacts have a verified email. Every v2 field needs a designed
   empty state, not a blank.

### C — Experience *(the "nothing falls through" principle, enforced)*

*Status 2026-08-17: partially delivered ahead of the sequencing below. The
kanban board gained a filter bar — salesman, region, score, time in stage — and
then a "New this week" toggle, and `/my` was given the same filters minus the
salesman picker. `KanbanLead` now carries both `days_in_stage` and
`days_since_created`, computed server-side. That covers part of C9's raw
material but not its headline: there is still no "going cold" view and no
last-touch column in the inbox.*

9. **Staleness surfaced. STILL OPEN — and worse.** 27 open assigned leads are
   now 21+ days untouched (was 17) and the dashboard is still silent. The board
   can filter on time in stage, which is a different clock from last touch. Add
   an age/last-touch column and a "going cold" view for the admin, plus the same
   signal on a rep's own board. Use an icon plus text — the palette is a single
   hue and status must never rest on colour alone.
10. **Triage in one keystroke. STILL OPEN.** Assign / list / kill from the inbox
    row and from the command palette, without opening the lead. The palette
    (`src/components/command-palette.tsx`) exists but is navigation and search
    only — it routes to leads, reps and pages, and performs no actions.
    Judgement speed over data entry.
11. **Mobile parity is a stated commitment** and both roles work away from a
    desk. Audit `/dashboard`, `/leads/[id]`, and `/my` at small widths — dense
    tables and a nine-column kanban are where this breaks.
12. Rep notification: `assignment_pings` exists but nothing sends. Either wire it
    or drop it. Reps currently learn about an assignment by looking.

### D — Visual pass *(extension, not redesign)*

*Status 2026-08-17: D13 and D14 were overtaken by the UI overhaul (PR #1, merged
2026-08-16), which rebuilt every surface on the comps and regenerated
`DESIGN.md` from the shipped build. Treat them as done unless a specific surface
is found off-system; do not re-plan from the pre-overhaul description below.*

13. ~~Apply the established system to the surfaces added since it was set —
    marketplace, deal profile, feedback, killed inbox.~~ Covered by the overhaul.
14. ~~Density audit against the stated bar.~~ Covered by the overhaul; the bar
    (Attio/Linear for tables and lists, roomier kanban cards) still stands as the
    standing commitment for anything new.
15. **STILL OPEN — blocked on B.** New v2 components needed: a
    narrative/evidence block for `why_is_this_a_lead`, a contact-quality chip
    set, a staleness indicator. None exist. These extend `DESIGN.md`; regenerate
    it and its sidecar once they ship.

## 5. Sequencing

| Phase | Contents | State 2026-08-17 | Rationale |
|---|---|---|---|
| 0 | A1–A4 | A1 half, A4 done, **A2 + A3 open** | Stop shipping against a schema we have not verified. |
| 1 | B5, B6, B8 | **not started** | The agents' v2 output reaches the user. Highest value per unit work. |
| 2 | C9, C10 | open (board filters landed early) | Enforce "nothing falls through" and cut time-to-decision. |
| 3 | B7, C11, C12 | open | Close the phone, mobile, and notification gaps. |
| 4 | D13–D15 | D13/D14 absorbed by the UI overhaul; **D15 open** | Visual consistency once the surfaces have stopped moving. |

**Next up, concretely:** A2 (generated types + drift check), then A3
(migration reconciliation), then B5 (`why_is_this_a_lead` as the lead headline).
A2 first because the drift table grew between two consecutive audits.

## 6. Security — RESOLVED 2026-08-16

> **DONE.** RLS is enabled with deny-by-default on all 13 tables and migration
> `0015` is applied to production. Verified after the fact:
>
> - Acting as `anon`: `leads` 0, `reps` 0, `contacts` 0 — fully denied.
> - Acting as `service_role`: `leads` 101, `reps` 10, `contacts` 172,
>   `outreach` 255 — unaffected. `service_role` has `rolbypassrls = true`;
>   `anon` and `authenticated` do not.
> - `feedback_anon_all` dropped; `update_updated_at` search_path pinned.
> - No data was touched: `leads` last modified 2026-08-13, before this work.
>
> Hermes was migrated to the service-role key first and confirmed live in the
> edge logs (`Python-urllib/3.11` authenticating as `service_role`,
> 2026-08-15 21:32:51) before anything was applied. It has no direct Postgres
> connection, so the REST path was the whole surface.
>
> **Still outstanding: rotate the anon key** — see step 6 below. It no longer
> grants data access, so this is now hygiene rather than urgency.
>
> **Re-verified 2026-08-17.** All 13 public tables have `rowsecurity = true` and
> **zero policies** — deny-by-default is intact and nothing has re-opened a
> table since. The Supabase security advisor now returns only 13 INFO-level
> `rls_enabled_no_policy` notices, which is the intended end state, not a
> finding: with the app on the service-role key there is no role that should be
> granted a policy. No ERROR or WARN advisories remain.
>
> **Upstream survived it.** `contacts`, `outreach` and `leads.updated_at` all
> show writes on 2026-08-16, after the lockout. Hermes is reading and writing
> through the service-role key. The lack of *new* leads since 2026-08-13 is a
> discovery pause upstream, not an RLS failure — but confirm that with whoever
> runs Hermes rather than assuming it.

### Original analysis (retained for context)

Nine tables have **RLS disabled** and the app connects with the **anon key**:
`leads`, `contacts`, `reps`, `assignments`, `outreach`, `pipeline_updates`,
`call_briefs`, `lead_notes`, `lead_reviews`. Anyone holding the anon key — which
ships to the browser — can read or modify every row, including the `reps` table
holding password hashes. All authorization currently lives in application code.

Three further advisories: `assignment_pings`, `deal_profiles`, and `deal_sales`
have RLS *enabled with no policies*, and `public.update_updated_at` has a mutable
`search_path`.

**Additional finding (2026-08-15).** `feedback` was listed as safe because RLS is
enabled on it. It is not: it carries a PERMISSIVE policy `feedback_anon_all`
granting `anon` and `authenticated` ALL commands with `USING (true)`, which makes
the RLS decorative. Verified against the live project `epyumxjezftahosvegmn`.
Migration `0015` drops it.

This is a real exposure, not a lint nit. It is also **not safe to auto-fix** —
enabling RLS without policies would block the app entirely.

**Decision (Dane, 2026-08-13): move to a properly secured, RLS-enforced
database.** Order of operations matters, because doing this in the wrong order
takes the app down:

1. **BLOCKED — needs Dane.** Add a `SUPABASE_SERVICE_ROLE_KEY` environment
   variable (local and hosting). Dane must supply this from the Supabase
   dashboard — it is a secret and must never reach `NEXT_PUBLIC_*` or the
   browser.
2. **DONE (2026-08-15).** `src/lib/supabase/server.ts` now prefers
   `SUPABASE_SERVICE_ROLE_KEY`, falling back to the anon key with a console
   warning so nothing breaks before step 1 lands.
3. **DONE (2026-08-15) — audit passed.** `getSupabaseBrowserClient` has zero
   callers anywhere in `src/`. The only client component that imports from
   `@/lib/queries` (`src/components/rep-leads-view.tsx`) uses `import type`,
   which is erased at compile time. All data access is server-side.
4. **WRITTEN, NOT APPLIED** — `supabase/migrations/0015_enable_rls_deny_anon.sql`.
   Enables RLS on the nine tables with no policies at all, which denies `anon`
   by default. The service-role key bypasses RLS, so the app keeps working while
   the anon key stops being able to read anything. **Do not apply before step 1.**
5. **WRITTEN, NOT APPLIED** — same migration drops `feedback_anon_all` and pins
   `search_path` on `public.update_updated_at`. `assignment_pings`,
   `deal_profiles` and `deal_sales` are already deny-by-default; the migration
   asserts it idempotently.
6. **TODO after 4** — rotate the anon key, since the old one has been in
   browsers.

### ⛔ BLOCKER found 2026-08-15: Hermes reads with the anon key

Applying `0015` right now **would break upstream lead ingestion**, not just the
dashboard. Evidence from the project's edge logs for 2026-08-15:

| Source | Detail |
|---|---|
| API key role | `anon` — on **every** one of 400 requests |
| Client | `Python-urllib/3.11` (not this app; Next.js would be node/undici) |
| Network | Hetzner Online GmbH — where Hermes runs, not a browser |
| Paths | `/rest/v1/leads` ×396, plus `contacts` and `outreach` |
| Window | 04:03 to 14:00 the same day — actively running |

So the anon key is not merely "exposed in browsers"; it is the **live production
credential for the upstream pipeline**. Deny-anon-by-default would return empty
result sets to Hermes rather than an error, which is the dangerous failure mode:
silent, not loud.

**Revised order — steps 1-3 stay, then:**

  3a. Move Hermes onto `SUPABASE_SERVICE_ROLE_KEY` (or its own dedicated key) and
      confirm from these same logs that no `anon` traffic remains. This is a
      change in the Hermes codebase, which does not live in this repo.
  3b. Only once anon traffic is zero, apply `0015`.
  3c. Then rotate the anon key — which now also breaks anything still on it, so
      3a must genuinely be complete.

Note the requests are all `GET`. Hermes's *writes* do not appear in the edge
logs, so it likely writes over a direct Postgres connection — that path is
unaffected by RLS if it connects as a superuser role, but it must be confirmed
before 3b, not assumed.

`reps` is the priority table regardless of sequencing — it holds PBKDF2 password
hashes and is currently readable by anyone with the public key.

## 7. Open questions for the operator

*Reviewed 2026-08-17.*

1. ~~Apply migration `0010` to production, or drop the score-breakdown feature?~~
   **Answered 2026-08-13** — applied. Superseded by a new question: **the column
   is still `NULL` on every row.** Will the agents populate it (spec in §4 A1),
   or does the rubric come out of the UI?
2. ~~Which RLS path from §6?~~ **Answered and shipped 2026-08-15.** Residual:
   **when do we rotate the anon key?**
3. **STILL OPEN.** Is phone sourcing coming from upstream, or does the UI drop
   phone as a channel? Unchanged at 1 contact in 174, four days on.
4. **STILL OPEN.** Does the dashboard adopt `assignment_pings` and send rep
   notifications, or is that upstream's job? Still 0 rows.
5. **STILL OPEN — now blocking B5.** Is `why_is_this_a_lead` replacing
   `score_reason` / `signal_summary`, or sitting alongside them? Three
   overlapping justification fields is one too many, and B5 cannot be designed
   without the answer.
6. **NEW.** Lead ingestion has produced nothing since 2026-08-13 while
   enrichment kept running. Is upstream discovery deliberately paused?
7. **NEW.** Ten archived leads were hard-deleted upstream between 2026-08-13 and
   2026-08-17. Is that expected housekeeping, and should this dashboard show
   anything when leads vanish underneath it?
