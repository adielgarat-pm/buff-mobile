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
 * Host for the smart join link. This is the LANDING domain (buffadhd.com), which:
 *   • on Android with the app installed → Android App Link opens the app directly
 *     (assetlinks.json verifies buffadhd.com → com.buffapp.mobile), or
 *   • otherwise → serves landing-web's /join/:code page, which sniffs the device and
 *     routes to the Play Store (with a referrer carrying the code) or the Web PWA.
 * NOTE: the app PWA itself lives on www.buffadhd.com; the bare apex is the landing.
 */
export const JOIN_LINK_HOST = 'https://buffadhd.com';

/**
 * Build the smart HTTPS join link we put in every invite. One tappable link that
 * works from any messaging app, on any device, installed or not — the device-aware
 * routing happens at JOIN_LINK_HOST/join/:code (App Link, Play Store + referrer, or
 * Web PWA). Replaces the old buff:// deep link, which rendered as dead text in
 * WhatsApp and only worked post-install on Android.
 */
export function buildJoinUrl(code: string): string {
  return `${JOIN_LINK_HOST}/join/${encodeURIComponent(code.toUpperCase())}`;
}

/**
 * Build the buff:// custom-scheme deep link. Still registered in linking.ts and
 * valid as an in-app/native fallback, but NO LONGER used in shared invites — those
 * use buildJoinUrl(). Kept for any caller that needs the raw scheme.
 */
export function buildJoinDeepLink(code: string): string {
  return `buff://join/${encodeURIComponent(code.toUpperCase())}`;
}

/**
 * Parse a `join_CODE` value (Play install referrer or link param) into the 6-char
 * family code, or null. Pure + platform-neutral so it's unit-testable without the
 * native referrer module. Liberal about percent-encoding and trailing utm params:
 * "join_ABC123", "join_ABC123&utm_source=x", and "join%5FABC123" all yield "ABC123";
 * organic/malformed referrers yield null.
 */
export function parseJoinCode(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  let decoded = referrer;
  try {
    decoded = decodeURIComponent(referrer);
  } catch {
    // keep raw if it isn't valid percent-encoding
  }
  const m = decoded.match(/(?:^|[?&])join[_=]([A-Za-z0-9]{6})/);
  return m ? m[1].toUpperCase() : null;
}
