# STATUS — root-error-boundary

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 1. Root Sentry error boundary + calm fallback + platform-split restart | ✅ code done, verified Android + Web | 2026-10-15 | _(this branch, `pkg/root-error-boundary`)_ | tsc clean; Jest 1283/1284 (1 known parallel-load flake, ConciergeCallCard, passes alone 6/6); new: RootErrorBoundary 3/3, restartApp.web 2/2; i18n:check, check:no-raw-alert, check:i18n-access clean | Lesson 2026-10-15 |

## What shipped
- `src/components/RootErrorBoundary.tsx` — `Sentry.ErrorBoundary` (tag `boundary: root`) wrapping every provider in `App.tsx`. Reports via `captureException`, so the existing `beforeSend` / `beforeBreadcrumb` PII scrubbing applies unchanged. Fallback is context-free (no auth/mode/theme/language context; strings via the `i18n` instance; dark status bar; button ≥20pt above the safe-area bottom).
- `src/lib/restartApp.ts` / `restartApp.web.ts` — "Try again": web `location.reload()`; native `reloadOnce('error_boundary')` → `DevSettings.reload()` in dev → remount via `resetError`.
- Copy (Option A, approved by Adi 2026-10-15): `errorBoundary.title/body/cta` in en + he.

## Verified
- **Web** (sibling worktree, Expo web): a temporary, uncommitted render throw → fallback filled the screen in Hebrew/RTL → "ננסה שוב" reloaded → healthy Login screen.
- **Android** (Pixel_7 dev client via buff-emulator): same throw → fallback (Hebrew/RTL, dark status bar) → "Try again" → JS reload → healthy role-selection screen.
- **Values Check (implemented behaviour):** no failure counts, no blame, no BUDDY reaction, single user-controlled action, no dependency mechanic — passes all 9.

## NOT verified
- 🚩 Release-build path: `reloadOnce` → `Updates.reloadAsync()` (dev builds take the `DevSettings.reload` branch). Covered by the existing `reloadOnce` tests; real-device check = Hat-4 after the next OTA/build.
- 🚩 A Sentry event actually arriving tagged `boundary: root` (dev builds have no DSN by design). Check the Sentry dashboard after release.
- In dev, RN's LogBox red-box still overlays the fallback (dev-only; dismiss to see it). Release builds show only the fallback.
