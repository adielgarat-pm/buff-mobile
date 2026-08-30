# theme-age-decouple — STATUS

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC | ✅ drafted + decisions locked | 2026-08-30 | 2e089fe | n/a | Q1–Q4 resolved with Adi; Itay approved junior gating |
| Phase 1 — junior gating | ✅ code complete (pending Hat-4 device verify) | 2026-08-30 | _(this commit)_ | 948 jest + typecheck green | Gamer HQ list + Stats tab now age-gated, both skins |

## Phase 1 — what shipped
- **New shared layer** (per IN-2026-07-06-01 — behavior in a hook, not the screen):
  - `src/lib/experienceBand.ts` — `experienceBandFor(ageGroup, skin)` → `'junior' | 'teen'`,
    reusing `isTeenAgeGroup`. Q3 fallback: missing age → skin bridge (`gamer→teen`, `mint→junior`).
  - `src/hooks/useExperienceBand.ts` — resolves the active child's band; prefers the
    **previewed** child's age in view-as-child (shared-device reality).
- `src/contexts/ModeContext.tsx` — now fetches + exposes `previewChildAgeGroup` on preview entry.
- `src/screens/child/GamerDashboardScreen.tsx` — inline task list + time-of-day chips render
  only for `band === 'teen'`. Junior on the Gamer skin keeps the dark summary HQ (stats, fuel,
  BUFFs, Catch, buddy), no list. Their tasks live on the Quests tab (single completion path).
- `src/navigation/ChildTabs.tsx` — Stats (סטטים) tab visibility switched from `isGamer` to
  `isTeenBand`. Stable-reference `HIDDEN_TAB_OPTIONS` pattern preserved.

## Tests
- `src/lib/__tests__/experienceBand.test.ts` — new (4): age→depth matrix + Q3 fallback.
- `src/screens/child/__tests__/GamerDashboardScreen.test.tsx` — +2 (junior hides list/chips;
  teen still renders), existing 14 preserved via a default-`teen` band mock.
- Full suite: **948 passed / 108 suites**, `tsc --noEmit` clean.

## Platform parity (Android + Web)
Pure TS/logic + conditional render — no native modules, no platform-split needed; valid on
both bundles by construction. Visual confirmation on Android emulator + Web is a Hat-4 item
below.

## Left for Adi (Hat-4 / product)
- Visual verify on Android + Web: a **junior on the Gamer skin** shows the dark summary HQ
  with **no** task list and **no** Stats tab; a **teen** is unchanged on both skins.
- Confirm a real family-code (no-age) child behaves as intended under the Q3 bridge.
- Spec Sync at close (per SPEC_SYNC.md): PRD reconciliation wording is Adi's edit.

## Not in this package
- Phase 2 (Mint-skin teens get inline list + chips + Stats) — separate follow-up.
- Teen age-threshold change (12 vs 13 / 13-17) — separate flag.
