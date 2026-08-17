# 0001 — Guard every server action

**Status:** ready
**Roadmap:** N1 (top of Now)
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against repo:** 2026-08-17

## Problem

Any authenticated sales rep can take over another rep's account, delete reps,
create rep accounts, reassign any lead to anyone, and mark any lead `won`.

Server actions are POST endpoints. `src/middleware.ts` protects **pages**, not
actions — a rep who is legitimately signed in can invoke any exported action
directly. The database will not stop them either: the app connects with
`SUPABASE_SERVICE_ROLE_KEY`, which has `rolbypassrls = true`, so RLS is bypassed by
design (`context/DECISIONS.md`, 2026-08-15). Authorization exists **only** in
application code, and in nine of 23 actions it does not exist at all.

This is the same failure mode as commit `bb89ff5`, where two unguarded actions were
caught late. It was never fixed at scale.

## Evidence

Audited `src/app/actions.ts` (23 exported actions) on 2026-08-17.

**Unguarded — no session or role check before touching data:**

| Action | Line | Consequence |
|---|---|---|
| `setRepPassword` | 766 | **Account takeover.** Sets any rep's password hash and `must_change_password`. A rep can lock out or impersonate a colleague. |
| `clearRepPassword` | 791 | Nulls any rep's password. |
| `deleteRep` | 840 | Deletes any rep and cascades their `assignments`. |
| `createRep` | 731 | Creates rep accounts, with a password. |
| `assignLeadToRep` | 47 | Assigns any lead to any rep; writes `pipeline_updates`. |
| `updateLeadStatus` → `applyLeadStatus` | 96 / 112 | Moves any lead to any stage, including `won` and `dead`. |
| `moveLeadToStatus` | 108 | Same, via the kanban's typed path. |
| `addLeadNote` | 501 | Calls `currentActorName()`, which *reads* the session but does not reject a missing one — writes a note with a `null` author. |
| `deleteLeadNote` | 526 | Deletes any note. No ownership test. |
| `saveLeadReview` | 626 | Same shape as `addLeadNote`. |

**Correctly guarded — the reference patterns:**

- Admin-only: `toggleRepActive` (812), `listLead` (243), `unlistLead` (285),
  `updateFeedbackStatus` (704).
  ```ts
  const session = await getSession();
  if (session?.role !== "admin") return { ok: false, error: "Admins only." };
  ```
- Rep-scoped with ownership: `returnLead` (170), `claimLead` (315),
  `unclaimLead` (368), `updateMyProfile` (867), `changeMyPassword` (898) — via
  `getCurrentRepId()` and `isLeadOwnedByRep()`.
- Either role, authenticated: `killLead` (425), `markOutreachUsed` (467),
  `saveConfirmedOrder` (547), `submitFeedback` (670).

## Decision

Introduce three shared guards at the top of `src/app/actions.ts` and apply one to
**every** exported action. No action reaches a Supabase call or a mock mutation
before its guard has returned successfully.

```ts
type Denied = { ok: false; error: string };

/** Admin-only. */
async function requireAdmin(): Promise<{ session: Session } | Denied>

/** Any signed-in user; returns the session so callers can branch on role. */
async function requireSession(): Promise<{ session: Session } | Denied>

/** A rep acting on a lead they own. Admins pass through. */
async function requireLeadAccess(leadId: string): Promise<{ session: Session } | Denied>
```

`requireLeadAccess` admits an admin for any lead, and a rep only when
`isLeadOwnedByRep(leadId, repId)`. Error strings stay generic — `"Not authorised."` —
so an unauthorised caller learns nothing about what exists.

Rejected: enforcing this in RLS policies instead. The app deliberately holds the
service-role key so it can hold the *only* copy of the authorization rules; adding
policies would mean two sources of truth and would not apply to this key anyway.

## Scope

### In

- `src/app/actions.ts`: add the three guards; apply to all 23 exported actions.
- Assignment per action:

| Guard | Actions |
|---|---|
| `requireAdmin` | `createRep`, `setRepPassword`, `clearRepPassword`, `deleteRep`, `toggleRepActive`, `assignLeadToRep`, `listLead`, `unlistLead`, `updateFeedbackStatus` |
| `requireLeadAccess` | `updateLeadStatus`, `moveLeadToStatus`, `killLead`, `addLeadNote`, `deleteLeadNote`, `saveLeadReview`, `markOutreachUsed`, `saveConfirmedOrder`, `returnLead`, `claimLead`, `unclaimLead` |
| `requireSession` | `submitFeedback`, `updateMyProfile`, `changeMyPassword` (each then asserts the acting rep id, as they already do) |

- `applyLeadStatus` is a private helper: guard both public entry points rather than
  the helper, so the guard sits where the caller is known.
- `deleteLeadNote` and `markOutreachUsed` take an id, not a lead — resolve the
  owning `lead_id` first, then guard.
- Make `currentActorName()` reject rather than return `null` for an absent session.
- Verify each guarded action still works for the role that legitimately uses it, in
  **mock mode**, before touching the live app.

### Out

- Any change to the session mechanism, cookie, hashing, or `src/middleware.ts`.
- RLS policies. Deny-by-default with zero policies stays exactly as it is.
- Per-user admin identity — that is a `ROADMAP.md` §4 proposal, not this.
- Rate limiting, CSRF work, audit logging.
- Rotating the anon key (decision D2).

## Data

No schema change. No DDL. Reads `reps` and `assignments` only through existing
helpers.

## Empty and degraded states

A denied action returns `{ ok: false, error: "Not authorised." }`. Every caller
already surfaces `error` — confirm each does, and that none swallow it into a silent
no-op. A user who is denied must see that something was refused, never a button
that appears to do nothing.

## Design notes

None. No UI change beyond error strings appearing where they previously could not.

## Acceptance

- [ ] All 23 exported actions in `src/app/actions.ts` call a guard before any data
      access. `grep -c "^export async function"` matches the number of guard calls.
- [ ] A rep session cannot invoke `createRep`, `setRepPassword`, `clearRepPassword`,
      `deleteRep`, `assignLeadToRep`, `listLead`, `unlistLead`, or
      `updateFeedbackStatus`.
- [ ] A rep cannot change the status of, note on, review, or kill a lead they do not
      own.
- [ ] An admin retains every capability they have today — verified route by route
      against the table in `context/ARCHITECTURE.md` §3.
- [ ] `currentActorName()` no longer returns `null` on an absent session.
- [ ] Every caller surfaces the returned error.
- [ ] `npm run build` passes.
- [ ] Mock mode exercised for both roles.
- [ ] `routines/REVIEW.md` passes with the report block filled in.
- [ ] `context/ARCHITECTURE.md` §5 updated — remove the "failing" table and the
      unguarded-action list. `context/ROADMAP.md` N1 moved out of Now.
- [ ] `routines/REVIEW.md` A3's "known pre-existing failures" note deleted.

## Risks

- **Highest-value target in the repo.** Touches every mutation. A guard that is too
  strict silently breaks a path the sales team uses daily, and there is no test
  suite to catch it. Mitigation: exercise both roles in mock mode across every
  route before landing, and keep the diff to guards only — no refactoring alongside.
- `requireLeadAccess` on `deleteLeadNote` / `markOutreachUsed` adds a lookup before
  the mutation. Cheap, but it is a new failure point; handle a missing parent lead
  explicitly.
- `killLead` returns a typed `{ ok, error }` the caller inspects — keep the shape.

## Open questions

None. This is buildable as written.
