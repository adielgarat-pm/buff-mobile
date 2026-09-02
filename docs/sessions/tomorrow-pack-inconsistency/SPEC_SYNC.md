# tomorrow-pack-inconsistency — Spec Sync

> Canonical docs this package changes, mapped to the phase that touches each. CC updates every listed doc as part of that phase's exit deliverable, in the same commit as the code.

## Docs touched

| Doc | Phase | Nature of change |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | 2 | Line 78 open item "איחוד/הפניה של טאב BagPrep" → **resolved**, pointer to this session. New IN entry: "ChildBagPrep was the pre-bridge fork; consolidation closed R1/L1/L2; orphaned `bagPrep:` AsyncStorage keys are harmless." |
| `docs/MASTER_TEST_PLAYBOOK.md` | 2 | Add the ציוד-tab Noa scenario (TESTS.md Phase 2) next to the existing Packing (#325/#326) row. |
| `docs/sessions/noaa-behavior-spec/STATUS.md` | 2 | § Non-goals / deferred: the "ChildBagPrep tab consolidation" bullet → done here (link). |
| `docs/sessions/schedule-equipment-backpack/SPEC.md` | 3 | Top-of-file note: `ChildBagPrepScreen` description superseded by `tomorrow-pack-inconsistency` (do not rewrite history). |
| `docs/BUFF_GAP_ANALYSIS.md` | 3 | **Proposal only** (Adi's doc): note that child packing is one surface with two hosts. CC writes the proposed line in STATUS.md; Adi applies. |
| `docs/BUFF_DECISIONS_LOG.md` | 3 | **Proposal only** (Adi's doc): D-2026-09-xx — ציוד tab hosts PackingCard; today dominant / tomorrow collapsible; no counter on the tab. CC drafts in STATUS.md; Adi applies. |
| `CLAUDE.md` § Open FLAGs | 3 | No new flag expected. If Q1 (remove tab) is deferred, add 🚩 "ChildBagPrep tab removal — pending Adi". |

## Out of scope (explicitly not changed)

- `docs/BUFF_VALUES.md` — no new value, the package applies existing ones.
- `docs/BUFF_PRD.md` — behaviour is within the existing "packing / gear" description; no product-level change.
- `docs/BUFF_BUDDY_SYSTEM.md` — BUDDY not involved.
- `docs/ARCHITECTURE.md` — no new module; `lib/packing/fromTimetable.ts` already documented by noaa-behavior-spec.

## Verification
- [ ] Each ROADMAP phase includes its doc rows in the same commit
- [ ] TESTS.md methodological checks reference this file
- [ ] After Phase 3: no drift between canonical docs and the running app
