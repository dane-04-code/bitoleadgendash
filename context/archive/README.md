# Archive

Superseded planning documents. **History only — never plan from anything in here.**

Do not edit these files. If something in one is still true, it belongs in a live
context file instead, and the archived copy stays as it was written.

| File | Superseded by | Date archived |
|---|---|---|
| `V2_PLAN.md` | `context/ROADMAP.md`, with its live-database figures moved to `context/DATA.md` and its decisions to `context/DECISIONS.md` | 2026-08-17 |

## Why `V2_PLAN.md` was retired

It was doing four jobs at once — roadmap, database measurement log, security
incident record, and open-questions list — and each of them decayed on a different
schedule. The measurements went stale fastest: by 2026-08-17 it reported lead
ingestion as possibly paused, when the newest lead had in fact been created that
morning at 04:28 UTC.

The four jobs now live in four files, each with an explicit "last verified" date and
an owner rule for keeping it current (`context/ROADMAP.md` §7).

Its substance was carried forward in full. Nothing was dropped:

- Workstreams A/B/C/D → `ROADMAP.md` §2 Now and §3 Next, re-measured and re-ranked.
- §1 live numbers and §2 schema drift → `DATA.md`, re-measured 2026-08-17.
- §6 security history → `DECISIONS.md` (2026-08-15) and `ARCHITECTURE.md` §5.
- §7 open questions → `ROADMAP.md` §5, with four of them closed by Dane on
  2026-08-17 and recorded in `DECISIONS.md`.
