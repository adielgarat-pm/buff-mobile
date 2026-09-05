# tomorrow-pack-inconsistency — Status

> Updated by Claude Code at every phase exit. Do not hand-edit except to fix drift.

## Phases

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Investigation + SPEC + adversarial review (rev 2) + UI/UX review (rev 3) | _in_progress_ — awaiting Adi | 2026-09-02 | `d455322`, `b5c1347`, rev 3 | n/a (docs only) | — |
| 1 — PackingCard: today dominant / tomorrow collapsible, loading gate, focus-reload, closure styling | _passed_ (code + **Android Hat-3 ✅ 2026-09-05**) — Hat-4 pending | 2026-09-02 / Hat-3 2026-09-05 | `a1e6466` | tsc 0 · jest 1013/1013 (18 new in `PackingCard.test.tsx`) · i18n:check ✅ · `expo export --platform web` ✅ · **Android emulator (Pixel_7)** ✅ | IN-2026-09-02-01 |
| 2 — ציוד tab hosts PackingCard (shell + title "הציוד שלי" + card copy Q5) | _passed_ (code + **Android Hat-3 ✅ 2026-09-05**) — Hat-4 pending | 2026-09-02 / Hat-3 2026-09-05 | `a1e6466` | tsc 0 · jest green (4 new in `ChildBagPrepScreen.test.tsx`) · i18n:check ✅ · web export ✅ · **Android emulator (Pixel_7)** ✅ | IN-2026-09-02-01 |
| 3 — i18n hygiene + docs | _passed_ | 2026-09-02 | (this commit) | 21 dead keys removed he+en · i18n:check ✅ · SPEC_SYNC rows applied | — |

## Hat-3 Android verification (2026-09-05, Pixel_7 emulator)
Test child **Leia** (empty school timetable) reproduces Noa's case: 1 club Sat (today = Day camp) + 3 clubs Sun (tomorrow = Pool day / Day camp / Overnight camp, each with gear), created through the app (parent Activities screen — no SQL). Viewed via parent's View-as-Child.

| Check | Result | Evidence |
|---|---|---|
| ציוד tab: today block (pill + rail) then "מחר · יום ראשון" **expanded** listing the 3 clubs; **NO "מחר יום חופש"** (the original bug) | ✅ PASS | `gear_tab.png` |
| HQ card: "מחר" **collapsed** to one ~44px row (weekday + first-club hint + chevron); tap → expands to the 3 clubs | ✅ PASS | `child_hq2.png`, `hq_tomorrow_pool.png` |
| Tick an item on ציוד → switch to HQ → same item ticked **without relaunch** (focus-reload) | ✅ PASS | `gear_ticked.png` → `hq_after_tick.png` |
| Kill + relaunch → ticks persist on both hosts (AsyncStorage) | ✅ PASS | `persist_gear3.png` (fresh HQ mount also re-shows collapsed default) |
| Mint theme (light) — pill + accent rail, real Ionicons (book/sun/moon/water-drop/ellipse/checkmark/chevron/bag/add) | ✅ PASS | `gear_tab.png` |
| Gamer theme (dark) — dark card, muted "מחר" pill legible, white text, cyan accent, tomorrow clubs render | ✅ PASS | `gamer_card_top.png`, `gamer_hq_card.png` |
| RTL (he): T.accent rail flips to reading-start = **right**; pill/checkboxes mirrored; tick preserved | ✅ PASS | `he_child_hq.png` |
| Q2 title "My gear" / "הציוד שלי"; Q5 subtitle "…today and tomorrow…"; no counter/"mark all"/day-off | ✅ PASS | all shots |
| No `camp.empty` flash on load (loading gate) | ✅ PASS (not observed across many cold loads) | — |

Notes / caveats:
- Metro can't bundle from a `.claude/worktrees/*` path (`metro.config.js` blocklists `.claude`). Ran from a sibling worktree `C:/Users/adiel/buff-wt-tomorrowpack` (detached at `a1e6466`) with a real `npm ci`. See [[reference_web_verify_sibling_worktree]].
- Child-surface **Hebrew strings** don't render for the test children because all three have Latin display names → `resolveChildLang` name-script lock returns 'en' (pre-existing, out of scope: `project_child_language_latin_name_trap`). The RTL **layout** (rail-on-right) is what changes per-language in this feature and it is verified; the Hebrew string values are covered by `i18n:check` + jest.
- Gamer today-block accent-rail not captured in a dedicated shot (test child's *today* was empty on Gamer); the rail is verified in Mint (LTR + RTL flip) and is identical token-driven code (`borderStartColor: T.accent`).

## Phase 1 notes
- Emulator/device verification could not run in the original remote session (no Android); Hat-3 completed on-device 2026-09-05 (see table above). Remaining: Hat-4 (Adi's final visual sign-off on a real device).
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
