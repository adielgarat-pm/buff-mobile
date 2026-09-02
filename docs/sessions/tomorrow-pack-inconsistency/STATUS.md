# tomorrow-pack-inconsistency — Status

> Updated by Claude Code at every phase exit. Do not hand-edit except to fix drift.

## Phases

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Investigation + SPEC + adversarial review (rev 2) + UI/UX review (rev 3) | _in_progress_ — awaiting Adi | 2026-09-02 | `d455322`, `b5c1347`, rev 3 | n/a (docs only) | — |
| 1 — PackingCard: today dominant / tomorrow collapsible, loading gate, focus-reload, closure styling | _passed_ (code) — **Android/Hat-4 pending** | 2026-09-02 | (this commit) | tsc 0 · jest 1009/1009 (18 new in `PackingCard.test.tsx`) · i18n:check ✅ · `expo export --platform web` ✅ | IN-2026-09-02-01 |
| 2 — ציוד tab hosts PackingCard (shell + title "הציוד שלי" + card copy Q5) | _passed_ (code) — **Android/Hat-4 pending** | 2026-09-02 | (this commit) | tsc 0 · jest green (4 new in `ChildBagPrepScreen.test.tsx`) · i18n:check ✅ · web export ✅ | IN-2026-09-02-01 |
| 3 — i18n hygiene + docs | _passed_ | 2026-09-02 | (this commit) | 21 dead keys removed he+en · i18n:check ✅ · SPEC_SYNC rows applied | — |

## Phase 1 notes
- Emulator/device verification could not run in this remote session (no Android). TESTS.md Phase 1 manual items (both themes, he+en, RTL rail, no `camp.empty` flash) remain for Hat-3/Hat-4 before P2 ships.
- `check:i18n-access` exits 1 on `main` too (ParentRewardsScreen `title_he` lines) — pre-existing, unrelated.
- The load/tap race (IN-2026-09-02-01) was not in the SPEC; fixed in the same chunk because focus-reload widens its window.

## Proposals for Adi's docs (CC does not edit these — SPEC_SYNC rows 5–6)
- **`BUFF_DECISIONS_LOG.md`** — proposed entry: *D-2026-09-02-01 — משטח אריזה אחד לילד: הטאב "ציוד" מארח את `PackingCard` (במקום מסך timetable-only נפרד). היום = בלוק מוכל ובולט, מחר = בלוק שקט מתקפל עם יום-בשבוע; ברירת מחדל לפי מארח (ציוד פתוח, מפקדה מקופל). ללא מונה / "סמן הכל" / "התיק מוכן" — לפי VALUES. כותרת הטאב: "הציוד שלי". גבול ה-paywall לאריזה (D-2026-06-19-01) לא נקבע כאן — פתוח לחבילת מונטיזציה.*
- **`BUFF_GAP_ANALYSIS.md`** — proposed line under child surfaces: *Packing: one surface (`PackingCard`), two hosts (HQ dashboards + ציוד tab); sources = `timetables` + `activities`; check-off shared via AsyncStorage + focus-reload. Android verification pending.*

## Waiting on Adi
- **Decided 2026-09-02 (Adi):** Q1 keep tab · Q3 no persistence · Q4 delete dead keys (Phase 3) · Q9 closure styling now (Phase 1).
- **Decided 2026-09-02 (Adi, "מאשרת" + "תממש הכל כחבילה אחת"):** Q6 per-host default · Q8 weekday + hint · Q2 "הציוד שלי / My gear" · Q5 card subtitle/empty say "היום ומחר" (+ literal "+" dropped from `camp.addMine`, the icon already renders one). Q7 informational.
- **Before merge:** Hat-3/Hat-4 Android pass per TESTS.md (both themes, he+en, RTL rail, no `camp.empty` flash, tick sync between tabs). Apply the two proposals above to your docs if you agree.
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
