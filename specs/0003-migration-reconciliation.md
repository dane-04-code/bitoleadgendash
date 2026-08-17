# 0003 — Reconcile `supabase/migrations/` with production

**Status:** ready
**Roadmap:** N3
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against live DB:** 2026-08-17

## Problem

The repo cannot be used to reason about the schema. Files `0001`–`0013` exist in
`supabase/migrations/` but are not registered remotely — they were applied by hand
through the SQL editor, or never applied at all, and there is no way to tell which
from the repo. Meanwhile six columns that *are* live were never described by any
migration file, because upstream created them.

So a developer or agent reading `supabase/migrations/` gets a confidently wrong
picture in both directions: files that may never have run, and live columns that
appear nowhere.

## Evidence

`supabase_migrations.schema_migrations` contains exactly **three** rows
(measured 2026-08-17):

- `20260813120634_lead_status_quote_rename`
- `20260813134149_score_breakdown`
- `20260815215259_enable_rls_deny_anon`

Live columns with no migration file describing them: `leads.why_is_this_a_lead`,
`leads.signal_date`, `leads.signal_url`, `leads.contacts_count`,
`leads.last_contacts_attempt`, and the `assignment_pings` table in full.

The base `leads` / `contacts` / `reps` schema predates the repo's migrations entirely
and lives only in the live project.

## Decision

Reconcile by **recording reality, not by re-running history.** Nothing is applied to
production. The output is a repo that describes the live schema accurately, and a
migrations directory whose contents can be trusted.

Three parts:

1. **A baseline.** Dump the live schema to `supabase/schema.sql` as a
   point-in-time record, clearly labelled with the date and as non-executable
   reference. This is the honest answer to "what is actually there".
2. **A ledger.** `supabase/migrations/README.md` listing every file `0001`–`0015`
   with a verified verdict: *registered*, *applied by hand (verified present in the
   live schema)*, or *never applied (objects absent)*. Verify each one against
   `information_schema`, column by column — do not guess from the filename.
3. **Descriptive migrations for upstream-created objects**, written but **not
   applied**, so the repo describes the six columns and `assignment_pings`. Each one
   `IF NOT EXISTS`, with a header comment stating it documents an upstream change and
   must not be applied to the live project.

Rejected: registering `0001`–`0013` in `schema_migrations` to make the history look
clean. That is a production write that falsifies the record — some of those files may
never have run, and claiming they did is worse than admitting the gap.

## Scope

### In

- `supabase/schema.sql` — dated baseline dump, marked reference-only.
- `supabase/migrations/README.md` — the ledger, one verified verdict per file.
- Descriptive, unapplied migrations for: `leads.why_is_this_a_lead`,
  `leads.signal_date`, `leads.signal_url`, `leads.contacts_count`,
  `leads.last_contacts_attempt`, and `assignment_pings`.
- Verification pass: for every file `0001`–`0013`, confirm object by object whether
  its objects exist live. Record the result.
- Update `context/DATA.md` §4 with the finding, and `CLAUDE.md` to point at the
  ledger.

### Out

- **Applying anything to production.** Zero DDL. Not one statement.
- Registering rows in `schema_migrations`.
- Deleting or renumbering existing migration files — history stays legible.
- Adopting the Supabase CLI migration workflow going forward. Worth considering, but
  it is a process decision for Dane, not a side effect of this cleanup.
- Anything about `assignment_pings` beyond describing it. This repo does not adopt it
  (`context/DECISIONS.md`, 2026-08-17).

## Data

Read-only. Uses `information_schema` and `pg_tables`.

| Object | State | Action |
|---|---|---|
| `leads.why_is_this_a_lead` | live, undescribed | descriptive migration |
| `leads.signal_date` | live, undescribed | descriptive migration |
| `leads.signal_url` | live, undescribed | descriptive migration |
| `leads.contacts_count` | live, undescribed | descriptive migration |
| `leads.last_contacts_attempt` | live, undescribed | descriptive migration |
| `assignment_pings` | live, undescribed, 0 rows | descriptive migration |
| `0001`–`0013` | unknown | verify each, record verdict |

## Empty and degraded states

Not user-facing. The ledger must be explicit where the answer is genuinely unknown —
"objects present, but cannot confirm this file is what created them" is a legitimate
and useful verdict. Do not round it up to "applied".

## Design notes

None.

## Acceptance

- [ ] `supabase/schema.sql` exists, dated, marked reference-only.
- [ ] `supabase/migrations/README.md` gives a verified verdict for every file
      `0001`–`0015`.
- [ ] Descriptive migrations exist for all six undescribed objects, each `IF NOT
      EXISTS` and each carrying the do-not-apply header.
- [ ] `schema_migrations` still contains exactly three rows — proof nothing was
      applied.
- [ ] `npm run build` passes.
- [ ] `context/DATA.md` §4 rewritten to describe the reconciled state.
- [ ] `context/ROADMAP.md` N3 moved out of Now.

## Risks

- **The main risk is an agent "helpfully" applying a migration.** Every generated
  file must carry the do-not-apply header in its first line, and the reviewer must
  confirm `schema_migrations` still has three rows.
- Verification is tedious and easy to fake. A verdict without an
  `information_schema` result behind it is worthless — the ledger should cite what it
  checked.

## Open questions

Should this repo adopt the Supabase CLI migration workflow going forward, given that
upstream will keep changing the schema without commits here? **Needs Dane.** Not
blocking: the reconciliation is worth doing either way, and `specs/0002`'s drift
check is the mechanism that actually catches future changes.
