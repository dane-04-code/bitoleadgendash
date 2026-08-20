---
title: Lead Gen - Contact Intelligence UI
status: ready
target_repo: dane-04-code/bitoleadgendash
priority: P1
---

# Build Contract: Make the Best Contact Obvious

## Problem

Hermes already writes role fit, email verification, enrichment provenance and notes, but the lead page presents an undifferentiated contact list. As measured 17 August 2026, only 120/182 contacts had email, 34 were verified and 1 had a phone, so missing data must be presented honestly.

## Outcome

The first contact shown is the most useful person to approach, and the UI explains the evidence without inventing a composite score.

## Binding context

Read `specs/0005-contact-quality.md`, `context/DATA.md`, `context/DESIGN.md`, repository decisions and schema-verification routine before editing.

## P0 requirements

- Verify the live schema and observed `role_fit` distribution before implementation.
- Centralize contact ordering in one documented comparator/query path.
- Order by existing primary status, usable role fit, verified email, any email, then remaining contacts.
- Show verified/unverified email state without relying on color alone.
- Show role fit, quiet provenance and note when present.
- Render phone only when present; never show an empty phone capability.
- Provide explicit states for no email, no contacts and unknown role values.
- Preserve responsive behavior and the existing design system.
- Add/update mock fixtures for every state.

## Non-goals

- Improving upstream contact coverage.
- Calling Apollo from the dashboard.
- A computed contact-quality score.
- Editing contacts or turning the app into a CRM.
- Multi-client branding.

## Acceptance criteria

- [ ] Schema evidence and observed role values are recorded.
- [ ] The best callable contact sorts first under the documented rules.
- [ ] Unexpected role values do not crash or receive fabricated meaning.
- [ ] Verified status is understandable without color.
- [ ] No-email, no-phone and zero-contact states are deliberate.
- [ ] Mock fixtures exercise populated and missing states.
- [ ] Mobile and desktop lead detail remain usable.
- [ ] Build, lint and relevant tests pass.

## Safety gates

No production DDL. Do not mutate contact data. If live fields differ from the spec, stop and report the drift.

