# ROADMAP — pwa-install-nudge

**Branch:** `pkg/pwa-install-nudge` (worktree, based off `main` @ `2bbdac9`)
**Approved:** Adi, 2026-06-20 (`approved, proceed`)
**Rule:** each phase ships chunk-by-chunk — show diff, wait for approval, then continue.

---

## Phase 1 — Nudge Manager + storage (foundation)
The shared single-slot arbitration that both this session and `pkg/rate-us-port` consume (SPEC §3.4).
- `src/lib/nudges/types.ts` — `PassiveNudge` contract.
- `src/lib/nudges/nudgeStorage.ts` (+ `.web.ts`) — persistence split (AsyncStorage native / localStorage web).
- `src/lib/nudges/nudgeManager.ts` — registry + `useActiveNudge()` + priority + global cooldown.
- `src/lib/nudges/__tests__/nudgeManager.test.ts` — jest (one-winner, priority order, global cooldown, care-prompt suppressor).
- **Verify:** jest + typecheck. No UI yet.

## Phase 2 — Install detection hook (platform-split)
- `src/lib/setupPwa.web.ts` — capture `beforeinstallprompt` + `appinstalled` into a module-level holder at boot.
- `src/hooks/useInstallPrompt.web.ts` — detection (`install` / `ios-safari` / `ios-other` / `hidden`) + `isMobile` + `promptInstall()`.
- `src/hooks/useInstallPrompt.ts` — native no-op (`hidden`).
- `src/hooks/__tests__/useInstallPrompt.test.ts` — jest on the detection logic (UA matrix, standalone, deferred-prompt holder).
- **Verify:** jest + typecheck.

## Phase 3 — InstallNudge UI + Settings entry + i18n
- `src/components/install/InstallNudge.tsx` — banner + iOS instruction card (3 steps) + ios-other message.
- Register with the Nudge Manager (`id:'install'`, priority above rate, web+mobile eligibility).
- Settings row in `ParentSettingsScreen.tsx` → opens the device-aware sheet (all web incl. desktop).
- i18n: `install.*` keys in `en.json` + `he.json`. i18n guard test stays green.
- **Verify:** jest + typecheck + `npm run web` + preview tools (banner render, iOS-Safari branch via UA spoof, Settings entry). Android sheet = Hat-4 (Adi).

## Phase 4 — Manifest screenshots (rich Android dialog)
- Add `screenshots` (narrow form factor) to `public/manifest.json` from existing assets (`docs/marketing-screenshots/v1.6.2/`), resized + placed in `public/`.
- **Verify:** manifest validates; Lighthouse/DevTools install dialog shows rich card (web preview).

## Phase 5 — Exit deliverables
- `STATUS.md` row (state, date, commit, tests, learnings link).
- `SPEC_SYNC.md` — canonical docs to touch (parity MATRIX row, FEATURE docs if any).
- `INTEGRATION_LEARNINGS.md` — only if something surprised us.
- Values re-check against implemented behaviour (not just SPEC text).
- Full jest + typecheck green. PR to `main`.

---

## Boundaries (standing)
- No new npm dependency (browser-native only).
- No schema/RLS change.
- Platform parity: every change valid on Android native + Expo Web; native never imports web-only DOM, web never imports native modules.
- `pkg/rate-us-port` consumes the Manager; it writes nothing under `src/lib/nudges/`.
