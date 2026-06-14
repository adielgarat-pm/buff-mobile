# Anchor Recovery — Status

> Live status tracker. Updated by CC at every phase exit in the same commit as the code.

**Package:** `pkg/anchor-recovery`
**Branch:** `pkg/anchor-recovery-impl` (off main) — docs already merged via `pkg/anchor-recovery` PR #63
**Owner:** Adi (PM) + Claude.ai (design) + CC (impl)
**SPEC:** [SPEC.md](./SPEC.md)
**Drafted:** 2026-05-23
**Phase 0 closed:** 2026-05-23
**Phase 1 closed:** 2026-05-23
**Phase 2 closed:** 2026-05-23 (rebuilt after lost p2 branch)
**Phase 3 (meds) built:** 2026-06-14 on `pkg/anchor-recovery-meds-p3` (off `main`, not the stale `-impl`)
**Phase 3 (meds) Hat-3 PASSED:** 2026-06-14 on emulator (real app + live DB)
**Status:** `phase 3 meds done — static gate + Hat-3 functional both green. Vibe-task creation deferred to Phase 4. Ready for PR (pending Adi).`

---

## Phase Progress

| Phase | Title | State | Started | Closed | Commit | Tests | Learnings | Notes |
|---|---|---|---|---|---|---|---|---|
| 0 | Setup + schema verification | ✅ closed | 2026-05-23 | 2026-05-23 | (this commit) | schema OK, no migration | See SPEC § Schema Verified + Decisions Locked | OQ9 = C (Adi-approved); EX-1 = branch `pkg/anchor-recovery-impl`; EX-2 = Vibe-credit separate from INSTANT_BUFF |
| 1 | Inactivity Detector backend | ✅ closed | 2026-05-23 | 2026-05-23 | (this commit) | 7/7 scenarios passed | Spec drift: scan_disengaged_users coexists — both run independently | EX-3/4/5/6 added; migration `anchor_recovery_detector_and_cleanup` applied via MCP |
| 2 | Parent Prompt UI | ✅ closed | 2026-05-23 | 2026-05-23 | (this commit) | rendered with OQ9 copy — CTAs log only (Phase 3) | EX-7: prior pkg/anchor-recovery-p2 branch lost mid-session; rebuilt on pkg/anchor-recovery-ui — commit chunks A then B+C for safety | OQ-P2-1 = a (first-open-of-day) |
| 3 | Auto-create anchor task | 🟢 meds done (Hat-3 ✓) | 2026-06-14 | 2026-06-14 | (this commit) | static + Hat-3 PASS (see below) | PHASE3_PLAN.md; OQ4→smart-default sheet (Adi 2026-06-14); P3-1/2/3; OQ7 stem-fix | MedReminderSheet.tsx + dashboard wiring + OQ7. Vibe-task creation deferred to P4. |
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

## Phase 3 — Hat-3 functional results (2026-06-14)

Run on the Pixel emulator against the live app + DB (account: ReminderTest / child Maya).
A bug found mid-test was fixed (OQ7 Hebrew stem `תרופ`), commit `03b07f0`.

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 1 | Anchor modal opens with meds CTA when kid has no meds task | ✅ | CTA "Add medication reminder" rendered for Maya |
| 2 | Meds CTA opens MedReminderSheet | ✅ | sheet: title, subtitle(name), morning 07:30, days all-7, privacy line, child preview |
| 3 | Native time picker opens | ✅ | DateTimePicker showed 07:30 / OK / CANCEL |
| 4 | Evening dose toggle adds 2nd dose | ✅ | "Evening (before bed)" row + 20:00 default appeared |
| 5 | Save creates one task per dose (OQ6 shape) | ✅ | DB: 2 rows — `self-care`, 5 credits, `is_system_generated=true`, `schedule_days [0–6]`, 💊, times 07:30 + 20:00 |
| 6 | Prompt resolved on save | ✅ | seeded notification flipped `is_read=true` |
| 7 | Confirmation toast | ✅ | "Medication reminder added for Maya · edit anytime in Tasks" |
| 8 | OQ7 hides CTA when standalone meds exists | ✅ | dashboard query (run against real data) flags both meds tasks as standalone → `showMedsFor=false`; show-path also confirmed on-device. Modal re-open on-device skipped (shown-today AsyncStorage gate can't be cleared without logout / shared-emulator clock change). |
| 9 | OQ7 heuristic unit cases | ✅ | 8/8 (incl. construct-form `תרופת` + bundled-meal exclusion) |

Test data created (2 tasks + 1 notification) was deleted afterward; family restored to original state.

---

## Open Questions — All Locked (Phase 0)

| OQ | Question | Adi decision | Status |
|---|---|---|---|
| 1 | Inactivity threshold | 5 days | ✅ locked |
| 2 | Notification mechanism | in-app only (v1) | ✅ locked |
| 3 | Re-fire cadence after dismiss | 7 days | ✅ locked |
| 4 | Auto-add vs confirm | auto-add + toast w/ edit link | ✅ locked |
| 5 | Vibe credit amount + cap | 5 BUFFs, cap 1/day, separate from INSTANT_BUFF | ✅ locked |
| 6 | Default time + credits for meds anchor | 07:30, 5 BUFFs, standalone | ✅ locked |
| 7 | "Standalone meds" detection heuristic | `תרופה` AND NOT (`ארוחת`/`בוקר`/`ערב`) | ✅ locked |
| 8 | Multi-kid families | per-kid trigger | ✅ locked |
| 9 | **Copy approval (Pillar 2 critical)** | **Option C — "כולנו צריכים התחלה חדשה לפעמים…"** | ✅ **Adi-approved** |
| EX-1 | Branch name | `pkg/anchor-recovery-impl` | ✅ locked |
| EX-2 | Vibe-credit code path | separate from `INSTANT_BUFF_AMOUNT` (Phase 4) | ✅ locked |

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

- **Branching history:** SPEC + 5 supporting files were authored on `pkg/yesterday-recap` (current branch as of 2026-05-23 draft), then moved to `pkg/anchor-recovery` and merged to `main` via PR #63 (commit `eb47c38`). Implementation continues on **`pkg/anchor-recovery-impl`** off main (EX-1) — verify-before-delete authorization for old branch deferred per CLAUDE.md protocol.
- **Data context:** All findings backed by 2026-05-23 research session. Lovable JSON exports stored at `C:\Users\adiel\buff-mobile-data\lovable-exports\`. Supabase MCP queries reproducible via memory file `reference_lovable_user_data_location.md`.
- **Co-dependent packages:** This package is independent but builds atop `pkg/daily-vibe-check` (shipped). If `pkg/fcm-push-notifications` ships first, v1.1 of this package can add push.
