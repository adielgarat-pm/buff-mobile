/**
 * requestNativeReview (native: Android + iOS) — fire the OS in-app review card.
 *
 * Wraps expo-store-review, which calls the Play In-App Review API on Android and
 * SKStoreReviewController on iOS. Both stores forbid gating this behind a
 * sentiment question or a CTA button (Google: "shouldn't ask the user any
 * questions before… presenting the rating card"; Apple treats a happy-only
 * funnel as review manipulation). So this is fired UNCONDITIONALLY on a positive
 * moment once the retention gate (rateEligibility) passes — no stars, no "do you
 * like the app?" in front of it.
 *
 * The OS owns whether the card actually shows (its own undisclosed ~7–14 day
 * quota): requestReview() resolves either way and we can't observe it. We return
 * true when we successfully *invoked* the native flow, so the caller can start
 * its own cooldown and not re-ask next session.
 *
 * Platform-split contract (CLAUDE.md Parity rule): the web twin is a no-op that
 * returns false, so the dashboard falls back to the in-house banner + sheet.
 */
import * as StoreReview from 'expo-store-review';

export async function requestNativeReview(): Promise<boolean> {
  try {
    // isAvailableAsync → the platform supports the API at all.
    // hasAction → it can actually do something right now (e.g. store URL known).
    const available = await StoreReview.isAvailableAsync();
    if (!available) return false;
    const hasAction = await StoreReview.hasAction();
    if (!hasAction) return false;

    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
