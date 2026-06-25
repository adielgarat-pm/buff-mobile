/**
 * High-intent destination — base / fallback (iOS + any non-split platform).
 *
 * The platform-split action (CLAUDE.md Parity rule): unify the *signal*
 * (the parent is a happy 4–5★ rater) and split the *destination*:
 *   - Android (.android) → the Play Store listing.
 *   - Web (.web)         → null; the in-house `reviews` write IS the high-intent
 *                          action (no Google link in v1, decision §2.1).
 *   - iOS / this base    → null. iOS in-app review is deferred: SKStoreReview
 *                          must fire unconditionally on a success event and may
 *                          NOT sit behind the sentiment gate (SPEC §4.2).
 */
export interface HighIntentCta {
  /** i18n key for the button label. */
  labelKey: string;
  /** URL to open via Linking. */
  url: string;
}

export function getHighIntentCta(): HighIntentCta | null {
  return null;
}
