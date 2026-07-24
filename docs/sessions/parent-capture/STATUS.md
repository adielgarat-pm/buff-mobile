# Parent Capture — STATUS

**Branch:** `pkg/parent-capture` (merged to `main` via PR #276, 2026-06-22). Follow-up: `pkg/parent-capture-gemini-align` (PR #380).
**State:** `BETA LAUNCH approved by Adi 2026-07-21 — FEATURE_PARENT_CAPTURE=true (with in-UI beta disclaimer).`

## 2026-07-24 — capture-fixes-2: assignment UX + clean titles + child day-view (`pkg/capture-fixes-2`)
Adi's day-3 beta feedback (real camp-schedule run, 15 items landed on the wrong child with name-prefixed titles, child saw everything "today at noon"):
- **"Who is this about?"** — optional child chips on the input step; pick becomes the default assignment for every item the AI didn't explicitly match, and is passed as `childHint` to `parse-capture` (v9) to bias matching server-side.
- **Bulk assign** — "assign everything to…" chips on the confirm screen (one tap instead of 15).
- **Clean titles** — prompt rule (title must never contain a child name) + client-side `stripChildNamePrefix` belt. Kid-copy rule enforced.
- **Child day-view** — `isTaskVisibleToday` is now dueDate-aware (dated tasks visible ONLY on their day; before: HQ/dashboards ignored dueDate entirely) + new `TomorrowPreview` strip ("מחר · יום ה'") on both child task screens showing tomorrow's dated tasks (bag prep heads-up). Recurring tasks excluded by design.
- **Smart times** — prompt: bring-items split into "לארוז" (evening before, 19:00) + "לקחת" (event morning, 07:30); dated event with no time → 08:00. Client fallback for dated tasks: 08:00 (was blanket 14:00).
- **Data cleanup (prod, same day):** 15 camp tasks stripped of "לייא: " prefix + the one stray Leia task moved to Emmy.
- Gates: tsc 0 · jest 48/48 (mapping+schedule) · i18n parity ✅ · fs-root-import guard ✅.

## 2026-07-22 — Android file upload broken → fixed (`pkg/capture-fixes`)
- **Bug (Adi report, day 1 of beta):** picking any file/photo on Android showed "Something went wrong while reading" — zero `parse-capture` invocations in Supabase logs (failure was client-side, before the request left the device).
- **Root cause:** Expo SDK 54 moved `readAsStringAsync` to `expo-file-system/legacy`; the root export **throws at runtime**. Both `parseCapture.ts` and `TimetableScreen.tsx` (photo/Excel import, 2 call sites) imported from the root → every Android file read threw immediately. Web unaffected (separate fetch+FileReader path). Text paste unaffected.
- **Fix:** import from `expo-file-system/legacy` in both files. OTA-able (JS-only).
- **Verification:** typecheck 0 errors · jest 98/98 (parentCapture + timetableParser) · **Hat-3 end-to-end on emulator**: Hebrew camp-schedule image (recreation of Adi's real CamScanner file) → picker → Read it → **12 items extracted** with correct dates + bring-lists, auto-assigned to the matched child.
- Emulator-only red herring during testing: low disk (93%) made Android purge the DocumentPicker cache copy between pick and read (ENOENT) — not a product bug.
- **Open (Adi):** feature rename — "לכידה"/"Capture" unclear; candidates: "קריאה חכמה" (recommended), "הוספה חכמה". Separate copy decision, not in this PR.

## 2026-07-21 — Gemini-pattern alignment + beta launch (PR #380)
- `parse-capture` aligned with the `generate-child-insights` posture: JWT auth + family-membership check, `family_is_entitled` gate (402, web free like the AI coach), 30/day family cap server-side (429), key via `x-goog-api-key` header, `created_by` audit. Deployed v7→v8.
- English support: bilingual prompt path (Hebrew prompt kept verbatim; English mirror for non-`he`), client passes `i18n.language`, input `textAlign` follows language.
- Beta disclaimer: "Beta" pill on the dashboard entry card + note line on CaptureScreen (HE+EN, draft copy).
- Web parity: file reads use fetch+FileReader on web (expo-file-system is native-only); web bundle verified building clean.
- Verification: typecheck 0 errors · jest parentCapture 28/28 · i18n parity ✅. Auth-gated UI on real devices = Adi manual check.

| Phase | State | Date | Notes |
|---|---|---|---|
| 0 — Foundation & verification | ✅ done (read-only) | 2026-06-05 | See `PHASE0_FINDINGS.md`. No code, no schema changes. |
| 1 — `parse-capture` Edge Fn | ✅ **deployed + verified** (2026-06-20) | 2026-06-20 | Real Gemini (`gemini-2.5-flash`, paid key in Supabase secret). End-to-end verified on Hebrew text → structured items (date resolution, recurrence, bring-list, no ghosts). Client wired (`parseCapture` replaces stub in `CaptureScreen`). Privacy: only counts logged to `capture_runs`, no raw input. |
| 2 — Schema + RLS + persistence | ✅ **applied** (2026-06-19) | 2026-06-19 | `019_parent_capture.sql` applied: `parent_items` (+`child_name`,`child_task_id`), `capture_runs`, `grade_level`, parent-only RLS, GRANTs verified. `useParentCapture` store swapped AsyncStorage → Supabase (durable + synced). Additive, 0 impact on existing. |
| 3 — CaptureScreen + in-app entry | ✅ **built** (stub, flag-off) | 2026-06-05 | `CaptureScreen.tsx`; paste + image (existing deps, zero new dep) |
| 4 — ConfirmCard | ✅ **built** (stub, flag-off) | 2026-06-05 | `CapturedItemRow.tsx`; owner toggle, confidence, no_match collapse, `category` map in config |
| 5 — Transfer-to-child | ✅ **built** (2026-06-07) | 2026-06-07 | child task/event items → existing `tasks` loop. One-time `due_date` model added (migration 020 **applied**, additive). `isTaskVisibleOn` helper; Values Check PASS. |
| 6 — "This Week" surface | ✅ **built** (stub, flag-off) | 2026-06-05 | `ThisWeekScreen.tsx`; calm pull, time buckets, recency archive, opt-in reminder |
| 7 — Android share target | 🔒 new-dep gate | — | needs `expo-share-intent` + rebuild + Adi approval (in-app capture works without it) |
| 8 — Privacy/consent + i18n | 🟡 i18n done (draft); consent pending | 2026-06-05 | HE+EN keys added (parity ✅, draft→Adi). 🔒 consent copy = privacy posture |
| 9 — Spec sync + tests + PR | 🟡 tests ✅; sync/PR pending | 2026-06-05 | 20 unit tests pass; typecheck 0 errors |

## Built in this session (autonomous, on `pkg/parent-capture`)
- **Feature flag** `FEATURE_PARENT_CAPTURE = false` (`src/config/parentCaptureConfig.ts`) — gates the single dashboard entry; **off in production**.
- **Logic** (pure, tested): `types/parentCapture.ts`, `lib/parentCapture/captureMapping.ts` (dates/buckets/recency/category map), `lib/parentCapture/stubParser.ts` (Gemini stand-in).
- **Store**: `hooks/useParentCapture.ts` — AsyncStorage (swap to Supabase `parent_items` when applied) + `useFamilyChildren` (read-only).
- **UI**: `CaptureScreen` (input→confirm), `CapturedItemRow`, `ThisWeekScreen`, `ParentCaptureEntry` (gated).
- **Nav**: `ParentCapture` + `ParentThisWeek` registered (modal); gated entry on `ParentDashboardScreen`.
- **i18n**: `capture.*` + `thisWeek.*` keys (HE+EN, draft).
- **Migration**: `019_parent_capture.sql` (additive, **not applied**).
- **Tests**: `lib/parentCapture/__tests__/` — 20 pass.
- **Verification**: `npm run typecheck` → 0 errors · `npx jest parentCapture` → 20/20 · `npm run i18n:check` → parity ✅.

## How to try it (on this branch only)
Flip `FEATURE_PARENT_CAPTURE` to `true` in `src/config/parentCaptureConfig.ts`, run the app, open the parent dashboard → "This week" card → Capture. Paste any text or pick a photo → the stub returns a representative item set → confirm → items land in "This Week". **Do not merge with the flag on.**

## Open gates (both Adi's)
1. **Now or V-next?** (focus call — DECISION §7; tester-retention signal informs it)
2. **Gemini paid key + privacy posture** (Phase 0 found a compliant path: paid tier only)
3. *(sub-gate)* **`expo-share-intent` new dependency** — only for the OS share-target (Phase 7)

## Isolation guarantees (per Adi's "build on the side" requirement)
- All work on `pkg/parent-capture`, **never merged to `main` until done** → not on the release path; hotfixes to the test build are fully independent.
- Backend changes **additive-only** (new tables / column / Edge Function) → production code ignores them; zero behavior change.
- The only phase touching production data (`tasks`) is **Transfer-to-child** — built last, behind a feature flag.
- Feature flag (off in production) gates every entry point even after eventual merge.

## Docs in this session
`DECISION.md` · `SPEC.md` · `IMPLEMENTATION_PLAN.md` · `PHASE0_FINDINGS.md` · `STATUS.md`
