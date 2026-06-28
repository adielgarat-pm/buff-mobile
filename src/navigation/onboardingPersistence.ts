/**
 * onboardingPersistence (native / default) — NO-OP.
 *
 * The native Android/iOS apps are separate from the Web PWA and do NOT reload
 * mid-session, so there is nothing to persist. Every export here is a deliberate
 * no-op; the real implementation lives in `onboardingPersistence.web.ts` and is
 * selected automatically by Metro's platform resolution on web only.
 *
 * `ONBOARDING_PERSISTENCE_ENABLED = false` keeps RootNavigator's native code
 * path byte-for-byte identical to before this feature.
 */
import type { OnboardingSnapshot } from './onboardingRoutes';

export const ONBOARDING_PERSISTENCE_ENABLED = false;

export async function loadOnboardingSnapshot(): Promise<OnboardingSnapshot | null> {
  return null;
}

export function saveOnboardingSnapshot(_snap: OnboardingSnapshot): void {
  /* no-op on native */
}

export async function clearOnboardingSnapshot(): Promise<void> {
  /* no-op on native */
}
