# BUFF onboarding E2E

End-to-end tests for the parent onboarding flow (`UStep1 → UStep8`), on **both**
platforms BUFF ships:

| Platform | Runner | File |
|----------|--------|------|
| Web (Expo Web PWA) | Playwright + Chromium | `e2e/onboarding.web.spec.ts` |
| Android (native) | adb / uiautomator (Hat-3) | `e2e/android/onboarding.android.sh` |

Both drive the same elements via **testID** (web `data-testid`, Android
`resource-id`), so selectors are stable and language-independent. The testID map
lives in `e2e/onboarding.helpers.ts` (`TID`).

---

## What the suites cover

- **Full happy path** Step 1 → 8 (profile → goal → challenges → motivators →
  preview/save → phone → complete).
- **Regression — "thrown back to step 1" (Inbal's bug):** after the motivators
  step the flow must land on the preview and stay there, not reset to Welcome.
- **Regression — mid-flow browser reload (web only):** reloading on Step 4 must
  resume on Step 4, not reset (the web nav-state persistence fix). Native does
  not reload, so this case is web-only by design.
- **Unlimited motivator picks (no cap)** — PR #439 removed the old max-2 limit;
  the suite asserts a third+ motivator is never disabled.
- **Reward menu scales with motivators** (`motivators.web.spec.ts`) — a
  self-contained spec that signs up a fresh parent via the email/password UI
  (no pre-captured `storageState` needed), picks all five non-money motivators,
  and asserts the "5 selected" counter + a populated UStep5 reward menu.
- **Hebrew RTL** rendering (web): the back chevron flips to `›`.

---

## Web — how to run

```bash
# 1. one-time: add the test runner (dev dependency — needs approval per CLAUDE.md)
npm i -D @playwright/test

# 2. build the web app (produces ./dist)
npm run build:web

# 3a. run against the local build (the config serves ./dist on :8099 for you)
BUFF_STORAGE_STATE=e2e/.auth/parent.json \
  npx playwright test --config e2e/playwright.config.ts

# 3b. or run against the live site
BUFF_WEB_URL=https://buffadhd.com BUFF_STORAGE_STATE=e2e/.auth/parent.json \
  npx playwright test --config e2e/playwright.config.ts
```

### Auth (required)
Onboarding is gated behind a signed-in parent, and the app uses **Google OAuth**
(not automatable headlessly). Capture a session once and reuse it:

```bash
# Opens a browser; sign in as a FRESH, never-onboarded parent, then close it.
npx playwright open --save-storage=e2e/.auth/parent.json $BUFF_WEB_URL
```

> The happy-path / reset / reload specs need a **fresh, never-onboarded** parent
> (lands on Step 1 / branch 5). Per `docs/MASTER_TEST_PLAYBOOK.md`: never reuse a
> `parent-fresh-N` account for an onboarding run. Re-capture the storage state
> with a new account between full runs, or point the suite at the **add-child**
> entry for a repeatable (already-onboarded) variant.

`e2e/.auth/` is gitignored — sessions never get committed.

### Environment notes
- The Supabase backend and `buffadhd.com` must be reachable from the runner.
  (In the sandboxed Claude environment both are blocked by network policy, so the
  web suite is authored to run in CI / on a dev machine, not in-sandbox.)
- `RTL` seed: the Hebrew test sets `localStorage['buff_language']='he'` before
  boot. If a future `@react-native-async-storage` version key-prefixes entries,
  update the seed in `onboarding.web.spec.ts`.

---

## Android — how to run

```bash
# 1. bring up the one shared emulator + Metro (buff-emulator skill)
source .claude/skills/buff-testing/helpers.sh && metro_acquire

# 2. get the app onto onboarding Step 1 as a fresh parent (Hat-3 setup,
#    MASTER_TEST_PLAYBOOK F3.H1), then:
bash e2e/android/onboarding.android.sh

# when done
metro_release
```

The script taps by `resource-id` (parsed from `uiautomator dump`), asserts the
flow reaches Step 5 without bouncing to Step 1 or showing the save-retry card,
and finishes on Step 8. On failure it screencaps to `e2e/android/fail-*.png`.

`ADB_SERIAL=<serial>` targets a specific device if more than one is attached.

---

## testID reference
See `TID` in `e2e/onboarding.helpers.ts`. Conventions:
`onb-back`, `onb1-child-name`, `onb1-parent-name`, `onb1-age-<group>`,
`onb1-gender-<value>`, `onb1-next`, `onb2-goal-<id>`, `onb3-challenge-<id>`,
`onb3-next`, `onb4-motivator-<id>`, `onb4-continue`, `onb5-continue`,
`onb5-skip`, `onb5-retry`, `onb5-continue-anyway`, `onb7-invite|later|none`,
`onb8-cta`, `onb8-ref-input`, `onb8-ref-apply`.
