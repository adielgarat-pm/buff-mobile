/**
 * useVersionGate (iOS no-op, v1) — platform-split contract for iOS native.
 *
 * iOS has no in-app-update API; expo-in-app-updates falls back to opening the
 * App Store. BUFF is pre-App-Store (TestFlight pending — see the ios_testflight
 * memory / in-app-updates SPEC §2), so there is nothing to update against yet.
 * This is a deliberate no-op until after the iOS launch, and it also keeps the
 * native module off the iOS launch path until we actually wire iOS.
 */
export function useVersionGate(): void {
  // no-op on iOS for v1 — App Store update flow wired post-launch
}
