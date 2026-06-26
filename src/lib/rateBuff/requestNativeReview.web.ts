/**
 * requestNativeReview (web no-op) — platform-split twin.
 *
 * The web bundle has no OS in-app review card. Metro resolves this file for
 * Expo Web; it always returns false so the dashboard keeps the in-house install/
 * rate banner + RateBuffSheet (which writes to our first-party `reviews` table —
 * the compliant high-intent action on web). expo-store-review is never imported
 * into the web bundle.
 */
export async function requestNativeReview(): Promise<boolean> {
  return false;
}
