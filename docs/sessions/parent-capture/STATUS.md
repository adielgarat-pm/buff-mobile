# Parent Capture — STATUS

**Branch:** `pkg/parent-capture` (isolated dev home; `main` stays clean & releasable).
**State:** `Plan Mode — Phase 0 verification done. Build NOT approved (2 gates open).`

| Phase | State | Date | Notes |
|---|---|---|---|
| 0 — Foundation & verification | ✅ done (read-only) | 2026-06-05 | See `PHASE0_FINDINGS.md`. No code, no schema changes. |
| 1 — `parse-capture` Edge Fn | 🧪 **stub built** (real one blocked) | 2026-06-05 | `src/lib/parentCapture/stubParser.ts` stands in for Gemini. 🔒 real fn = Gemini paid-key approval |
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
