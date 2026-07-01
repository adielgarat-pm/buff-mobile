/**
 * referralCapture.android.ts
 *
 * Android: referral code arrives via manual entry in onboarding.
 * We persist it to AsyncStorage so UStep8_Complete can read it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'buff_pending_ref_code';

/**
 * Canonical referral-code shape — kept identical to referralCapture.web.ts and
 * landing-web/src/pages/Join.tsx so every entry surface converges on the same
 * value before it reaches redeem_referral. Returns '' for empty/garbage input.
 */
export function sanitizeRefCode(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

export async function captureRefFromUrl(): Promise<void> {
  // Android has no URL to capture from on app launch.
  // Code is entered manually by the user — see UStep8_Complete.
}

export async function saveRefCode(code: string): Promise<void> {
  const clean = sanitizeRefCode(code);
  if (clean) await AsyncStorage.setItem(KEY, clean);
}

export async function getRefCode(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function clearRefCode(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
