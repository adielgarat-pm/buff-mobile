/**
 * acquisitionCapture.shared.ts — pure, cross-platform helpers for acquisition
 * attribution (pkg/acquisition-attribution). Imported by both the web and the
 * default/native variant. No side effects, no platform-only modules, so it is
 * safe in either bundle.
 *
 * "Where did this family come from?" We store a normalized channel enum
 * (families.acquisition_source), the raw signal (families.acquisition jsonb),
 * and the device-locale country (families.acquisition_country) — captured once
 * at family_created. Marketing tags + device only; never child PII.
 */
import * as Localization from 'expo-localization';

export type AcquisitionSource =
  | 'organic'    // no utm, no referrer (incl. Play Store search) — the default
  | 'winback'    // win-back email campaign
  | 'guide'      // SEO guide CTA
  | 'fb'         // Facebook / Instagram / Meta
  | 'referral'   // family-invite referral link
  | 'reels'      // Instagram/FB Reels
  | 'reddit'     // Reddit posts / replies
  | 'whatsapp'   // WhatsApp community
  | 'play_ads'   // Google/Play paid acquisition (UAC)
  | 'unknown';   // a utm_source was present but did not map — raw kept for triage

export interface AcquisitionSignal {
  /** Normalized channel enum → families.acquisition_source. */
  source: AcquisitionSource;
  /** Raw context (utm_*, referrer, platform) → families.acquisition jsonb. */
  raw: Record<string, unknown> | null;
  /** ISO-3166 alpha-2 device-locale region → families.acquisition_country. */
  country: string | null;
}

/** sessionStorage key for the web first-touch payload. */
export const ACQUISITION_KEY = 'buff_pending_acquisition';

/**
 * ISO-3166 alpha-2 region from the DEVICE locale (e.g. 'IL', 'US') — device
 * settings, not IP geolocation (children's-app privacy posture). Kept local
 * rather than imported from pushTokens.ts so the web bundle never pulls the
 * native-heavy push module. Null when the device exposes no region.
 */
export function deviceRegion(): string | null {
  try {
    const region = Localization.getLocales()[0]?.regionCode;
    return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Map a utm_source (preferred) or referrer host to the normalized enum.
 * A present-but-unmapped utm_source becomes 'unknown' (the raw value is still
 * stored for triage); absence of any signal is 'organic'.
 */
export function normalizeSource(
  utmSource?: string | null,
  referrer?: string | null
): AcquisitionSource {
  const s = (utmSource ?? '').toLowerCase().trim();
  if (s) {
    if (['fb', 'facebook', 'ig', 'instagram', 'meta'].includes(s)) return 'fb';
    if (['winback', 'win-back', 'win_back'].includes(s)) return 'winback';
    if (['guide', 'guides', 'seo'].includes(s)) return 'guide';
    if (['reels', 'reel'].includes(s)) return 'reels';
    if (['reddit'].includes(s)) return 'reddit';
    if (['whatsapp', 'wa', 'community'].includes(s)) return 'whatsapp';
    if (['referral', 'ref', 'invite'].includes(s)) return 'referral';
    if (['play_ads', 'uac', 'googleads', 'google-ads', 'gads'].includes(s)) return 'play_ads';
    return 'unknown';
  }
  const r = (referrer ?? '').toLowerCase();
  if (r && /facebook\.com|fb\.com|instagram\.com/.test(r)) return 'fb';
  if (r && /reddit\.com|redd\.it/.test(r)) return 'reddit';
  if (r && /whatsapp\.com|wa\.me/.test(r)) return 'whatsapp';
  // Any other external referrer with no utm, or nothing at all → organic inbound.
  return 'organic';
}
