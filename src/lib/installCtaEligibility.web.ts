/**
 * installCtaEligibility (web) — persistent show/suppress rules for the
 * entry/post-signup native-install CTA. See SPEC §3.7 / §4.5.
 *
 * These CTAs live OUTSIDE the dashboard nudge slot, so they enforce their own
 * rules here while sharing the nudge manager's global 7-day cooldown (one source
 * of truth — dismissing the dashboard PWA nudge also quiets this CTA and vice
 * versa):
 *   - global 7-day cooldown after ANY install-family nudge is dismissed;
 *   - impression cap of 3 across entry/post-signup;
 *   - post-signup card shows ONCE EVER per browser/account.
 *
 * Fail-open: if storage is unavailable (private browsing, blocked localStorage),
 * eligibility returns true — the CTA is additive, so a degraded environment gets
 * the ask rather than a broken gate.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isInGlobalNudgeCooldown, markNudgeDismissed } from './nudges/nudgeManager';
import type { CtaPlacement } from './installCtaTelemetry.web';

const IMPRESSIONS_KEY = 'install-native:impressions';
const POST_SIGNUP_SHOWN_KEY = 'install-native:postSignupShown';
const MAX_IMPRESSIONS = 3;

async function readCount(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

/** Whether the entry/post-signup CTA may show right now. Fail-open on error. */
export async function isInstallCtaEligible(placement: CtaPlacement): Promise<boolean> {
  try {
    if (await isInGlobalNudgeCooldown()) return false;
    if (placement === 'post-signup') {
      const shown = await AsyncStorage.getItem(POST_SIGNUP_SHOWN_KEY);
      if (shown) return false; // once ever
    }
    return (await readCount(IMPRESSIONS_KEY)) < MAX_IMPRESSIONS;
  } catch {
    return true; // storage unavailable → don't block an additive surface
  }
}

/** Record that the CTA was actually shown (bumps the cap; stamps once-ever). */
export async function recordInstallCtaImpression(placement: CtaPlacement): Promise<void> {
  try {
    const n = await readCount(IMPRESSIONS_KEY);
    await AsyncStorage.setItem(IMPRESSIONS_KEY, String(n + 1));
    if (placement === 'post-signup') {
      await AsyncStorage.setItem(POST_SIGNUP_SHOWN_KEY, String(Date.now()));
    }
  } catch {
    /* best-effort */
  }
}

/** Dismissing the CTA starts the shared global 7-day cooldown. */
export async function recordInstallCtaDismiss(): Promise<void> {
  await markNudgeDismissed();
}
