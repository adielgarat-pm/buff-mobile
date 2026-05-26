/**
 * BUFF runtime configuration — URLs and other constants we need to swap per build.
 *
 * Single source of truth for any link we surface to the user. If a URL moves
 * (e.g., Play Store listing slug, future deep-link host), edit it here once and
 * it propagates through every consumer.
 */
export const BUFF_URLS = {
  /** Public Play Store listing for com.buffapp.mobile. Works for internal-testing,
   *  closed-testing, and public production tracks. Update only if the package id changes. */
  playStoreInstall: 'https://play.google.com/store/apps/details?id=com.buffapp.mobile',
} as const;

/**
 * Build a deep link that opens ChildJoinScreen with the family code pre-filled.
 * The app's `buff://` scheme is registered in app.json; the route `join/:code`
 * is registered in src/navigation/linking.ts.
 *
 * Used in the Step 7 WhatsApp invite so kids land on ChildJoin with the code
 * already populated — they only need to type their name.
 *
 * NOTE: this link only works after the app is installed. The Step 7 message
 * sends BUFF_URLS.playStoreInstall alongside it so the kid can install first.
 */
export function buildJoinDeepLink(code: string): string {
  return `buff://join/${encodeURIComponent(code.toUpperCase())}`;
}
