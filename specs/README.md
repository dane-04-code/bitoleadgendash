# Specs

One file per unit of work. A spec is the contract a diff gets reviewed against, and
in an agentic workflow it is the only thing keeping a controlling agent and a coding
agent pointed at the same target.

---

## Rules

1. **No code without a spec.** If `context/ROADMAP.md` has a Now item, it has a
   spec. If you are asked for something with no spec, write the spec first — it
   takes minutes and it is where you discover the field is empty or the decision is
   unmade.
2. **Numbered, immutable filenames.** `NNNN-short-slug.md`, sequential. Never
   renumber; never reuse a number.
3. **A spec is amended, never quietly outgrown.** If the work turns out different,
   edit the spec and say so in the handback.
4. **Ground every claim about data in a measurement**, with the date. "16 of 104
   leads, measured 2026-08-17" — not "some leads".
5. **State the empty state.** Coverage here is partial by nature. A spec that does
   not say what a user sees when the field is `NULL` is not finished.
6. **State what is out of scope.** The single most useful line in any spec worked on
   autonomously.
7. **One concern per spec.** If it needs two branches, it is two specs.
8. **Mark the status** in the header and keep it current: `draft` → `ready` →
   `in progress` → `shipped` / `blocked` / `dropped`.

## Status meanings

| Status | Meaning |
|---|---|
| `draft` | Being written. Do not build from it. |
| `blocked` | Needs a decision from Dane or an answer from upstream. The blocker is named in the spec. |
| `ready` | Complete and buildable. An agent may pick it up. |
| `in progress` | Someone is on it. Name them and the branch. |
| `shipped` | Landed. Date, and anything that turned out differently than planned. |
| `dropped` | Not doing it. Say why — this is more useful than deleting the file. |

## Index

| # | Spec | Roadmap | Status |
|---|---|---|---|
| 0001 | [Guard every server action](0001-server-action-authorization.md) | N1 | blocked (mock-mode scope decision) |
| 0002 | [Generated types + drift check](0002-generated-types-and-drift-check.md) | N2 | ready |
| 0003 | [Migration reconciliation](0003-migration-reconciliation.md) | N3 | ready |
| 0004 | [`why_is_this_a_lead` as the lead headline](0004-lead-narrative-headline.md) | N4 | ready |
| 0005 | [Contact quality made visible](0005-contact-quality.md) | N5 | ready |
| 0006 | [Honour `do_not_contact`](0006-do-not-contact.md) | N6 | ready |
| 0007 | [Staleness — the going-cold view](0007-staleness.md) | N7 | blocked (decision D1) |

Keep this table current. It is the first thing a controlling agent reads.

---

## Template

Copy this into a new numbered file.

```markdown
# NNNN — <Title>

**Status:** draft
**Roadmap:** <Now/Next item id, e.g. N4>
**Branch:** <once started>
**Owner:** <agent or human>
**Written:** <date> · **Last verified against live DB:** <date>

## Problem

What is wrong today, for whom, in one paragraph. Name the user — admin or rep —
and what it costs them. No solution here.

## Evidence

Measured facts with dates. Row counts, coverage percentages, grep results, file
and line references. This section is what stops a spec being wishful.

## Decision

The chosen approach, in a few sentences. If there were real alternatives, name the
one you rejected and why in a line — it stops the next agent relitigating it.

## Scope

### In
- Concrete, checkable changes. File paths where known.

### Out
- Explicitly not doing. Be generous here.

## Data

| Column | Table | Type | Populated (date) | Notes |
|---|---|---|---|---|

Anything `NULL` everywhere is an upstream request, not a feature — say so.

## Empty and degraded states

What the user sees when the data is missing, partial, or stale. Required.

## Design notes

Tokens, density, which existing component this extends. Non-colour carrier for any
status. Anything new here extends `context/DESIGN.md` and must be regenerated into
it when it ships.

## Acceptance

- [ ] Checkable statements. Behaviour, not implementation.
- [ ] `npm run build` passes.
- [ ] `routines/REVIEW.md` passes with the report block filled in.
- [ ] Mock mode exercised, fixtures updated (one populated, one not).
- [ ] Context files updated: <which>

## Risks

What could break, and the blast radius. Note if it touches `kanban-board.tsx`,
`actions.ts`, `queries.ts`, or auth.

## Open questions

Anything needing Dane or upstream. If this section is non-empty, status is
`blocked`, not `ready`.
```
