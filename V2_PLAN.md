# BITO LeadIntelligence — v2 Plan

Status: **draft for approval** · Written 2026-08-13 · Verified against live
Supabase project `BITOLEADGEN` (`epyumxjezftahosvegmn`) on 2026-08-13.

---

## 1. Where we actually are

Lead discovery is validated. The upstream agents have moved to v2 and are
writing richer records than the dashboard knows how to read. This repo is still
the v1 frontend.

Live numbers, measured 2026-08-13:

| | |
|---|---|
| Leads | 110 (oldest 2026-05-07, newest 2026-08-13, 8 in the last 7 days) |
| Leads with at least one contact | **110 / 110** |
| Contacts | 183, across 104 leads · 120 with an email · 80 with LinkedIn |
| Contacts with a verified email | 36 |
| **Contacts with a phone number** | **1** |
| Leads with `why_is_this_a_lead` | 14 (the newest cohort) |
| Leads with `score_breakdown` | 0 — the column does not exist in production |
| Outreach drafts | 275 |
| Active reps | 9, all holding leads · 65 assignments |
| Open leads scoring 80+ | 21 |
| Archived | 37 |
| Assigned leads untouched 21+ days | **17** |

Two things stand out. **Contact discovery works** — 100% lead coverage, which is
what "the leads can be found" means in the data. And **17 assigned leads have
gone quiet for three weeks**, which is the product principle "nothing falls
through" failing in production. Nothing in the current UI makes that visible.

## 2. Schema drift — live vs. this repo

The remote `supabase_migrations` table records **one** migration
(`20260813120634_lead_status_quote_rename`). Files `0001`–`0013` were applied by
hand or not at all. Because nearly every query in `src/lib/queries.ts` uses
`select("*")`, a missing column arrives as `undefined` rather than an error —
drift fails silently.

| Drift | Direction | Impact |
|---|---|---|
| ~~`leads.score_breakdown`~~ | **column added 2026-08-13, feature still dark** | Migration `0010` had never been applied. Column now live and verified. It is `NULL` on all 110 production leads — **and on all 8 mock leads too**, so the rubric has never rendered for anyone, in any environment, since it was built. Nothing in this repo writes it; it is an upstream field. See §4 A1 for the writer spec the agents need. |
| `leads.why_is_this_a_lead` | **in production, absent from repo** | The agents' flagship v2 field. Sourced narrative — named company, dated event, contract value, facility size. Not typed, not queried, not rendered. |
| `contacts.email_verified` · `role_fit` · `enrichment_method` · `note` | in production **and** typed in `types.ts` | Types know them; the UI does not surface them. Contact-quality evidence going to waste. |
| `assignment_pings` | **in production, absent from repo** | Assignment-notification send log (recipient, subject, lead count, status, error). 0 rows, unreferenced in this codebase. Suggests upstream intends to notify reps by email. Needs an owner decision. |
| RLS | disabled on 9 tables | See §6. |

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
   so a partial array is safe. Backfilling the 110 existing leads is optional.

   Also populate `score_breakdown` on a few fixtures in `src/lib/mock-data.ts` —
   all 8 are `null`, which is why this went unnoticed through design and review.
2. Switch `src/lib/supabase/types.ts` to generated types + a drift check in CI.
3. Reconcile `supabase/migrations/` with production: record what actually ran,
   write the missing migrations for `why_is_this_a_lead` and `assignment_pings`
   so the repo describes reality.
4. Decide on RLS (§6).

### B — Surface the v2 intelligence *(the highest-value user-visible work)*

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
8. Graceful degradation everywhere: 14 of 110 leads have `why_is_this_a_lead`,
   36 of 183 contacts have a verified email. Every v2 field needs a designed
   empty state, not a blank.

### C — Experience *(the "nothing falls through" principle, enforced)*

9. **Staleness surfaced.** 17 assigned leads are 21+ days untouched and the
   dashboard is silent. Add an age/last-touch column and a "going cold" view for
   the admin, plus the same signal on a rep's own board. Use an icon plus text —
   the palette is a single hue and status must never rest on colour alone.
10. **Triage in one keystroke.** Assign / list / kill from the inbox row and from
    the command palette, without opening the lead. Judgement speed over data
    entry.
11. **Mobile parity is a stated commitment** and both roles work away from a
    desk. Audit `/dashboard`, `/leads/[id]`, and `/my` at small widths — dense
    tables and a nine-column kanban are where this breaks.
12. Rep notification: `assignment_pings` exists but nothing sends. Either wire it
    or drop it. Reps currently learn about an assignment by looking.

### D — Visual pass *(extension, not redesign)*

13. Apply the established system to the surfaces added since it was set —
    marketplace, deal profile, feedback, killed inbox.
14. Density audit against the stated bar: Attio/Linear for tables and lists,
    roomier kanban cards sized for comfortable drag targets.
15. New v2 components needed: a narrative/evidence block for
    `why_is_this_a_lead`, a contact-quality chip set, a staleness indicator.
    These extend `DESIGN.md`; regenerate its sidecar once they ship.

## 5. Sequencing

| Phase | Contents | Rationale |
|---|---|---|
| 0 | A1–A4 | Stop shipping against a schema we have not verified. |
| 1 | B5, B6, B8 | The agents' v2 output reaches the user. Highest value per unit work. |
| 2 | C9, C10 | Enforce "nothing falls through" and cut time-to-decision. |
| 3 | B7, C11, C12 | Close the phone, mobile, and notification gaps. |
| 4 | D13–D15 | Visual consistency once the surfaces have stopped moving. |

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

1. Apply migration `0010` to production, or drop the score-breakdown feature?
2. Which RLS path from §6?
3. Is phone sourcing coming from upstream, or does the UI drop phone as a channel?
4. Does the dashboard adopt `assignment_pings` and send rep notifications, or is
   that upstream's job?
5. Is `why_is_this_a_lead` replacing `score_reason` / `signal_summary`, or
   sitting alongside them? Three overlapping justification fields is one too many.
