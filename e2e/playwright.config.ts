/**
 * Playwright config for BUFF web (Expo Web PWA) onboarding E2E.
 *
 * Run:
 *   npm i -D @playwright/test        # one-time (browsers are pre-provisioned in CI)
 *   npm run build:web                # produces ./dist
 *   npx playwright test --config e2e/playwright.config.ts
 *
 * Target:
 *   - Default: serves the local ./dist build on http://localhost:8099 (the
 *     webServer block below), so the suite is self-contained for a built app.
 *   - Remote: set BUFF_WEB_URL=https://buffadhd.com to run against the live site
 *     (the local webServer is then skipped).
 *
 * Auth: onboarding is gated behind an authenticated parent. Provide a saved
 * Playwright storageState via BUFF_STORAGE_STATE (see e2e/README.md → "Auth").
 * The happy-path/first-onboarding specs require a FRESH, never-onboarded parent
 * (per MASTER_TEST_PLAYBOOK §"never reuse parent-fresh-N").
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL   = process.env.BUFF_WEB_URL ?? 'http://localhost:8099';
const IS_LOCAL   = BASE_URL.includes('localhost');
const STORAGE    = process.env.BUFF_STORAGE_STATE; // path to a saved session, optional

export default defineConfig({
  testDir: __dirname,
  testMatch: '**/*.web.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e/.report', open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    // Mobile-first PWA — match the phone-width column the app constrains to.
    ...devices['Pixel 7'],
    headless: true,
    ignoreHTTPSErrors: true,
    storageState: STORAGE,            // undefined → fresh context (unauthenticated)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Self-serve the built web bundle locally so the suite needs no extra steps.
  // Skipped automatically when pointing at a remote BUFF_WEB_URL.
  webServer: IS_LOCAL
    ? {
        command: 'python3 -m http.server 8099 --directory dist',
        url: 'http://localhost:8099',
        reuseExistingServer: true,
        timeout: 30_000,
      }
    : undefined,

  projects: [
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
});
