---
title: Lead Gen - Server Action Authorization
status: ready
target_repo: dane-04-code/bitoleadgendash
priority: P0
---

# Build Contract: Guard Every Server Action

## Problem

The dashboard uses a server-side Supabase service-role key that bypasses database RLS. Page middleware does not protect server-action endpoints. The repository audit dated 17 August 2026 identifies nine actions without adequate session, role or ownership checks, including rep password and deletion operations.

## Outcome

Every exported server action rejects unauthenticated and unauthorized requests before reading or mutating protected data, while preserving permitted admin and rep workflows in mock and live code paths.

## Binding context

Before editing, read `CLAUDE.md`, `context/PRODUCT.md`, `context/ARCHITECTURE.md`, `context/DATA.md`, `context/ROADMAP.md`, `context/DECISIONS.md`, `specs/0001-server-action-authorization.md`, `routines/REVIEW.md` and `routines/SHIP.md` in full.

## P0 requirements

- Inventory every exported server action; do not rely solely on the historical list of nine.
- Define the required policy for each action: public, authenticated, admin-only or rep-owned.
- Verify session and role before protected reads or writes.
- For rep actions, verify ownership of the exact lead/resource.
- Treat missing sessions as denial, never as an anonymous actor.
- Return the repository's existing structured error shape without leaking secrets or internal identifiers.
- Apply identical authorization behavior in mock and live modes.
- Preserve existing allowed workflows and UI behavior.
- Add focused automated tests if the repository's approved test setup exists; otherwise include a reproducible verification harness scoped to authorization.
- Update repository context/spec ledgers required by its working rules.

## Explicit non-goals

- Replacing the authentication system.
- Migrating to Supabase Auth.
- Changing RLS policies or production DDL.
- Refactoring or splitting `actions.ts`.
- General cleanup, formatting or adjacent feature work.

## Acceptance criteria

- [ ] The action inventory accounts for every export in `src/app/actions.ts`.
- [ ] An unauthenticated caller cannot mutate protected data.
- [ ] A rep cannot create, delete, deactivate or reset passwords for reps.
- [ ] A rep cannot assign or change another rep's lead unless an existing explicit policy permits it.
- [ ] An admin retains all intended admin workflows.
- [ ] A rep retains intended workflows for their own assigned/claimed leads.
- [ ] Note and review authors cannot be written as null because authentication was absent.
- [ ] Mock and live branches enforce the same policy.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] Authorization verification evidence covers allowed and denied cases for every policy class.

## Safety gates

- Do not use production credentials during verification.
- Do not change production data.
- If current behavior conflicts with `specs/0001`, stop and report before broadening scope.
- Human approval is required before merge and deployment.

## Handback

Include an action-policy table showing action, required role/ownership, guard used and verification evidence.

