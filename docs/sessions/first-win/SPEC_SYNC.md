# First Win — Spec Sync

> Canonical docs this package changes, mapped to the chunk that touches each. Updated in the same commit as the chunk's code.

| Doc | Chunk | Change |
|---|---|---|
| `docs/sessions/first-win/STATUS.md` | every chunk | Phase row (state, date, commit, tests, learnings) |
| `docs/INTEGRATION_LEARNINGS.md` | every chunk (if surprises) + C1 | Baseline-metric discrepancy (32% vs ~10%) and the first-win metric definition; any deferred scope as a 🚩 flag |
| `docs/research/VALUE_VALIDATION_2026-09.md` | C1 | Append-only pointer: §8 lever → package `first-win`, baseline table |
| `docs/sessions/child-access-paths/STATUS.md` | C4 | Mark "Chunk 4 — day-1 reminder" as superseded by first-win C4 (server-side 24h nudge) |
| `docs/sessions/notifications-hardening/SPEC.md` (event × channel matrix) | C4 | `activation_nudge` early window 20–44h + seed-row fix + router target |
| `docs/sessions/onboarding-redesign/SPEC.md` | C2 | UStep6 behavior contract: parent-tap seed replaced by real handoff into View-as-Child |
| `docs/MASTER_TEST_PLAYBOOK.md` | C2, C3, C4 | New scenarios: together-handoff, first-mission card, early nudge tap |
| `docs/BUFF_DECISIONS_LOG.md` | — | **Adi's doc.** CC proposes entries (metric definition, seed removal, nudge window); Adi writes |
| `docs/BUFF_GAP_ANALYSIS.md` | — | **Adi's doc.** Proposed only |

## Out of scope

- `docs/BUFF_VALUES.md`: no change to principles.
- `docs/BUFF_BUDDY_SYSTEM.md`: BUDDY celebration reused as-is.
- Email lifecycle docs: no email sender in this package.

## Verification

- [ ] Each chunk's PR includes its rows above
- [ ] TESTS.md "doc updated per SPEC_SYNC" checked per chunk
