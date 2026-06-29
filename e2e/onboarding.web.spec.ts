/**
 * BUFF onboarding — Web (Expo Web PWA) E2E.
 *
 * Prerequisites (see e2e/README.md):
 *   - A built web app served at BUFF_WEB_URL (default: local ./dist on :8099).
 *   - BUFF_STORAGE_STATE pointing at a saved session for a FRESH, never-onboarded
 *     parent (so the app lands on onboarding Step 1 / branch 5). Onboarding writes
 *     to Supabase, so the backend must be reachable from the runner.
 *
 * Selectors are testIDs (data-testid on web) — language-independent.
 */
import { test, expect } from '@playwright/test';
import {
  TID, t, completeStep1, completeStep2, completeStep3, completeStep4,
} from './onboarding.helpers';

// Age group → a valid goal/challenge id from OPTIONS_BY_AGE (onboardingData.ts).
const AGE = '9-11';
const GOAL = 'morning_routine';
const EXTRA_CHALLENGE = 'homework_focus';

test.describe('BUFF onboarding (web)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('completes the full flow Step 1 → 8', async ({ page }) => {
    await completeStep1(page, { childName: 'Gal', age: AGE });
    await completeStep2(page, GOAL);
    await completeStep3(page, [EXTRA_CHALLENGE]);
    await completeStep4(page, ['gaming', 'social']);

    // Step 5 — preview renders, save resolves, Continue enables.
    await expect(t(page, TID.step5Continue)).toBeVisible({ timeout: 15_000 });
    // The save must NOT error (no retry card).
    await expect(t(page, TID.step5Retry)).toHaveCount(0);
    await t(page, TID.step5Continue).click();

    // Step 7 — phone choice.
    await expect(t(page, TID.phoneNone)).toBeVisible();
    await t(page, TID.phoneNone).click();

    // Step 8 — complete.
    await expect(t(page, TID.completeCta)).toBeVisible({ timeout: 15_000 });
  });

  test('regression: does NOT bounce back to step 1 after the motivators step (Inbal bug)', async ({ page }) => {
    // The original bug: after Step 4 → loading → Step 5 the profile INSERT fired a
    // realtime refetch that remounted the NavigationContainer and reset the flow
    // to Welcome/Step 1. Assert we actually land on Step 5 and stay there.
    await completeStep1(page, { childName: 'Gal', age: AGE });
    await completeStep2(page, GOAL);
    await completeStep3(page, []);
    await completeStep4(page, ['gaming']);

    // Reach Step 5 (preview) — and crucially we are NOT thrown back to Step 1.
    await expect(t(page, TID.step5Continue)).toBeVisible({ timeout: 20_000 });
    // Give the realtime profiles-INSERT a window to (incorrectly) trigger a reset.
    await page.waitForTimeout(4_000);
    await expect(t(page, TID.step5Continue)).toBeVisible();
    await expect(t(page, TID.childName)).toHaveCount(0); // not back on Step 1
  });

  test('regression: a mid-flow browser reload resumes the same step (web persistence)', async ({ page }) => {
    await completeStep1(page, { childName: 'Gal', age: AGE });
    await completeStep2(page, GOAL);
    await completeStep3(page, []);
    // Now on Step 4.
    await expect(t(page, TID.step4Continue)).toBeVisible();

    await page.reload();

    // Should resume on Step 4 — NOT reset to Step 1 / Welcome.
    await expect(t(page, TID.step4Continue)).toBeVisible({ timeout: 20_000 });
    await expect(t(page, TID.childName)).toHaveCount(0);
  });

  test('caps motivator selection at 2', async ({ page }) => {
    await completeStep1(page, { childName: 'Gal', age: AGE });
    await completeStep2(page, GOAL);
    await completeStep3(page, []);

    await t(page, TID.motivator('gaming')).click();
    await t(page, TID.motivator('social')).click();
    // A third is capped — its card is marked disabled (accessibilityState.disabled
    // → aria-disabled on web) and selecting it does not check it.
    const third = t(page, TID.motivator('creative'));
    await expect(third).toHaveAttribute('aria-disabled', 'true');
    await third.click({ force: true }).catch(() => {});
    await expect(third).not.toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('BUFF onboarding (web) — Hebrew RTL', () => {
  // Seed the persisted language to Hebrew BEFORE the app boots. On web,
  // @react-native-async-storage maps to localStorage; STORAGE_KEY is 'buff_language'.
  // (If a future async-storage version prefixes keys, update this seed — see README.)
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { window.localStorage.setItem('buff_language', 'he'); } catch { /* ignore */ }
    });
    await page.goto('/');
  });

  test('renders right-to-left (back chevron points the RTL way)', async ({ page }) => {
    // Our RTL fix flips the back chevron to '›' in RTL (vs '‹' in LTR).
    await expect(t(page, TID.back)).toBeVisible({ timeout: 30_000 });
    await expect(t(page, TID.back)).toHaveText('›');
  });
});
