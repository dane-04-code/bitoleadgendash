# 0001 — Guard every server action

**Status:** blocked (mock-mode scope decision)
**Roadmap:** N1 (top of Now)
**Branch:** —
**Owner:** unassigned
**Written:** 2026-08-17 · **Last verified against repo:** 2026-08-21

## Problem

Any authenticated sales rep can take over another rep's account, delete reps,
create rep accounts, reassign any lead to anyone, and mark any lead `won`.

Server actions are POST endpoints. `src/middleware.ts` protects **pages**, not
actions — a rep who is legitimately signed in can invoke any exported action
directly. The database will not stop them either: the app connects with
`SUPABASE_SERVICE_ROLE_KEY`, which has `rolbypassrls = true`, so RLS is bypassed by
design (`context/DECISIONS.md`, 2026-08-15). Authorization exists **only** in
application code, and in ten of 23 exported actions it does not exist at all.

This is the same failure mode as commit `bb89ff5`, where two unguarded actions were
caught late. It was never fixed at scale.

## Evidence

Audited `src/app/actions.ts` (23 exported actions) on 2026-08-21.

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

**Guarded today — 13 exported actions establish the reference patterns:**

- Admin-only: `toggleRepActive` (812), `listLead` (243), `unlistLead` (285),
  `killLead` (425), `updateFeedbackStatus` (704).
  ```ts
  const session = await getSession();
  if (session?.role !== "admin") return { ok: false, error: "Admins only." };
  ```
- Rep-only or rep-self: `returnLead` (170), `claimLead` (315), `unclaimLead`
  (368), `updateMyProfile` (867), `changeMyPassword` (898). `returnLead` and
  `unclaimLead` also test ownership; `claimLead` instead requires an unowned
  `listed` lead and atomically claims it.
- Either role, authenticated: `markOutreachUsed` (467), `saveConfirmedOrder`
  (547), `submitFeedback` (670). The first two also test ownership for reps.

## Decision

Introduce three shared guards at the top of `src/app/actions.ts` and apply at
least one to **every** exported action. No action reaches a Supabase call or a
mock mutation before an authentication guard has returned successfully.

```ts
type Denied = { ok: false; error: string };

/** Admin-only. */
async function requireAdmin(): Promise<{ session: Session } | Denied>

type SessionOptions = { allowForcedPasswordChange?: boolean };

/** A current, active signed-in user; returns the validated session. */
async function requireSession(
  options?: SessionOptions
): Promise<{ session: Session } | Denied>

/** A rep acting on a lead they own. Admins pass through. */
async function requireLeadAccess(leadId: string): Promise<{ session: Session } | Denied>
```

`requireLeadAccess` admits an admin for any lead, and a rep only when
`isLeadOwnedByRep(leadId, repId)`. Error strings stay generic — `"Not authorised."` —
so an unauthorised caller learns nothing about what exists.

The guards compose through `requireSession`: `requireAdmin` adds the admin-role
check, and `requireLeadAccess` adds lead ownership for reps. For every rep
session, `requireSession` resolves `session.subject` against `reps` (or the mock
rep set) and rejects a missing or inactive account. It also rejects
`must_change_password`; `changeMyPassword` alone passes
`{ allowForcedPasswordChange: true }`. This closes the direct-action path left
open by page redirects and prevents a deactivated rep from using a still-valid
14-day cookie.

`claimLead` is the deliberate exception to lead ownership: a claimable lead is
unowned by definition. It uses `requireSession`, then requires a rep role and
keeps the existing atomic `listed` → `assigned` transition.

`deleteLeadNote` and `markOutreachUsed` remove the caller-supplied `leadId` from
their server-action signatures. Each first uses `requireSession`, then resolves
the resource's actual `lead_id`, and finally applies lead access to that resolved
id before mutation and revalidation. This is the only two-stage guard path.

Rejected: enforcing this in RLS policies instead. The app deliberately holds the
service-role key so it can hold the *only* copy of the authorization rules; adding
policies would mean two sources of truth and would not apply to this key anyway.

## Scope

### In

- `src/app/actions.ts`: add the three guards and apply the policy below to all
  23 exported actions.

| Action | Gate | Action-specific policy |
|---|---|---|
| `assignLeadToRep` | `requireAdmin` | Admin only. |
| `createRep` | `requireAdmin` | Admin only. |
| `setRepPassword` | `requireAdmin` | Admin only. |
| `clearRepPassword` | `requireAdmin` | Admin only. |
| `deleteRep` | `requireAdmin` | Admin only. |
| `toggleRepActive` | `requireAdmin` | Admin only. |
| `listLead` | `requireAdmin` | Admin only. |
| `unlistLead` | `requireAdmin` | Admin only. |
| `updateFeedbackStatus` | `requireAdmin` | Admin only. |
| `updateLeadStatus` | `requireLeadAccess` | Admin on any lead; rep on an owned lead. Enforce `ADMIN_SETTABLE_STATUSES` / `REP_SETTABLE_STATUSES` server-side. |
| `moveLeadToStatus` | `requireLeadAccess` | Same policy and runtime status allowlists as `updateLeadStatus`. |
| `killLead` | `requireAdmin` | Admin only. Reps retain their existing `dead` transition through the guarded status actions. |
| `addLeadNote` | `requireLeadAccess` | Admin on any lead; rep on an owned lead. |
| `saveLeadReview` | `requireLeadAccess` | Admin on any lead; rep on an owned lead. |
| `saveConfirmedOrder` | `requireLeadAccess` | Admin on any lead; rep on an owned lead. Retain the `won` precondition. |
| `returnLead` | `requireLeadAccess` | Owning rep only; an admin who passes lead access is still rejected by the rep-role invariant. |
| `unclaimLead` | `requireLeadAccess` | Owning rep only; an admin who passes lead access is still rejected by the rep-role invariant. |
| `claimLead` | `requireSession` | Rep only; the lead must still be `listed`. Ownership is established by this action, not required before it. |
| `deleteLeadNote` | `requireSession`, then resolved lead access | Signature becomes `deleteLeadNote(noteId)`. Resolve the note's stored `lead_id`; admin on any lead, rep on an owned lead. |
| `markOutreachUsed` | `requireSession`, then resolved lead access | Signature becomes `markOutreachUsed(outreachId, used)`. Resolve the outreach row's stored `lead_id`; admin on any lead, rep on an owned lead. |
| `submitFeedback` | `requireSession` | Any signed-in user. |
| `updateMyProfile` | `requireSession` | Rep only, acting on `session.subject`. |
| `changeMyPassword` | `requireSession({ allowForcedPasswordChange: true })` | Rep only, acting on `session.subject`; the sole action available while `must_change_password` is set. |

- `applyLeadStatus` is a private helper: guard both public entry points rather than
  the helper, so the guard sits where the caller is known.
- Make `currentActorName()` reject rather than return `null` for an absent session.
- Surface denied results in the five caller paths that currently discard them:
  `updateLeadStatus` in `src/components/status-selector.tsx`, `addLeadNote` and
  `deleteLeadNote` in `src/components/lead-notes.tsx`, `clearRepPassword` in
  `src/components/set-password-dialog.tsx`, and `updateFeedbackStatus` in
  `src/components/feedback-status-selector.tsx`.
- On denial, optimistic controls restore their confirmed value: status and
  feedback selectors roll back, note text stays in the composer, and the
  password dialog stays open.
- Add repeatable local verification that invokes the authorization paths
  directly. A UI walkthrough is insufficient because it cannot exercise hidden
  actions as the wrong role. Production is not part of verification.

### Out

- Any change to the session mechanism, cookie, hashing, or `src/middleware.ts`.
- RLS policies. Deny-by-default with zero policies stays exactly as it is.
- Per-user admin identity — that is a `ROADMAP.md` §4 proposal, not this.
- Rate limiting, CSRF work, audit logging.
- Rotating the anon key (decision D2).

## Data

No schema change. No DDL. `requireSession` reads `reps.is_active` and
`reps.must_change_password` for rep sessions through the existing table and
mock data. Lead access reads `assignments`. `deleteLeadNote` and
`markOutreachUsed` additionally read their target row to obtain its stored
`lead_id` before mutation.

## Empty and degraded states

A denied action returns `{ ok: false, error: "Not authorised." }`. Four caller
components currently swallow five action errors; update those paths as listed in
Scope. A user who is denied must see that something was refused and retain the
last confirmed UI state, never a button that appears to do nothing or an
optimistic value that falsely looks saved.

## Design notes

None. No UI change beyond error strings appearing where they previously could not.

## Acceptance

- [ ] A static inventory accounts for all 23 exported actions in
      `src/app/actions.ts`; each calls an authentication guard before any data
      access. `deleteLeadNote` and `markOutreachUsed` then authorize against the
      resolved parent `lead_id` before mutation.
- [ ] Every action rejects an absent session before any Supabase access or mock
      mutation.
- [ ] A rep session cannot invoke `createRep`, `setRepPassword`, `clearRepPassword`,
      `deleteRep`, `assignLeadToRep`, `listLead`, `unlistLead`, or
      `updateFeedbackStatus`; `killLead` remains admin-only.
- [ ] A rep cannot change the status of, note on, or review a lead they do not
      own.
- [ ] Direct action calls enforce `ADMIN_SETTABLE_STATUSES` and
      `REP_SETTABLE_STATUSES`; the server does not rely on the status dropdown.
- [ ] A rep can claim a still-listed lead without already owning it, and a
      non-rep cannot invoke `claimLead`.
- [ ] `deleteLeadNote` and `markOutreachUsed` accept no caller-supplied `leadId`;
      authorization and revalidation use the target row's stored `lead_id`.
- [ ] A missing, deleted, or inactive rep account is denied even when its signed
      session cookie has not expired.
- [ ] A rep with `must_change_password` is denied by every action except
      `changeMyPassword`.
- [ ] An admin retains every capability they have today — verified route by route
      against the table in `context/ARCHITECTURE.md` §3.
- [ ] `currentActorName()` no longer returns `null` on an absent session.
- [ ] Every caller surfaces the returned error; optimistic selectors roll back,
      note text is retained, and the password dialog remains open.
- [ ] A repeatable local authorization matrix covers: no session, admin, owning
      rep, non-owning rep, inactive rep, forced-reset rep, missing note/outreach
      target, and a status outside the caller's role allowlist. The evidence
      invokes action or policy paths directly rather than relying only on which
      controls the UI renders.
- [ ] `npm run build` passes.
- [ ] The mock-mode decision in Open questions is resolved and its resulting
      acceptance path passes for both roles.
- [ ] `routines/REVIEW.md` passes with the report block filled in.
- [ ] `context/ARCHITECTURE.md` §5 updated — remove the "failing" table and the
      unguarded-action list. `context/ROADMAP.md` N1 moved out of Now.
- [ ] `routines/REVIEW.md` A3's "known pre-existing failures" note deleted.

## Risks

- **Highest-value target in the repo.** Touches every mutation. A guard that is too
  strict silently breaks a path the sales team uses daily, and there is no test
  suite to catch it. Mitigation: run the direct authorization matrix and the
  agreed mock-mode path, and keep the diff to guards only — no refactoring alongside.
- Rep-session validation adds a `reps` lookup to each action a rep invokes. Treat
  lookup failure as a generic denial; never continue on an unknown account state.
- Resource resolution for `deleteLeadNote` / `markOutreachUsed` adds a lookup
  after session authentication and before the mutation. Handle a missing target
  with the same generic denial so existence is not leaked.
- `killLead` returns a typed `{ ok, error }` the caller inspects — keep the shape.

## Open questions

**Mock-mode scope — needs Dane.** `routines/REVIEW.md` A6 requires every touched
action to retain a working mock branch. This change touches all 23 exports, but
13 currently have no mock mutation path (`assignLeadToRep`, `returnLead`,
`listLead`, `unlistLead`, `claimLead`, `unclaimLead`, `killLead`, `createRep`,
`setRepPassword`, `clearRepPassword`, `deleteRep`, `updateMyProfile`,
`changeMyPassword`) and `saveConfirmedOrder` deliberately refuses mock mode.

Choose one before implementation:

1. **Expand N1:** add the missing mock behavior so every legitimately authorized
   success path can be exercised. This satisfies A6 literally but materially
   enlarges the highest-risk change.
2. **Authorization-only N1:** exercise every denial and guard branch in a local
   harness, preserve existing mock behavior, and write a separate spec for the
   pre-existing mock-action gaps. This keeps N1 focused but requires an explicit
   A6 review disposition for those existing gaps.
