/**
 * onboardingPersistence — persist the in-progress onboarding flow so a manual
 * browser reload (web) OR an app process-kill (native) resumes where the parent
 * left off instead of dumping them back at the start.
 *
 * Why this exists: onboarding data is threaded screen-to-screen via route params
 * only (no parallel store), and those params live solely in in-memory nav state.
 * A web reload rebuilds nav state from scratch, and on native the OS can kill a
 * backgrounded app mid-wizard — either way the progress is lost. This module
 * snapshots {route, params, t} to AsyncStorage (localStorage on web, native
 * storage on device) and restores it on the next mount.
 *
 * Not platform-split: AsyncStorage persists across restarts on BOTH platforms,
 * and the "family created, no child" leak is real on native too (pkg/
 * onboarding-draft-and-funnel-telemetry Phase 2 / Shape A). The route list is
 * kept in onboardingRoutes.ts so it can't drift.
 *
 * Safety: TTL-bounded (an abandoned flow from earlier doesn't trap a returning
 * user), cleared on sign-out / account-deletion (no cross-user leak on a shared
 * browser) and when the parent leaves onboarding for the real app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnboardingRoute, type OnboardingSnapshot } from './onboardingRoutes';

const KEY = 'buff_onboarding_nav_v1';
const TTL_MS = 6 * 60 * 60 * 1000; // 6h — long enough to resume the same sitting,
                                   // short enough not to resurrect a day-old flow.
const DEBOUNCE_MS = 400;

export const ONBOARDING_PERSISTENCE_ENABLED = true;

export async function loadOnboardingSnapshot(): Promise<OnboardingSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as OnboardingSnapshot;
    // Validate the route is still an onboarding route (guards against a renamed
    // route / corrupt payload causing a crash downstream).
    if (!snap || !isOnboardingRoute(snap.route)) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    // TTL expiry.
    if (typeof snap.t !== 'number' || Date.now() - snap.t > TTL_MS) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return snap;
  } catch {
    return null;
  }
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: OnboardingSnapshot | null = null;

/** Debounced write — a single screen transition can fire onStateChange several
 *  times; coalesce to ~one storage write per step. */
export function saveOnboardingSnapshot(snap: OnboardingSnapshot): void {
  pending = snap;
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    const toWrite = pending;
    writeTimer = null;
    pending = null;
    if (toWrite) AsyncStorage.setItem(KEY, JSON.stringify(toWrite)).catch(() => {});
  }, DEBOUNCE_MS);
}

export async function clearOnboardingSnapshot(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
    pending = null;
  }
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
