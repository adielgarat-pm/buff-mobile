/**
 * acquisitionCapture.web.ts — web first-touch acquisition capture.
 *
 * On the very first page load we read utm_* params + document.referrer (before
 * React Navigation can strip the query string) and persist them to
 * sessionStorage. resolveAcquisition() reads them back at family_created.
 * Mirrors referralCapture.web.ts. Never throws — attribution must not break a
 * user flow.
 */
import { Platform } from 'react-native';
import {
  AcquisitionSignal,
  ACQUISITION_KEY,
  deviceRegion,
  normalizeSource,
} from './acquisitionCapture.shared';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

interface StoredTouch {
  utm: Record<string, string>;
  referrer: string;
  ts: string;
}

export async function captureAcquisitionFromUrl(): Promise<void> {
  try {
    // First-touch wins: never overwrite an earlier capture in the same session.
    if (sessionStorage.getItem(ACQUISITION_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) utm[k] = v.slice(0, 120); // cap length; a hostile ?utm= can't be stored verbatim
    }
    const referrer = (typeof document !== 'undefined' ? document.referrer : '') || '';

    // Nothing to attribute → leave storage empty so resolve() falls back to
    // organic with a fresh device region (a direct www visit).
    if (Object.keys(utm).length === 0 && !referrer) return;

    const payload: StoredTouch = {
      utm,
      referrer: referrer.slice(0, 300),
      ts: new Date().toISOString(),
    };
    sessionStorage.setItem(ACQUISITION_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage may be unavailable in some browsers — non-fatal.
  }
}

export async function resolveAcquisition(): Promise<AcquisitionSignal> {
  let utm: Record<string, string> = {};
  let referrer = '';
  try {
    const stored = sessionStorage.getItem(ACQUISITION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<StoredTouch>;
      utm = parsed.utm ?? {};
      referrer = parsed.referrer ?? '';
    }
  } catch {
    // fall through to organic
  }

  const hasSignal = Object.keys(utm).length > 0 || !!referrer;
  const source = normalizeSource(utm.utm_source, referrer);

  return {
    source,
    raw: hasSignal
      ? { ...utm, referrer: referrer || undefined, platform: Platform.OS, capture: 'web_first_touch' }
      : { platform: Platform.OS, capture: 'web_direct' },
    country: deviceRegion(),
  };
}

export async function clearAcquisition(): Promise<void> {
  try {
    sessionStorage.removeItem(ACQUISITION_KEY);
  } catch {
    // non-fatal
  }
}
