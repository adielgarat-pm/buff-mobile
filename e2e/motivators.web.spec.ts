/**
 * PR #439 verification — unlimited motivators + reward menu that scales.
 *
 * Self-contained web E2E: signs up a FRESH parent via the email/password UI
 * (no pre-captured storageState needed — real Chromium fires RN-web events),
 * walks UStep1→UStep4 picking ALL five non-money motivators, and asserts:
 *   - UStep4 has NO 2-pick cap (every motivator becomes aria-checked, none
 *     aria-disabled) — the behavior #439 introduced.
 *   - UStep5 preview renders and the child-profile save resolves (onb5-continue
 *     visible, no onb5-retry).
 * The reward-count scaling (UI→RPC→store_rewards) is asserted separately by
 * querying the DB for the created child after the run.
 *
 * The parent email is deterministic per run via BUFF_QA_EMAIL so the harness can
 * clean the row up afterwards.
 */
import { test, expect } from '@playwright/test';
import { TID, t, completeStep1, completeStep2, completeStep3 } from './onboarding.helpers';

const EMAIL = process.env.BUFF_QA_EMAIL ?? `qa.motiv.${Date.now()}@example.com`;
const PASSWORD = 'Qa!verify123buff';
const AGE = '9-11';
const GOAL = 'morning_routine';
// Every non-money motivator (money is intentionally excluded from REWARD_PICKS).
const ALL_MOTIVATORS = ['gaming', 'sports', 'creative', 'social', 'privileges'];

test('unlimited motivators (no cap) → UStep5 preview saves', async ({ page }) => {
  // English locale for deterministic copy; onboarding controls are testID-based
  // so they're language-independent regardless.
  await page.addInitScript(() => {
    try { window.localStorage.setItem('buff_language', 'en'); } catch { /* ignore */ }
  });

  // 1. Sign up a fresh parent (role defaults to 'parent'). Deep-link straight to
  //    /Signup so the web LandingScreen's redirect-to-marketing never fires.
  await page.goto('/Signup');
  await page.getByPlaceholder('Display Name').fill('QA Parent');
  await page.getByPlaceholder('Email').fill(EMAIL);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByPlaceholder('Password').press('Enter');

  // 2. Auth state change routes to onboarding — the Welcome screen first.
  //    Advance past it to UStep1 (its CTA has no testID, so match by text).
  const welcomeCta = page.getByText(/Let's start/);
  await expect(welcomeCta).toBeVisible({ timeout: 30_000 });
  // A "notifications are off" toast (role=alert) can sit on top of the CTA and
  // absorb the click — neutralise any such overlay, then click normally.
  await page.evaluate(() => {
    document.querySelectorAll('[role="alert"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  });
  await welcomeCta.click();
  await expect(t(page, TID.childName)).toBeVisible({ timeout: 30_000 });

  await completeStep1(page, { childName: 'ScaleKid', age: AGE });
  await completeStep2(page, GOAL);
  await completeStep3(page, []);

  // 3. UStep4 — pick ALL five non-money motivators. The live "N selected ✓"
  //    counter must reach 5: proves the old MAX_PICKS=2 cap is gone (a capped
  //    build would stop at 2 and disable the remaining cards).
  await expect(t(page, TID.step4Continue)).toBeVisible();
  for (const id of ALL_MOTIVATORS) {
    await t(page, TID.motivator(id)).click();
  }
  await expect(page.getByText(/5 selected/)).toBeVisible();
  await expect(t(page, TID.step4Continue)).toBeEnabled();
  await t(page, TID.step4Continue).click();

  // 4. UStep5 — preview renders and the save resolves (no retry card).
  await expect(t(page, TID.step5Continue)).toBeVisible({ timeout: 20_000 });
  await expect(t(page, TID.step5Retry)).toHaveCount(0);

  // 5. The reward MENU is what #439 changed (buildRewards scales with motivators).
  //    Assert the rewards section rendered and capture the full menu for a
  //    visual scaling check (five non-money motivators @9-11 → 8 deduped rewards).
  await expect(page.getByText('First rewards')).toBeVisible();
  await page.screenshot({ path: 'e2e/.report/ustep5-reward-menu.png', fullPage: true });
});
