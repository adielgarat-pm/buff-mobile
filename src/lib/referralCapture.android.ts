/**
 * referralCapture.android.ts
 *
 * Android: referral code arrives via manual entry in onboarding.
 * We persist it to AsyncStorage so UStep8_Complete can read it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'buff_pending_ref_code';

export async function captureRefFromUrl(): Promise<void> {
  // Android has no URL to capture from on app launch.
  // Code is entered manually by the user — see UStep8_Complete.
}

export async function saveRefCode(code: string): Promise<void> {
  await AsyncStorage.setItem(KEY, code.trim().toUpperCase());
}

export async function getRefCode(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function clearRefCode(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
