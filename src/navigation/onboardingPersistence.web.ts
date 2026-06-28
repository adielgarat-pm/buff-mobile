/**
 * onboardingPersistence (web) — persist the in-progress onboarding flow so a
 * manual browser reload resumes where the parent left off instead of dumping
 * them back at step 1.
 *
 * Why this exists: onboarding data is threaded screen-to-screen via route params
 * only (no parallel store), and those params live solely in in-memory nav state.
 * A web reload rebuilds nav state from scratch → progress lost. This module
 * snapshots {route, params, t} to localStorage (via AsyncStorage) and restores
 * it on the next mount. Native uses the no-op split — see onboardingPersistence.ts.
 *
 * Safety: TTL-bounded (an abandoned flow from earlier doesn't trap a returning
 * user), cleared on sign-out/account-deletion (no cross-user leak on a shared
 * browser), and RootNavigator only applies the snapshot when the recomputed
 * branch is the not-yet-onboarded-parent branch.
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
    // route / corrupt payload causing an initialState crash).
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
 *  times; coalesce to ~one localStorage write per step. */
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
