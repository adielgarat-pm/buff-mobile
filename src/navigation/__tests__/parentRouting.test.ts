/**
 * Tests for isParentOnboarded — the predicate RootNavigator uses to route a
 * signed-in parent to their real app (ParentApp) vs. the onboarding stack
 * (Welcome). Guards the 2026-09-23 fix: an existing/onboarded parent must reach
 * the app, NOT be dumped back into onboarding.
 */
import { isParentOnboarded } from '../parentRouting';

describe('isParentOnboarded', () => {
  it('routes an existing/onboarded parent (flag set + has children) to the app', () => {
    expect(isParentOnboarded({ onboardingComplete: true, hasChildren: true })).toBe(true);
  });

  it('keeps a brand-new parent mid-wizard (child created at UStep5, flag not yet set) in onboarding', () => {
    // hasChildren alone must NOT reach the app — this is the window the
    // onboarding_complete gate deliberately protects.
    expect(isParentOnboarded({ onboardingComplete: false, hasChildren: true })).toBe(false);
  });

  it('keeps a parent with the flag but no children in onboarding', () => {
    expect(isParentOnboarded({ onboardingComplete: true, hasChildren: false })).toBe(false);
  });

  it('keeps a fresh parent (no flag, no children) in onboarding', () => {
    expect(isParentOnboarded({ onboardingComplete: false, hasChildren: false })).toBe(false);
  });
});
