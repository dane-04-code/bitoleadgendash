---
title: Lead Gen - Critical Path Automated Tests
status: ready
target_repo: dane-04-code/bitoleadgendash
priority: P0
---

# Build Contract: Minimum Behavioral Safety Net

## Problem

Build and lint checks prove compilation, not authorization, ownership, status transitions, filtering or graceful handling of partial Hermes data. Autonomous changes can therefore pass CI while breaking important sales workflows.

## Outcome

A small, fast automated suite protects the highest-risk business rules and one end-to-end smoke path without attempting exhaustive coverage.

## P0 coverage

- Authorization policy: unauthenticated, admin, owning rep and non-owning rep cases.
- Lead status transitions used by the UI.
- Archived and do-not-contact leads are excluded or blocked according to product rules.
- Contact ordering handles verified/unverified email, role fit, missing phone and unknown values.
- Mock and live query branches apply equivalent filters using controlled adapters/fixtures.
- One smoke journey: login → dashboard/my work → open lead → permitted action → confirm persisted outcome → logout.

## Requirements

- Choose the smallest test tools compatible with Next.js 14 and the existing project; document the decision.
- Tests must never use production credentials or production URLs.
- Test data must be synthetic and deterministic.
- Tests must fail for meaningful behavioral regressions, not merely snapshot changes.
- Add CI commands for unit/integration tests and build.
- Keep the suite fast enough to run on every PR.

## Non-goals

- Full browser coverage of every screen.
- Visual regression infrastructure.
- Load/performance testing.
- Refactoring production architecture merely to maximize coverage.
- Chasing a percentage coverage target.

## Acceptance criteria

- [ ] One documented command runs the full safe test suite.
- [ ] Tests cannot resolve production credentials/URLs.
- [ ] Each P0 coverage category has at least one positive and one negative/edge case.
- [ ] Deliberately removing an authorization guard causes a test failure.
- [ ] Deliberately dropping the archived filter causes a test failure.
- [ ] CI runs tests and build for pull requests.
- [ ] `npm run build` and `npm run lint` pass.

## Dependency

Coordinate with the authorization PRD. Avoid parallel changes to the same central action code unless branches and ownership are explicitly separated.

