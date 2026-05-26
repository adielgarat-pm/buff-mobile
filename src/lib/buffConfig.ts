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
