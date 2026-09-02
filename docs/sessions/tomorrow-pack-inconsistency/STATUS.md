# tomorrow-pack-inconsistency — Status

> Updated by Claude Code at every phase exit. Do not hand-edit except to fix drift.

## Phases

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Investigation + SPEC + adversarial review (rev 2) + UI/UX review (rev 3) | _in_progress_ — awaiting Adi | 2026-09-02 | `d455322`, `b5c1347`, rev 3 | n/a (docs only) | — |
| 1 — PackingCard: today dominant / tomorrow collapsible | _pending_ | — | — | — | — |
| 2 — ציוד tab hosts PackingCard | _pending_ | — | — | — | — |
| 3 — i18n hygiene + docs | _pending_ | — | — | — | — |

## Waiting on Adi
- **Decided 2026-09-02 (Adi):** Q1 keep tab · Q3 no persistence · Q4 delete dead keys (Phase 3) · Q9 closure styling now (Phase 1).
- **Still open:** **Q6** (tomorrow default: per-host recommended) — answer before Phase 1 ships; **Q2 + Q5** (tab title / card subtitle) — block chunk 2b only; **Q8** (weekday + first-group hint in the tomorrow header) — answer before Phase 1 ships; Q7 (paywall boundary) informational.
- `approved, proceed` for Phase 1.

## Legend
`_pending_` not started · `_in_progress_` plan approved, CC working · `_passed_` tests green · `_failed_` rework needed · `_blocked_` waiting on external

## Closeout
- [ ] All phases passed
- [ ] INTEGRATION_LEARNINGS.md updated
- [ ] Canonical docs synced per SPEC_SYNC.md
- [ ] Sentry pre/post check recorded
- [ ] Git tag `pkg/tomorrow-pack-inconsistency/v1`
- [ ] PR to main merged by Adi; branch deleted per Verify-Before-Delete
