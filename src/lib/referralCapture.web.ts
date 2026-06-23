/**
 * referralCapture.web.ts
 *
 * Web: referral code arrives via URL param (buffadhd.com/join?ref=XXXXXX).
 * Captured immediately on module load (before routing clears the param),
 * persisted to sessionStorage so UStep8_Complete can read it later.
 */

const KEY = 'buff_pending_ref_code';

export async function captureRefFromUrl(): Promise<void> {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem(KEY, ref.trim().toUpperCase());
    }
  } catch {
    // Non-fatal — sessionStorage may be unavailable in some browsers
  }
}

export async function saveRefCode(code: string): Promise<void> {
  try {
    sessionStorage.setItem(KEY, code.trim().toUpperCase());
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
