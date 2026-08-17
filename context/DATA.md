# Data

The database is the source of truth, and this repo does not own it. This file is
the current picture of what is actually in production, what the repo believes,
and where those disagree.

**Measured directly against the live project `BITOLEADGEN`
(`epyumxjezftahosvegmn`) on 2026-08-17 at 09:40 UTC+4.** Any figure here has a
shelf life of days. Re-measure with `routines/VERIFY-SCHEMA.md` before relying on
it.

---

## 1. Live numbers

| | 2026-08-17 (this measurement) | Previous audit (same day, earlier) |
|---|---|---|
| Leads | **104** | 101 |
| Newest lead | **2026-08-17 04:28 UTC** | 2026-08-13 |
| Created in last 7 days | **4** | 1 |
| Archived | **32** | 27 |
| Leads with `why_is_this_a_lead` | **16** | 14 |
| Leads with `score_breakdown` | **0** | 0 |
| Leads with `signal_date` | **91** | not measured |
| Leads with `contacts_count` | **104** | not measured |
| Leads flagged `do_not_contact` | **23** | not measured |
| Leads with `last_contacted_at` | **0** | not measured |
| Contacts | **182** | 174 |
| Contacts with an email | **120** | 112 |
| Contacts with a **verified** email | **34** | 34 |
| Contacts with a phone number | **1** | 1 |
| Outreach drafts | **261** | 257 |
| Reps | 10 | 10 |
| Assignments | 61 | 61 |
| `pipeline_updates` | 141 | — |
| `lead_notes` | 20 | — |
| `lead_reviews` | 17 | — |
| `feedback` | 1 | — |
| `call_briefs` · `deal_profiles` · `deal_sales` · `assignment_pings` | **0 each** | 0 |
| Open assigned leads untouched 21+ days | **23** | 27 |
| Open leads scoring 80+ | **15** | 20 |

### Read four things out of this table

**Ingestion has resumed.** The earlier audit recorded no new lead since
2026-08-13 and treated it as a possible upstream pause. Leads are now 104 with the
newest created **this morning, 2026-08-17 04:28 UTC**, and 4 in the last 7 days.
Hermes discovery is live. The open question about a deliberate pause is closed —
it was a gap, not a stop.

**`score_breakdown` is still populated on nothing.** The column is live, typed,
and read by `/leads/[id]`, and is `NULL` on all 104 production leads *and* all 8
mock fixtures. The rubric has never rendered for anyone in any environment. This
repo does not write it and never will; it is upstream output. Spec for the writer
Hermes needs is in `specs/0004-lead-narrative-headline.md` §Appendix.

**Staleness is real but slightly better.** 23 open assigned leads are 21+ days
untouched, down from 27. Still 23 leads that nobody is going to touch without
being told to, and the UI is still silent about all of them. Measured on
`leads.updated_at`, because —

**`last_contacted_at` exists and is empty.** The column is live *and typed in
`types.ts`*, and is `NULL` on all 104 rows. Nothing writes it: not this repo, not
Hermes. So there is no true last-touch clock. Any staleness feature must be built
on `updated_at` (a proxy — enrichment writes bump it) or this app must start
writing `last_contacted_at` itself. That is an open decision, flagged in
`ROADMAP.md`.

**23 leads are flagged `do_not_contact` and the UI ignores the flag entirely.**
The column is live and typed; it has **zero references anywhere in `src/`** outside
the type definition. Reps can therefore be assigned, and can work, leads marked
do-not-contact. This is a correctness and conduct problem, not a nice-to-have.
Tracked as a Now item in `ROADMAP.md`.

## 2. Tables

Thirteen public tables, **all with `rowsecurity = true` and zero policies**
(re-verified 2026-08-17: `pg_policies` returns 0 rows for schema `public`).

`leads`, `contacts`, `reps`, `assignments`, `outreach`, `pipeline_updates`,
`call_briefs`, `lead_notes`, `lead_reviews`, `feedback`, `deal_profiles`,
`deal_sales`, `assignment_pings`.

Deny-by-default is intact. The Supabase security advisor returns 13 INFO-level
`rls_enabled_no_policy` notices, which is the **intended end state**, not a
finding: with the app on the service-role key there is no role that should be
granted a policy. No ERROR or WARN advisories remain.

### `leads` — live columns (2026-08-17)

`id` uuid · `company_name` text · `signal_type` text · `signal_source` text ·
`signal_summary` text · `location` text · `industry` text · `warehouse_size` text ·
`score` integer · `score_reason` text · `bito_products` array · `source_url` text ·
`status` text · `created_at` timestamptz · `updated_at` timestamptz ·
`signal_date` date · `signal_url` text · `last_contacted_at` timestamptz ·
`do_not_contact` boolean · `last_article_check` timestamptz ·
`last_contacts_attempt` timestamptz · `contacts_count` integer ·
`archived` boolean · `archived_at` timestamptz · `archived_reason` text ·
`why_is_this_a_lead` text · `score_breakdown` jsonb

`status` is plain `text` with **no check constraint and no enum**, defaulting to
`'new'`. The lifecycle is enforced only in application code:

`new → listed → assigned → contacted → meeting → quote → won | dead | returned`

`listed` = published to the internal marketplace. `returned` = a rep handed it
back. Archiving is a flag (`archived`), never a delete — but note rows **do** get
hard-deleted upstream.

### `contacts` — live columns (2026-08-17)

`id` uuid · `lead_id` uuid · `full_name` text · `job_title` text · `email` text ·
`phone` text · `linkedin_url` text · `is_primary` boolean · `created_at` timestamptz ·
`email_verified` boolean · `role_fit` text · `enrichment_method` text · `note` text

## 3. Drift — live vs. this repo

Re-verified 2026-08-17. This table is the reason `select("*")` is dangerous here.

| Field | State | Impact |
|---|---|---|
| `leads.why_is_this_a_lead` | **live, absent from repo entirely** | The agents' flagship v2 field — sourced narrative with a named buyer, dated event, contract value, facility detail. Not typed, not queried, not rendered. 16 of 104 leads. Highest-value gap in the product. |
| `leads.signal_date` | **live, not typed** | 91 of 104 populated. Directly useful for triage freshness. Unread. |
| `leads.signal_url` | **live, not typed** | Unread. |
| `leads.contacts_count` | **live, not typed** | 104 of 104 populated. A free triage signal, unread. |
| `leads.last_contacts_attempt` | **live, not typed** | 67 of 104 populated. Upstream's enrichment-attempt clock, not a human-touch clock. |
| `leads.last_contacted_at` | **live and typed, 0 rows populated, 0 refs in `src/`** | The obvious staleness clock, and nothing writes it. Decision needed. |
| `leads.do_not_contact` | **live and typed, 0 refs in `src/`** | 23 leads flagged; the UI serves them as workable. |
| `leads.last_article_check` | live and typed, unread | Upstream bookkeeping. Probably not the UI's business. |
| `leads.score_breakdown` | **live and read, `NULL` everywhere** | Migration `0010` applied 2026-08-13 and registered. `ScoreBreakdown` returns `null` for an empty value, so the feature is dark in production *and* in mock mode. Needs an upstream writer. |
| `contacts.email_verified` · `role_fit` · `enrichment_method` · `note` | **live and typed, no UI surface** | Contact-quality evidence on 182 contacts going to waste. Only `types.ts` and `mock-data.ts` reference them. |
| `outreach.used` | live, typed, in use | Flagged unverified when `OutreachUsedToggle` shipped (`bb89ff5`); confirmed `boolean` and present. Resolved. |
| `assignment_pings` | **live, absent from repo** | Assignment-notification send log (recipient, subject, lead count, status, error). 0 rows, 0 references. **Decision made 2026-08-17: upstream owns sending.** See `DECISIONS.md`. This repo does not adopt it. |

Five live `leads` columns are missing from `types.ts`. The count grew between two
consecutive audits four days apart, which is the whole argument for
`specs/0002-generated-types-and-drift-check.md`.

## 4. Migrations are not in sync

The remote `supabase_migrations.schema_migrations` table records **three**
migrations, all from this month:

- `20260813120634_lead_status_quote_rename`
- `20260813134149_score_breakdown`
- `20260815215259_enable_rls_deny_anon`

Files `0001`–`0013` in `supabase/migrations/` were applied by hand through the SQL
editor, or never applied at all, and remain unregistered.

**A file existing in `supabase/migrations/` is not evidence that it ran in
production.** Check the live schema. Reconciliation spec:
`specs/0003-migration-reconciliation.md`.

## 5. Upstream boundary

Hermes owns, and this repo must never attempt:

- Lead discovery, enrichment, scoring, and `score_breakdown`.
- Apollo enrichment and phone-number sourcing.
- Contact-quality fields (`email_verified`, `role_fit`, `enrichment_method`).
- `why_is_this_a_lead`.
- Sending assignment notifications (`assignment_pings`) — decided 2026-08-17.
- Hard-deleting rows. Ten archived leads vanished between 2026-08-13 and
  2026-08-17. Nothing in this repo hard-deletes leads.

Hermes authenticates as `service_role` over the REST API (confirmed in the edge
logs 2026-08-15 21:32:51, `Python-urllib/3.11`) and survived the RLS lockout —
`contacts`, `outreach` and `leads` all show writes after it.

**Open upstream requests** — things this product needs that only Hermes can
supply. Tracked here so they are not silently forgotten:

1. Populate `leads.score_breakdown`. Spec in
   `specs/0004-lead-narrative-headline.md` §Appendix. Blocks a shipped-but-dark
   feature.
2. Source phone numbers. 1 in 182 contacts has one. **Decided 2026-08-17: this is
   an upstream request, phone stays in the UI.** Until it lands, the UI must not
   imply phone is a working channel.
3. Extend `why_is_this_a_lead` coverage beyond 16 of 104 leads, and confirm
   whether it is intended to supersede `score_reason` / `signal_summary` (both
   currently 104 of 104 populated).
4. Confirm whether upstream will ever write `last_contacted_at`, or whether this
   app should own it.

## 6. How to verify

Never take this file's word for it if the decision matters. `routines/VERIFY-SCHEMA.md`
has the exact queries and the rule for when to run them.
