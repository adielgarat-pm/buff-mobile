/**
 * referralCapture.web.ts
 *
 * Web: referral code arrives via URL param (buffadhd.com/join?ref=XXXXXX).
 * Captured immediately on module load (before routing clears the param),
 * persisted to sessionStorage so UStep8_Complete can read it later.
 */

const KEY = 'buff_pending_ref_code';

/**
 * Canonical referral-code shape. Codes are uppercase alphanumerics; strip
 * anything else and cap the length so a malformed/hostile ?ref= can't be
 * stored verbatim. Kept identical to landing-web/src/pages/Join.tsx so both
 * web entry points (apex /join and the www app hop) converge before the value
 * reaches redeem_referral. Returns '' for empty/garbage input.
 */
export function sanitizeRefCode(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

export async function captureRefFromUrl(): Promise<void> {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = sanitizeRefCode(params.get('ref'));
    if (ref) {
      sessionStorage.setItem(KEY, ref);
    }
  } catch {
    // Non-fatal — sessionStorage may be unavailable in some browsers
  }
}

export async function saveRefCode(code: string): Promise<void> {
  try {
    const clean = sanitizeRefCode(code);
    if (clean) sessionStorage.setItem(KEY, clean);
  } catch { /* non-fatal */ }
}

export async function getRefCode(): Promise<string | null> {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function clearRefCode(): Promise<void> {
  try {
    sessionStorage.removeItem(KEY);
  } catch { /* non-fatal */ }
}
