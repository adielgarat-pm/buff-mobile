# pkg/color-consolidation

**Status:** Implemented (CC), pending Adi emulator sign-off + PR merge.

## Goal

Fix the jarring light↔dark↔light colour journey across the app. Establish ONE
coherent system:

- **LIGHT** is the default for the entire **parent + onboarding + auth + young-kid**
  experience (Pastel `#F4F0FA` / Parent `#FAFAFA`).
- **DARK** (`#1a1636` warm deep-violet) is reserved **EXCLUSIVELY for the TEEN
  Gamer in-app mode**.

UX grounding: dual-persona apps (Joon) keep the parent UI functional + light and
the child UI gamified. Dark = "gaming generation" signal → teens only. Onboarding
targets parents → light.

## Source of truth

`docs/BUFF_BRAND.md` §7.2 (master palette) and §7.4–§7.6 (mode layers).
NOTE: the originally-referenced `COLOR_PLAN.md` was not present in the repo; this
package executed against BUFF_BRAND §7 + the locked decisions below.

## Locked decisions

- ChildJoin screen goes LIGHT for everyone (kid's age unknown at join time).
- Keep the Teen Gamer in-app mode dark.
- `#7C3AED` (violet-accent) primary buttons preserved across migrated screens.

## Files

- `STATUS.md` — per-phase progress, deliverables, contrast review, Values Check.
- Token source: `src/theme/palette.ts`, `src/theme/modes.ts`.
