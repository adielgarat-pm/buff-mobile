# Anchor Recovery — Status

> Live status tracker. Updated by CC at every phase exit in the same commit as the code.

**Package:** `pkg/anchor-recovery`
**Branch:** `pkg/anchor-recovery` (TBD off main)
**Owner:** Adi (PM) + Claude.ai (design) + CC (impl)
**SPEC:** [SPEC.md](./SPEC.md)
**Drafted:** 2026-05-23
**Status:** `draft — awaiting Adi review of SPEC + answers to OQ1-9`

---

## Phase Progress

| Phase | Title | State | Started | Closed | Commit | Tests | Learnings | Notes |
|---|---|---|---|---|---|---|---|---|
| 0 | Setup + schema verification | ⬜ not-started | — | — | — | — | — | OQ9 (copy) must be approved before this phase closes |
| 1 | Inactivity Detector backend | ⬜ not-started | — | — | — | — | — | Mirrors pg_cron pattern from pkg/buddy-v05-backend |
| 2 | Parent Prompt UI | ⬜ not-started | — | — | — | — | — | Pillar 2 risk on copy — verify Adi-approved text rendered |
| 3 | Auto-create anchor task | ⬜ not-started | — | — | — | — | — | |
| 4 | Vibe Check credit | ⬜ not-started | — | — | — | — | — | Extends existing useDailyVibe hook |
| 5 | ParentTasksScreen template | ⬜ not-started | — | — | — | — | — | Heuristic for "already has standalone meds" |
| 6 | Values Check, i18n, regression, ship | ⬜ not-started | — | — | — | — | — | Git tag + memory update |

### State legend
- ⬜ not-started
- 🟡 in-progress
- ✅ closed (tests passed, exit deliverables done)
- ❌ failed (tests failed; needs Adi decision)
- ⏸ paused (waiting on external decision)

---

## Pre-Phase-0 Open Questions (must close before Phase 0)

| OQ | Question | Adi decision | Status |
|---|---|---|---|
| 1 | Inactivity threshold (3/5/7 days) | — | open |
| 2 | Notification mechanism (in-app / push / both) | — | open |
| 3 | Re-fire cadence after dismiss | — | open |
| 4 | Auto-add vs confirm | — | open |
| 5 | Vibe credit amount + cap | — | open |
| 6 | Default time + credits for meds anchor | — | open |
| 7 | "Standalone meds" detection heuristic | — | open |
| 8 | Multi-kid families: per-kid or per-family | — | open |
| 9 | **Copy approval (Pillar 2 critical)** | — | **open — BLOCKING** |

---

## Closeout Checklist (Phase 6)

- [ ] All phases ✅
- [ ] All TESTS.md scenarios passed (manual + Jest)
- [ ] Values Check passed against final implementation
- [ ] All canonical docs synced per SPEC_SYNC.md
- [ ] INTEGRATION_LEARNINGS.md consolidated
- [ ] No banned strings in code or i18n
- [ ] Memory files updated (`project_buff_anchor_theory.md`, `project_buff_war_non_return.md`, `reference_lovable_user_data_location.md`)
- [ ] BUFF_PRD updated
- [ ] BUFF_GAP_ANALYSIS row added (Adi-authored)
- [ ] PR opened to main
- [ ] PR reviewed + merged (fast-forward)
- [ ] Branch verified (per Verify-Before-Delete protocol)
- [ ] Branch deleted (local + origin)
- [ ] Git tag `pkg/anchor-recovery/v1` created + pushed
- [ ] Beta users notified if relevant (Adi)

---

## Notes

- **Branching note:** SPEC files were authored on `pkg/yesterday-recap` (current branch as of 2026-05-23 draft). They will be moved/cherry-picked to a new `pkg/anchor-recovery` branch before Phase 0 begins.
- **Data context:** All findings backed by 2026-05-23 research session. Lovable JSON exports stored at `C:\Users\adiel\buff-mobile-data\lovable-exports\`. Supabase MCP queries reproducible via memory file `reference_lovable_user_data_location.md`.
- **Co-dependent packages:** This package is independent but builds atop `pkg/daily-vibe-check` (shipped). If `pkg/fcm-push-notifications` ships first, v1.1 of this package can add push.
