# pkg/pending-lifetime-grants — Roadmap

| Phase | Goal | Stop condition |
|---|---|---|
| 0 | Scaffold session folder, branch from main | Branch + 6 doc files exist, committed |
| 1 | Migration 015 (table + trigger + functions + seed + backfill) applied to live DB | `list_migrations` shows new migration; `pending_lifetime_grants` table exists with RLS; advisors clean; STATUS row added |
| 2 | 6 idempotency SQL cases pass + cohort CSV exported (gitignored) | T1–T6 all green; CSV in place; STATUS row added |
| 3 | Exit deliverables: INTEGRATION_LEARNINGS entry, decision draft, TRACK_5 closing note, PR opened | PR URL returned to Adi; STATUS closeout checklist filled in |

Each phase produces a commit with its STATUS row + any doc updates.
