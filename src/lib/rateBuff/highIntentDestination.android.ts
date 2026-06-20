/**
 * High-intent destination (Android) — the Play Store listing.
 *
 * v1 uses a manual deep-link (NOT the native In-App Review API), which keeps the
 * sentiment gate compliant: we offer the link to happy raters but never *block*
 * an unhappy parent from the store (SPEC §4.2). The listing stays reachable.
 */
import type { HighIntentCta } from './highIntentDestination';

const PLAY_LISTING = 'https://play.google.com/store/apps/details?id=com.buffapp.mobile';

export function getHighIntentCta(): HighIntentCta | null {
  return { labelKey: 'rate.storeCtaButton', url: PLAY_LISTING };
}
