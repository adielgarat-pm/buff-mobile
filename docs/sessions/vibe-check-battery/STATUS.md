# pkg/vibe-check-battery — STATUS

> Per-package progress log per CLAUDE.md § Exit Deliverables. Updated by CC at each phase exit.

Replace the Gamer-mode Daily Vibe Check selector with a recharging-battery
metaphor (teens), keep Mint-mode smiley faces as-is (young kids), and restyle
the parent dashboard's child-initiated SOS dot to a low-charge battery glyph.

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| **1: Battery selector + parent SOS restyle** | ✅ _passed_ | 2026-05-28 | `(this commit)` | `tsc --noEmit` clean; `jest` 250/250 green (vibeUtils suite passes); `i18n:check` clean (0 new keys — reused `vibeCheck.a11y.levelN`). Expo-web preview via `__VibeCheckPreviewHarness` attempted but the dev server was unstable (react-native-web is low-fidelity for theme-gated UI — see `pkg/fix-runtime-theme-switch` FLAG); **Android emulator visual sign-off pending Adi.** | IN-2026-05-28-01 |

## Legend

- `_pending_` — not started
- `_in_progress_` — plan approved, CC mid-phase
- `_passed_` — phase done, tests passed
- `_failed_` — tests failed, rework before continuing
- `_blocked_` — waiting on external (Adi review, design, etc.)

## Phase 1 deliverables (this commit)

- ✅ `src/components/BatteryGlyph.tsx` — shared pure-`View` battery (terminal nub + body + bottom-up fill). Optional charging bolt via the already-bundled `@expo/vector-icons` Ionicons (`flash`). No new dependency. Two consumers: VibeBattery + parent SOS indicator.
- ✅ `src/components/VibeBattery.tsx` — 5 recharging-battery cells, charge ramp 1→5, single-tap, **props identical to the removed `VibeBars`** (`{ selectedLevel, onSelect, palette }`). Selected cell = lime fill + glow + charging bolt. Reuses existing `vibeCheck.a11y.levelN` keys.
- ✅ `src/screens/child/VibeCheckScreen.tsx` — `GamerCheckContent` now renders `<VibeBattery/>` (was `<VibeBars/>`); persists `vibe_type='battery'`. Pastel branch (`VibeFaces`) untouched. Header comment + style key updated.
- ✅ `src/utils/vibeUtils.ts` — `VibeType` widened to `'emoji' | 'bars' | 'battery'`. `'bars'` retained for the 0 historical Gamer rows; DB verified to have **no CHECK constraint** on `vibe_type` (only `vibe_level` 1-5), so `'battery'` inserts cleanly with no migration.
- ✅ `src/screens/parent/ParentDashboardScreen.tsx` — the 8px amber SOS dot is now a small low-charge `BatteryGlyph` in the same warm amber (`#F59E0B`, Pillar 2 — not alarming red). Inline text + a11y label unchanged; still renders only on child-initiated SOS (consent model unchanged — no daily energy broadcast to the parent).
- ✅ Removed `src/components/VibeBars.tsx` (grep-confirmed: only consumer was VibeCheckScreen).
- ✅ `tsc --noEmit` clean; `jest` 250/250 green; `i18n:check` clean.

## Values Check (verified against implemented behavior)

**Pillar 1 — Intrinsic Motivation**
1. Would the kid want this without a virtual reward? — Yes; it's a low-friction self-report, no reward attached to any level.
2. Closer to a kid-chosen reward? — Neutral; the selector is unchanged in purpose, only the visual.
3. "I want" vs "I must"? — "I want"; one tap, dismissible, "no wrong answer."

**Pillar 2 — Positive Coaching** *(the sensitive pillar for this change)*
1. Does the wording ever demean/compare/show failure? — No. Copy unchanged ("Pick whichever fits — there's no wrong answer"). **The selected cell glows the SAME lime at every level — no red-low/green-high danger gradient.** A low charge is a valid state, not a failure.
2. On a low pick — empathy or pressure? — Empathy. Level ≤2 routes into the existing Low Power Mode (trimmed list + optional SOS), unchanged.
3. Any "suffering/loss/anger" mechanic? — No. The battery is the kid's own charge self-report, **never a creature to keep alive** (deliberately not the Joon-Doter anti-pattern). Parent indicator stays warm-amber + child-initiated.

**Pillar 3 — Independence-Building**
1. More capable without the app? — Neutral/yes; builds daily self-awareness of energy state.
2. Kid has a voice? — Yes; the kid chooses the level, no one else sets it.
3. Still needed in 6 months? — It's a lightweight daily check, not a dependency mechanic.

**Result: passes all 9.**

## Pending Adi (Android emulator — authoritative for theme-gated UI)

- Open the Daily Vibe Check as a **Gamer-mode** child → expect 5 battery cells (charge ramp), tap one → lime fill + charging bolt + glow on the selected cell, modal dismisses after ~180ms.
- Open as a **Mint-mode** child → expect the 5 smiley faces, unchanged.
- Parent dashboard: with a child-initiated SOS today → expect a small amber low-charge battery (replacing the old dot) next to the child's name + the existing inline line.

## Spec sync flagged (not silently edited — Adi's call)

- `docs/BUFF_BRAND.md` §7 line ~350 lists "energy bars ב-Gamer" as an allowed system-emoji/visual. Now stale (battery, not bars). Proposed wording update pending Adi.
