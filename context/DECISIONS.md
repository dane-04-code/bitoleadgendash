# Decisions

Standing decisions, newest first. If something in this codebase looks arbitrary,
it is probably here with a reason and a date.

**Rules for this file.** Append at the top. Never edit or delete an entry — if a
decision is reversed, add a new entry that supersedes it and mark the old one.
Every entry needs: date, who decided, what was decided, and what it forecloses.
A decision that does not foreclose anything is not a decision, it is a preference.

---

## 2026-08-17 — The project stays single-tenant, BITO-only
**Decided by:** Dane.
**Decision:** Deepen for BITO only. One company, two roles, made excellent.
**Forecloses:** Multi-tenancy, white-labelling, productisation for other
companies, absorbing Hermes' pipeline surface into this console, and any auth
rebuild chasing enterprise features. These move from "later" to permanently out of
scope. See `ROADMAP.md` §6.

## 2026-08-17 — Upstream owns assignment notification sending
**Decided by:** Dane.
**Decision:** Hermes sends rep notifications. This app does not gain an email
path.
**Forecloses:** An email provider, a provider secret, deliverability and retry
work, and adoption of the `assignment_pings` table by this repo. "No email sending
in this app" becomes a hard architectural rule, not a current-state observation.
Rep assignment awareness, if built, is **in-app only** (`ROADMAP.md` X4).

## 2026-08-17 — Phone sourcing is an upstream request; phone stays in the UI
**Decided by:** Dane.
**Decision:** Keep phone as a channel in the UI and log phone sourcing as an
upstream dependency on Hermes. 1 of 182 contacts has a number today.
**Forecloses:** Removing phone from the UI. **Requires:** an honest empty state in
the meantime — the UI must not imply phone is a working channel while coverage is
1 in 182. Tracked as upstream request 2 in `DATA.md` §5.

## 2026-08-17 — `why_is_this_a_lead` replaces `score_reason` and `signal_summary` in the UI
**Decided by:** Dane.
**Decision:** The sourced narrative becomes the single headline on `/leads/[id]`
and a two-line clamp in the inbox row. `score_reason` and `signal_summary` are
retired from the UI. Both are retained in the database.
**Forecloses:** Showing three overlapping justifications on the same surface.
**Requires:** a real fallback. The narrative is on 16 of 104 leads; the two fields
it replaces are on 104 of 104. A lead with no narrative must still be triageable.
Whether the fallback is permanent depends on open decision D3 in `ROADMAP.md`.

## 2026-08-17 — Context is restructured into `context/`, `specs/`, `routines/`
**Decided by:** Dane.
**Decision:** `CLAUDE.md` stays at the repo root as the single entry point and
index. Product, architecture, data, roadmap, design and decisions live in
`context/`. One spec per unit of work in `specs/`. Repeatable procedures — review,
ship, schema verification — in `routines/`. `V2_PLAN.md` is folded into
`context/ROADMAP.md` and archived unedited at `context/archive/V2_PLAN.md`.
**Why:** the project is moving to an agentic workflow where controlling agents
invoke Claude through the CLI with no human watching the turn. Context has to be
loadable by path and unambiguous about what is committed versus proposed.
**Forecloses:** planning from `V2_PLAN.md`, and adding new top-level markdown at
the repo root.

## 2026-08-16 — `.env.local` points at the live project
**Decided by:** Dane.
**Decision:** Local development reads and writes production data. `isMockMode()`
is false locally.
**Consequence:** A status change in dev is a status change for the sales team.
There is no staging environment. The placeholder values that restore mock mode are
kept in a comment at the top of `.env.local`.

## 2026-08-15 — RLS deny-by-default; the app runs on the service-role key
**Decided by:** Dane (directed 2026-08-13, applied 2026-08-15).
**Decision:** Row-level security enabled with **zero policies** on all 13 public
tables. The app connects server-side with `SUPABASE_SERVICE_ROLE_KEY`, which
bypasses RLS. Hermes was migrated to the service-role key first and confirmed
still writing before anything was applied. `feedback_anon_all` dropped;
`update_updated_at` search_path pinned. Migration `0015`.
**Forecloses:** Any client-side data path, forever — it would either leak the
service-role key or read nothing.
**Consequence:** The database will not stop a bad request. Authorization lives
**entirely** in application code, in every server action as well as in middleware.
This is why `specs/0001` exists.
**Outstanding:** rotate the anon key (hygiene; it no longer grants data access).

## 2026-08-13 — "Proposal" is renamed "Quote"
**Decided by:** Dane. Migration `0014` — the first one registered remotely.
**Decision:** The stage is "Quote" in both UI copy and stored data.
`leads.status` turned out to have no check constraint and no enum — plain `text`
defaulting to `'new'` — so no constraint alteration was needed.
**Consequence:** `deal_profiles.proposal_reference` and `proposal_sent_date` are
retained but no longer written.

## 2026-08-13 — Barlow and rounded corners supersede the earlier brand rules
**Decided by:** Dane.
**Decision:** The Claude Design comps approved for the console are set in
**Barlow / Barlow Condensed** with IBM Plex Mono for figures, and use rounded
corners on a 5–14px scale. This supersedes the earlier "Quicksand only" and
"square corners, without exception" rules. **The comp is the commitment.**
**Forecloses:** "Restoring" Quicksand or square corners without asking.

## 2026-08-12 — Orange `#e06c00` is permitted for tiny components only
**Decided by:** Dane.
**Decision:** A deliberate, scoped exception to `BRANDING.md`'s "no orange,
anywhere" rule — a CTA, a hot flag.
**Forecloses:** Orange as a base surface or a second identity colour.

## 2026-08-12 — Convention is the commitment
**Decided by:** Dane. "Take inspiration from popular CRM tools", "don't sway too
hard away from what we already have."
**Decision:** This surface executes the familiar CRM category standard at full
fidelity, without irony or smuggled quirk. The craft bar is **Attio/Linear density
for tables and lists, with roomier kanban cards sized for comfortable drag
targets.**
**Forecloses:** Reopening the aesthetic. All future work inherits this bar.

## 2026-08-12 — The BITO logo is never placed
**Decided by:** Dane.
**Decision:** Reserve a defined space for it in the layout, left empty. Colours
and fonts only.
