# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two roles, both confirmed in code and by the operator (Dane, 2026-08-12):

- **Admin / manager** (currently Dane; being handed to Dean). Triages every inbound lead, scores and reviews it, assigns it to a rep or lists it on the marketplace, and watches the whole pipeline. Sole holder of the shared admin password. Works across desktop and mobile.
- **Sales rep ("salesman")** — a named seller (Layla, Omar, Priya et al., UAE/KSA/GCC territories). Works only their own assigned or claimed leads: contacts them, moves them through stages, records the deal, returns leads they can't progress. Works across desktop and mobile.

Both roles must be equally well served on desktop and mobile — confirmed 2026-08-12. Reps are frequently away from a desk; the admin reviews on the move.

## Product Purpose

A lead-intelligence and sales-pipeline console for **BITO UAE** (warehouse racking, shelving, and automation across the GCC). An upstream enrichment pipeline ("Hermes") discovers companies showing buying signals, scores them, and writes them into Supabase. This dashboard is where a human decides what to do with each one: triage, assign, work, and close.

Success = no qualified lead sits unactioned, every rep knows what to work next, and the manager can see win/loss reality at a glance.

## Positioning

Not a general CRM. It is the last mile of an automated signal pipeline — leads arrive pre-scored with a reasoned score breakdown, suggested BITO products, and drafted outreach. The product's job is fast human judgement on machine-supplied leads, not contact management from scratch.

## Operating Context

- **Lead lifecycle:** `new → listed → assigned → contacted → meeting → quote → won | dead | returned`. `returned` = a rep handed a lead back. `listed` = published to the internal marketplace for reps to claim.
- **Routing:** admin assigns directly, or lists to a marketplace where reps self-claim and can unclaim. Reps set an availability flag (`looking` / `not_looking`).
- **Working a lead:** score breakdown rubric, manual review scorecard with comment, notes, contact copy + Outlook/mailto handoff, AI-drafted outreach copy a human sends manually, kill/archive, return.
- **Closing:** a deal profile (commercial detail: quote reference, competitors, tender reference) and a sale record (value, gross profit, margin, project reference) feeding a sales register.
- **Support loop:** an in-app feedback/suggestions box reps and admin file into, with admin-set status.

## Capabilities and Constraints

Confirmed functionality that must survive any redesign — routes: `/dashboard`, `/pipeline`, `/leads/[id]`, `/reps`, `/marketplace`, `/my`, `/my/account`, `/settings`, `/feedback`, `/login`, `/signup`.

- Admin-only: `/dashboard`, `/pipeline`, `/reps`, `/settings` (enforced in `src/middleware.ts`). `/my` is rep-only.
- Dashboard tabs: New / Leads / Assigned / Returned / Archived / Killed, with filters (search, status, industry, score) and stat tiles.
- Kanban across all nine stages (admin), and a rep-scoped board on `/my`.
- Rep admin: add rep, set/reset password, delete rep, per-rep lead counts.
- Rep self-signup gated by a shared `REP_SIGNUP_CODE`; forced password reset flow.
- Light and dark themes both supported, with a toggle — confirmed keep, 2026-08-12.

**Constraints:**
- Next.js 14 App Router + Supabase (anon key, RLS disabled on some tables), Tailwind. Server actions in `src/app/actions.ts`, queries in `src/lib/queries.ts`.
- Auth is *not* Supabase Auth: a single shared `DASHBOARD_PASSWORD` env var for admin, PBKDF2 hashes in a `reps` table for reps, HMAC-signed `li_session` cookie.
- `src/lib/mock-data.ts` + `isMockMode()` serve the entire app without Supabase when env vars are absent or placeholder. This is the local demo path.
- The base `leads`/`contacts`/`reps` schema predates the repo's migrations and lives only in the live Supabase project. **The upstream agents alter that schema without a commit here** — `supabase/migrations/` is not a reliable record of production, and only one migration is registered remotely. Any production DDL requires explicit approval.
- Apollo enrichment and phone-number sourcing happen upstream in Hermes, not in this codebase.
- **No email sending exists in this app.** Only `mailto:` links and drafted copy a human sends. An `assignment_pings` table (assignment-notification send log: recipient, subject, lead count, status, error) exists in the live database — created upstream, currently 0 rows, and unreferenced anywhere in this codebase. Whether the dashboard adopts it is a v2 decision.

**Terminology change — shipped 2026-08-13.** The "Proposal" stage is now **"Quote"** in both UI copy and stored data (migration `0014`, the one migration registered remotely). `leads.status` turned out to have no check constraint and no enum — it is plain `text` defaulting to `'new'`, so no constraint alteration was needed. `deal_profiles.proposal_reference` / `proposal_sent_date` are retained but no longer written.

## v2 (in flight, from 2026-08-13)

The upstream agents have moved to v2 and lead discovery is **validated** — every one of the 110 live leads carries contacts. The frontend has not caught up. v2 for this repo means closing that gap and improving the working experience on top of it; the plan of record is `V2_PLAN.md`, which also tracks live-vs-repo schema drift.

Newly confirmed upstream output the UI does not yet surface:

- `leads.why_is_this_a_lead` — a sourced narrative justifying the lead (named company, dated event, contract value, facility detail). The strongest signal the pipeline now produces. Present on the newest leads only.
- `contacts.email_verified`, `contacts.role_fit`, `contacts.enrichment_method`, `contacts.note` — contact-quality evidence, populated across the contact set.

Partly resolved 2026-08-13: `leads.score_breakdown` is read by `/leads/[id]` but did not exist in the production table — migration `0010` had been written and never applied. The column is now live, but it is `NULL` on all 110 production leads *and* all 8 mock fixtures, so the score-breakdown rubric has never actually rendered for anyone. Nothing in this codebase writes it — it is upstream output. The feature stays dark until the agents populate it; spec in `V2_PLAN.md` §4 A1.

**Security posture is changing (decided 2026-08-13).** The app currently reaches Supabase with the anon key against tables with row-level security disabled. Dane has directed a move to a properly secured, RLS-enforced database. See `V2_PLAN.md` §6.

## Brand Commitments

Binding, from `Danes Brain/Projects/Bito Consulting/Plans/BRANDING.md` (colours sampled from the real logo asset, verified 5 Aug 2026) plus operator decisions on 2026-08-12:

- **BITO teal `#00797f`** and **white** are the brand. Tonal ramp: `#00565b`, `#00464a`, `#4fa3a8`, `#e7edec`, `#f2f6f5`.
- **Quicksand** is the typeface (headings 600/700, body 400/500). It replaces an earlier unverified Barlow assumption — do not reintroduce Barlow.
- **Orange `#e06c00` is permitted for tiny components only** (a CTA, a hot flag) — never a base surface or a second identity colour. This is a deliberate, operator-approved exception to BRANDING.md's "no orange, anywhere" rule, scoped to this app.
- **Do not place the BITO logo anywhere.** Reserve a defined space for it in the layout, left empty. Colours and fonts only.
- **Components must not be rounded.** Square corners.
- Semantic status colours are UX convention, not brand: good `#4f8f5f`, warning `#cf9a3a`, bad `#b8503f`. Ink `#1c1f1f`, muted `#6f7c7c`.

**Convention is the commitment (standing preference, 2026-08-12).** The operator asked for the familiar CRM path — "take inspiration from popular CRM tools", "don't sway too hard away from what we already have". This surface executes the category standard at full fidelity, without irony or smuggled quirk. The craft bar is **Attio/Linear density for tables and lists, with roomier kanban cards sized for comfortable drag targets**. Future work on this product inherits that bar rather than reopening the aesthetic.

## Evidence on Hand

- Real: the full route/feature set and data model in this repo; `src/lib/mock-data.ts` (776 lines of realistic BITO UAE leads, reps, contacts, outreach).
- Real: `BRANDING.md` colour and type verification, sampled from `Logos & Branding/BITO WAREHOUSE CONSULTANCY.png`.
- **Do not fabricate:** customer names beyond the existing mock set, win rates, revenue figures, testimonials, or any claim about Apollo/Hermes capability. There is no reversed (white-on-teal) logo mark and no confirmed minimum clear space.
- Anti-reference: `Bito Consulting/Consultant html trial/BITO Warehouse Planner …html` is branded with an orange accent and Barlow that BRANDING.md explicitly identifies as unverified carry-over. Use it for layout feel only, not as a colour or type source.

## Product Principles

1. **Judgement speed over data entry.** Every screen should shorten the time between seeing a lead and deciding its fate. Navigation must feel instant.
2. **The machine proposes, the human disposes.** Scores, breakdowns, and drafted outreach are inputs to a decision, never presented as conclusions.
3. **Nothing falls through.** Unactioned, returned, and stalled leads must be visible without hunting for them.
4. **Two roles, one truth.** Admin sees everything; a rep sees exactly their book of work — never a filtered illusion of the whole.
5. **Preserve what works.** The incumbent feature set is hard-won and in daily use; a redesign replaces the look, never the function.

## Accessibility & Inclusion

No formal standard mandated. Product-specific needs: full desktop and mobile parity for both roles (confirmed); dense data must stay legible at small sizes; status must never be communicated by colour alone, since the stage palette is a single-hue teal ramp.
