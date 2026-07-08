# Noa's packing behaviour — Status

Branch: `claude/noaa-behavior-spec-rlymvx` · reported on app **1.7.8 (vc64)** · 2026-07-07

| Phase | Decision | State | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC | diagnosis + D1–D6 | ✅ | (branch) | — | 3 code-anchored root causes (F1 two packing systems · F3 undiscoverable approval · F4 no parent streak mirror) + latent F5. |
| P1 | **D3-A** remove packing approval gate | ✅ | `188cc8e` | tsc 0 · jest 15/15 | `childAddOptions()` always `active`; child add posts directly (all ages), parent still sees it. Approval strip left to drain legacy `proposed` rows. |
| P2 | **D1** bridge timetable gear → HQ card | ✅ | `49713d6` | tsc 0 · jest 34/34 | new `lib/packing/fromTimetable.ts`; PackingCard reads today's timetable gear + activities; `PackingGroup.source` widened. Read-only from `timetables`. |
| P3 | **D2** today + tomorrow in one card | ✅ | `158dff7` | tsc 0 · jest 34/34 | `היום`/`מחר` sections, per-day check-off (date-keyed AsyncStorage via multiGet), per-section calm "מוכנים!". |
| P4 | **D4** name child in preview banner | ✅ | `a4afff7` | tsc 0 · i18n 4/4 | banner reads "👁 {name}'s screen — tap to exit"; explains R2 streak asymmetry. |
| P5 | **D5** age-band threshold | ✅ no-op | — | — | Moot after D3-A: `isTeenAgeGroup` is no longer on any app path (test-only). No number invented; broader Teen-Mode age decision stays FLAG F-2026-05-03-03. |
| Exit | docs + Values | ✅ | (this) | — | STATUS + SPEC update + INTEGRATION_LEARNINGS entry; Values re-checked. |

## Maps to Noa's report
- **R1** "can't find where to approve" → P1 (gate removed; nothing to approve).
- **R3** "in ציוד but not in מפקדה" → P2 (bridge; camp gear now on HQ too).
- **R4** "מפקדה should be today, ציוד is tomorrow" → P3 (both days in one card).
- **R2** "streak at Lia's, not mine" → P4 (banner names the child's screen).

## Non-goals / deferred
- **ChildBagPrep tab consolidation** (D1 option 2 — remove/redirect the separate ציוד tab now that HQ shows today+tomorrow): deferred; touches `ChildTabs` owned by a sibling session. Follow-up decision for Adi. The BagPrep screen also still has a `count/total` progress counter that contradicts the no-counter rule — worth folding into the same cleanup.
- **D6 copy fix** (TimetableScreen "e.g. camp"): now harmless since camp entered in the timetable surfaces on HQ (P2); left as-is.
- **F5 own-device child RLS silent-fail**: not exercised (approval path removed); left for a future own-device-child pass.

## Verification
- **Hat-1:** tsc 0 across repo; full jest suite — see final commit note.
- **Hat-3 (emulator) / Web:** attempted this session — see closing report.
- **Hat-4 (Adi, real device):** confirm on Lia's actual profile — camp shows on HQ under היום/מחר; child "+ הוסף לעצמי" appears immediately (no approval); banner names the child.
