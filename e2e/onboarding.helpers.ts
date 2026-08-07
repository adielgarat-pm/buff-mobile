/**
 * Shared selectors + step walkers for the BUFF onboarding E2E.
 *
 * Selectors use the testIDs added to the onboarding screens. On RN-Web a
 * `testID` renders as `data-testid`, so Playwright's getByTestId resolves them
 * directly and language-independently (works in both English and Hebrew).
 */
import { Page, expect } from '@playwright/test';

/** testIDs — keep in sync with src/screens/onboarding/unified/*. */
export const TID = {
  back:            'onb-back',
  // Step 1 — child profile
  step1Next:       'onb1-next',
  childName:       'onb1-child-name',
  parentName:      'onb1-parent-name',
  age:   (g: string) => `onb1-age-${g}`,
  gender:(v: string) => `onb1-gender-${v}`,
  // Step 2 — goal (single select, auto-advances)
  goal:  (id: string) => `onb2-goal-${id}`,
  // Step 3 — challenges (multi, optional)
  challenge: (id: string) => `onb3-challenge-${id}`,
  step3Next:       'onb3-next',
  // Step 4 — motivators (unlimited picks since PR #439)
  motivator: (id: string) => `onb4-motivator-${id}`,
  step4Continue:   'onb4-continue',
  // Step 5 — preview / save
  step5Continue:   'onb5-continue',
  step5Skip:       'onb5-skip',
  step5Retry:      'onb5-retry',
  step5ContinueAnyway: 'onb5-continue-anyway',
  // Step 7 — phone
  phoneInvite:     'onb7-invite',
  phoneLater:      'onb7-later',
  phoneNone:       'onb7-none',
  // Step 8 — complete
  completeCta:     'onb8-cta',
  refInput:        'onb8-ref-input',
  refApply:        'onb8-ref-apply',
} as const;

export const t = (page: Page, id: string) => page.getByTestId(id);

/** Wait until the app has booted past the launch spinner. */
export async function waitForApp(page: Page) {
  await page.goto('/');
  // The boot gate renders a spinner; onboarding step 1 renders the child-name field.
  await expect(t(page, TID.childName).or(t(page, TID.goal('')).first())).toBeVisible({ timeout: 30_000 })
    .catch(() => { /* fall through — individual tests assert their own first screen */ });
}

/** Step 1 → Step 2. Fills the required fields and advances. */
export async function completeStep1(page: Page, opts: {
  childName?: string; age?: string; parentName?: string; gender?: string;
} = {}) {
  const name = opts.childName ?? 'TestKid';
  const age  = opts.age ?? '9-11';
  await expect(t(page, TID.childName)).toBeVisible();
  // Parent name only appears when the parent's display_name is missing/email-like.
  if (await t(page, TID.parentName).isVisible().catch(() => false)) {
    await t(page, TID.parentName).fill(opts.parentName ?? 'Test Parent');
  }
  await t(page, TID.childName).fill(name);
  await t(page, TID.age(age)).click();
  if (opts.gender) await t(page, TID.gender(opts.gender)).click();
  await expect(t(page, TID.step1Next)).toBeEnabled();
  await t(page, TID.step1Next).click();
}

/** Step 2 — pick the first goal (auto-advances to Step 3). */
export async function completeStep2(page: Page, goalId: string) {
  await expect(t(page, TID.goal(goalId))).toBeVisible();
  await t(page, TID.goal(goalId)).click();
}

/** Step 3 — optional extra challenges, then Next. */
export async function completeStep3(page: Page, challengeIds: string[] = []) {
  await expect(t(page, TID.step3Next)).toBeVisible();
  for (const id of challengeIds) await t(page, TID.challenge(id)).click();
  await t(page, TID.step3Next).click();
}

/** Step 4 — pick motivators (unlimited since PR #439), then Continue. */
export async function completeStep4(page: Page, motivatorIds: string[]) {
  await expect(t(page, TID.step4Continue)).toBeVisible();
  for (const id of motivatorIds) await t(page, TID.motivator(id)).click();
  await expect(t(page, TID.step4Continue)).toBeEnabled();
  await t(page, TID.step4Continue).click();
}
