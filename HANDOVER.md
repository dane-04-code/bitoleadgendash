# Handover — BITO LeadIntelligence

**v1.0.1** · Written 2026-08-16 · All live figures measured against Supabase
project `BITOLEADGEN` (`epyumxjezftahosvegmn`) on **2026-08-16**.

This is the running state-of-play document: what shipped, what the live data
actually looks like, what the upstream pipeline ("Hermes") needs to do, and what
this repo does next. `PRODUCT.md` remains the product contract; `V2_PLAN.md`
remains the plan of record; this file is the current position.

---

## 1. What shipped recently

Two tracks landed between 2026-08-13 and 2026-08-16 and merged to `main` as
**PR #1** (`4a9a6ef`), tagged v1.0.1.

### The UI overhaul (2026-08-13 → 08-14)

The console was rebuilt on the Claude Design comps Dane approved. This replaced
the visual language wholesale — it did not change the feature set.

| Commit | What |
|---|---|
| `58e3d11` | "Proposal" → **"Quote"** in UI copy *and* stored data (migration `0014`); stage counters; deal profile simplified |
| `515a1e7` | Inbox rebuilt on the Lead Inbox comp |
| `67545ae` | Deep-teal rail; board filterable by salesman |
| `4ad3802` | Pipeline rebuilt on the Pipeline comp |
| `b56a2c3` | One score ramp across the whole console |
| `eaf6f04` | Settings redesigned as an environment console |
| `f7ccb0c` | Remaining surfaces converted: lead detail, marketplace, feedback, team, rep profile, my leads, my account |
| `8fb8d92` | Sign-in and sign-up rebuilt on the auth comp, sharing one `AuthShell` |
| `f580bd4` | Rep sign-up now works in mock mode (it previously 500'd on the demo path) |

Four defects were found and fixed while converting (`f7ccb0c`): a mojibake
primary-contact marker (`â—†`) rendering as garbage on every lead with a primary
contact; `ScoreBreakdown` silently swallowing its fallback because an empty array
is truthy; the delete-note control being hover-only and unreachable by keyboard;
and `/reps` showing the wrong rail numeral.

**Design language now in force** (recorded in `DESIGN.md`, regenerated from the
shipped build in `447f464`): BITO teal `#00797f`, Barlow / Barlow Condensed /
IBM Plex Mono, rounded corners on a 5–14px four-step scale, borderless `.panel`
cards, orange `#e06c00` for tiny accents only, no logo ever placed. This
supersedes the earlier Quicksand / square-corner rules — see `PRODUCT.md` §
Brand Commitments for why.

### The security lockout (2026-08-15 → 08-16)

The app used to reach Supabase with the **anon key**, which ships to the browser,
against tables with RLS disabled — including `reps`, which holds PBKDF2 password
hashes. That is closed.

| Commit | What |
|---|---|
| `55e367e` | `server.ts` prefers `SUPABASE_SERVICE_ROLE_KEY`, falls back to anon with a warning so it could deploy before the secret existed. Audit confirmed **all** data access is server-side (`getSupabaseBrowserClient` has zero callers) |
| `afc79b0` | Blocker recorded: edge logs showed Hermes itself reading as `anon` — 400 requests from `Python-urllib/3.11` on a Hetzner address. The anon key was the live *pipeline* credential, not just a browser leak |
| `fb222d6` | Migration **`0015` applied to production**: RLS enabled with no policies (deny-by-default) on all 13 tables; `feedback_anon_all` dropped; `search_path` pinned on `update_updated_at` |

Sequencing mattered and was respected: Hermes was moved onto the service-role key
**first**, confirmed from the edge logs by its real client authenticating as
`service_role` at 2026-08-15 21:32:51 — not by a curl test, since an earlier curl
check passed while the pipeline was still on anon.

Verified after the fact, and re-verified today: **the anon key returns `[]` for
`leads`.** `service_role` holds `rolbypassrls`; `anon` and `authenticated` do
not. No data was affected.

### Two correctness fixes (2026-08-16)

- **`bb89ff5` — wired two actions that had no UI.** `toggleRepActive` and
  `markOutreachUsed` were written, correct, and unreachable: deleting a rep was
  the only way to take them out of rotation, and outreach drafts never showed or
  set `used`. Both were also unguarded — a server action is a live endpoint and
  middleware protects the *page*, not the action — so `toggleRepActive` is now
  admin-only and `markOutreachUsed` requires session + lead ownership.
- **`a0ba67a` — archived leads kept off the pipeline board.** `getPipelineLeads`
  had a mock branch that skipped archived leads and a live branch with no
  archived filter — the only lead query of eleven missing one. Against production
  this put 32 dismissed leads back on the board: "In pipeline" read 76 and New
  read 29 where the Inbox read 1. Invisible in mock mode, where no fixture is
  archived, which is how it survived the redesign.

### The rep inbox restored (2026-08-16, after the v1.0.1 tag)

Reps had one surface for their book of work — the kanban board — and asked for
the list back. It had been there: `c3eab4b` (2026-06-16) added a Board / List
toggle to `/my`, and `aa82dc9` (2026-06-22, the marketplace commit) removed it
in a single line of its message — *"Rep /my is now board-only (dropped the list
toggle)"* — as a side effect of decluttering the manager's inbox. Nobody signed
off on it. The board then survived the UI overhaul unchanged, so the list never
came back with the rest of the console.

`/my` now takes a `view` param: `/my` is the board (unchanged default), and
`/my?view=inbox` is the list. The choice lives in the URL, not in component
state, so a rep who opens a lead and comes back lands on the surface they were
using — `/leads/[id]?from=inbox` sends the rep back-link to `/my?view=inbox`.

The list is not the 2026-06 markup restored. It is rebuilt on the shipped
design language, structured like the manager's Inbox rows — a `.panel`, mono
row numerals, bold record name over a truncated signal line, `ScoreBadge`, the
mono signal-type tag, days-in-stage, and the assignment note the board card
never showed. Below `sm` it falls back to the same card list the manager's
inbox uses, since a seven-column table at 390px is a horizontal-scroll trap and
reps work these on phones.

One addition beyond the original: each row carries a compact `StatusSelector`
(role `rep`, so the options are the five in `REP_SETTABLE_STATUSES`). Without
it the list would be strictly worse than the board at the one thing a rep does
all day, and it opens no new surface — `/my` already reaches `applyLeadStatus`
through the board's drag handler.

`npm run build` passes. Verified by rendering `/my` and `/my?view=inbox` in mock
mode as `layla@bito.ae`: nine leads, nine table rows, nine stage selectors, the
board still the default. **Not visually reviewed in a browser** — no headless
browser is available in this checkout.

---

## 2. Where the live data actually stands

Measured 2026-08-16. **The database is live and moving while you read this** —
during this session a lead moved from `assigned` to `dead`, so treat these as a
snapshot, not a constant.

| | 2026-08-13 | **2026-08-16** |
|---|---|---|
| Leads | 110 | **101** |
| Contacts | 183 | **172** |
| Assignments | 65 | **61** |
| Leads with ≥1 contact | 110 / 110 (100%) | **95 / 101 (94%)** |
| Contacts with a verified email | 36 | 34 |
| **Contacts with a phone number** | 1 | **1** |
| Leads with `why_is_this_a_lead` | 14 | 13 |
| Leads with `score_breakdown` | 0 | **0** |
| Outreach drafts | 275 | 255 |
| Active reps | 9 | 10 |
| Open leads scoring 80+ | 21 | 12 |
| Archived | 37 | 32 |
| Assigned leads untouched 21+ days | 17 | **24** |
| Leads won, ever | — | **0** |
| Newest lead | 2026-08-13 | **2026-08-13** (unchanged) |

Current status spread (101 total):

| Status | Live | Archived |
|---|---|---|
| `new` | 0 | 29 |
| `assigned` | 31 | 2 |
| `contacted` | 10 | 0 |
| `meeting` | 3 | 0 |
| `returned` | 1 | 0 |
| `dead` | 24 | 1 |
| `listed`, `quote`, `won` | 0 | 0 |

### Three things this reveals

**1. Nine leads were hard-deleted upstream.** 110 → 101, with contacts 183 → 172
and assignments 65 → 61, and **zero orphaned rows** — a delete with cascades.
Nothing in this repo can do that: the only `.delete()` calls in
`src/app/actions.ts` target `assignments`, `lead_notes`, and `reps`, and
`deleteRep` explicitly leaves leads behind. This came from upstream. See §3.

**2. The manager's default queue is empty for a structural reason.** The Inbox's
default tab, **"Leads"**, means `archived = false AND status IN ('new','listed','returned')`
— unowned leads awaiting a decision, not all leads. Exactly **one** lead
qualifies. That is not data loss:

- All 29 `new` leads are **archived**, dismissed by the upstream pipeline on
  2026-06-15 as `stale_>60d` (17), `no_signal_date` (10) and
  `article_older_than_35d_cutoff` (5). They are intact in the Archived tab.
- 45 leads are owned and live in **Assigned** and on the Pipeline board.
- No genuinely new unowned lead has arrived since 2026-08-13.

The tab is not new. It was named in `7b8980c` (2026-06-21), when the previously
unlabelled main list — which then meant *all non-archived leads* — got a label.
One day later `aa82dc9` (the marketplace commit) narrowed it to unowned only:
*"Manager's main inbox list now shows only unowned leads; owned leads live in the
Pipeline kanban + Assigned tab."* The overhaul's only contribution was making it
the **first and default** tab, so an empty queue is now the first thing you see
on login. See §4 for the open decision.

**3. "Nothing falls through" is failing in production.** 24 assigned-family leads
have had no pipeline update in 21+ days — up from 17 three days ago. The console
still gives no signal for this. `V2_PLAN.md` §4 C9 is the fix and it has not
shipped.

---

## 3. Notes for the Hermes agent

Hermes writes into the same Supabase project this console reads. It does not live
in this repo, and it changes the schema without a commit here. These are the
things the pipeline side needs to know or act on.

### Must not regress

1. **Stay on `SUPABASE_SERVICE_ROLE_KEY`.** As of `0015`, RLS is deny-by-default
   on all 13 tables with **no policies**. The anon key now returns empty result
   sets — not errors. If any Hermes process is still on anon it fails *silently*,
   which is the exact failure mode the migration sequencing was designed to
   avoid. Verify by role, not by "it returned 200".
2. **The anon key is due for rotation** (hygiene now, not urgency — it no longer
   grants data access). When it rotates, anything still holding it breaks. Do not
   re-adopt it for anything.
3. **Announce DDL before it lands.** `supabase/migrations/` in this repo is not a
   record of production — only one migration is registered remotely. Nearly every
   query in `src/lib/queries.ts` uses `select("*")`, so a column that appears or
   disappears surfaces as `undefined`, never as an error. Schema drift here fails
   silently and can sit undetected for weeks. `leads.score_breakdown` was read by
   the UI for months before anyone noticed the column did not exist.

### Open asks

4. **Stop hard-deleting leads — archive them instead.** Nine leads and their
   cascading contacts and assignments were removed from the database between
   Aug 13 and Aug 16. If that is deduplication or a quality sweep, the console
   has no way to show it happened, and any rep who had one assigned lost it with
   no trace. Use `archived = true` plus an `archived_reason` — the console
   already has a full Archived tab built for exactly this, and it preserves the
   audit trail. **If the deletes were not intentional, this is a bug and needs
   investigating.**

5. **Populate `leads.score_breakdown`.** Still `NULL` on all 101 leads. The
   column exists (added 2026-08-13), the UI is built, and the rubric has
   therefore never rendered for anyone in any environment. This repo never writes
   the field. `JSONB`, an array of one object per criterion:

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
   `company_scale`, `product_fit`. `passed` is boolean, `note` a short evidence
   string or `null`. Omitted keys render as greyed unevaluated rows, so a partial
   array is safe. Backfilling existing leads is optional.

6. **Contact coverage has regressed.** It was 110/110 on Aug 13 and is now
   95/101 — six leads carry no contact at all. 100% coverage was the headline
   evidence that lead discovery was validated. Worth checking whether the six are
   in-flight or whether enrichment is failing on a new source.

7. **The phone gap is unowned.** 1 contact in 172 has a phone number. Either
   phone sourcing becomes a pipeline capability, or this console drops phone as a
   channel — it should not keep rendering a field that is empty 99.4% of the
   time. This needs a decision, not more waiting.

8. **Is `why_is_this_a_lead` being written for every new lead?** 13 of 101 have
   it. It is the strongest signal the pipeline produces and the console is about
   to give it the top of the lead page (`V2_PLAN.md` §4 B5). If it is only on one
   cohort, that feature ships mostly empty.

9. **Has ingestion stopped?** The newest lead is 2026-08-13 — three days with
   nothing new, while the manager's unowned queue sits at one. If the pipeline is
   paused, say so; if it is running and finding nothing, that is a different
   problem worth naming.

10. **The archive rule interacts badly with the console's default view.** The
    2026-06-15 sweep archived 29 `new` leads as stale. Because the default tab
    shows only unowned-and-unarchived leads, an aggressive archive rule empties
    the manager's queue rather than just deprioritising it. If a lead is stale but
    still workable, consider leaving it live and letting the human dismiss it.

11. **`assignment_pings` needs an owner.** The table exists in production with 0
    rows and is referenced nowhere in this codebase. It looks like upstream
    intends to email reps on assignment. Either Hermes owns sending and this repo
    reads the log, or the table should be dropped. Reps currently learn about an
    assignment by looking.

---

## 4. Notes for the future

### Decision waiting on Dane

**Should the "Leads" tab go back to meaning *all* live leads?** Right now it
reads 1 of 101 and looks like the app lost the data, which is what prompted this
document. Options:

- **Revert to all non-archived leads** — a two-line change: drop the
  `UNOWNED_STATUSES` filter at `src/lib/queries.ts:231`. Assigned then becomes a
  subset view rather than the only place owned leads live. Closest to what
  existed before 2026-06-22.
- **Keep it as a triage queue but explain itself** — leave the filter and give
  the empty state real copy: "No unowned leads. 45 are being worked → Assigned ·
  29 were archived as stale → Archived." Cheapest way to stop it reading as data
  loss, and it preserves the decluttered inbox the marketplace work was for.
- **Rename it** — "To triage" or "Unowned" says what it is. The label "Leads"
  promises an index of everything, which is what makes 1 row alarming.

The middle option is the recommendation: the filter is doing real work, the
label and empty state are what mislead.

### One commit is behind both of this document's complaints

`aa82dc9` (2026-06-22) did three things under the heading "add lead
marketplace": it shipped the marketplace, it narrowed the manager's default tab
to unowned leads, and it deleted the reps' list view. Only the first was the
stated job. The other two were decluttering, each recorded in one line of the
commit body, and both surfaced weeks later as "the app lost my data" and "give
the reps back the inbox".

The rule that would have caught it is already house rule 1 — *a redesign
replaces the look, never the function; removing a capability needs explicit
approval*. It was written for the UI overhaul, which honoured it. The gap is
that a **feature** commit can quietly subtract too, and a one-line mention in a
commit body is not approval. When a commit removes a surface a user works from,
that belongs in the subject line, not the body.

Worth auditing whether anything else went the same way. `git log` is the only
record — there is no changelog.

### Carried over from `V2_PLAN.md`, still open

- **A2** — generate `types.ts` from the live database and add a CI drift check.
  This is the root cause of every silent-drift incident so far and nothing else
  in the plan is safe until it lands.
- **A3** — reconcile `supabase/migrations/` with production so the repo describes
  reality.
- **B5** — `why_is_this_a_lead` becomes the lead's headline. Biggest triage-speed
  win available.
- **B6** — surface contact quality (`email_verified`, `role_fit`,
  `enrichment_method`, `note`) so a rep knows who to call first.
- **C9** — staleness. 24 leads are 21+ days cold and the console is silent. Icon
  plus text, never colour alone.
- **C10** — assign / list / kill from the inbox row and command palette.
- **C11** — mobile audit of `/dashboard`, `/leads/[id]`, `/my`. Mobile parity is
  a stated commitment and dense tables plus a nine-column kanban are where it
  breaks. `/my?view=inbox` now ships the same phone card-list fallback the
  manager's inbox uses, so the rep side of this is partly done — the board and
  `/leads/[id]` are not.

### Housekeeping for this repo

- **Rotate the anon key** (`V2_PLAN.md` §6 step 6). Last outstanding item of the
  security work.
- **`.env.local` now points at the live project**, not at placeholders. That
  means `npm run dev` reads and writes **production**. `CLAUDE.md` has been
  corrected to say so. Be aware that a local click can kill a real lead.
- **No test suite exists.** `npm run build` is the only gate. Given two of the
  last three bugs were live/mock branches disagreeing (`a0ba67a`, `f580bd4`), a
  handful of tests over `queries.ts` covering "mock branch and live branch apply
  the same filters" would have caught both.
- **Mock fixtures need `score_breakdown`.** All 8 are `null`, which is why the
  rubric's absence went unnoticed through design and review.
- ~~`outreach.used` unverified against production~~ — **confirmed 2026-08-16**:
  the column exists, `boolean`, defaults to `false`. The flag raised in `bb89ff5`
  is closed.

### Deployment

Live at **`bitoleadgendash.vercel.app`**, deployed from `main` on GitHub
(`dane-04-code/bitoleadgendash`). Verified 2026-08-16 that the deployment holds
`SUPABASE_SERVICE_ROLE_KEY` and reads live data correctly post-lockout — all
Inbox tabs return the same counts as direct database queries.
