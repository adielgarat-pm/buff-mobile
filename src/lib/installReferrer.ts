/**
 * installReferrer — deferred-deep-link source for the smart join link.
 *
 * Default (iOS / Web) implementation: there is no Play Install Referrer off
 * Android, so this is always a no-op returning null. Metro resolves
 * `installReferrer.android.ts` on Android instead — the native
 * `react-native-play-install-referrer` module is therefore NEVER pulled into the
 * iOS or Web bundle (platform-parity rule + native-import launch-crash guard,
 * IN-2026-06-17).
 *
 * Contract (shared by both platform files):
 *   getInstallReferrerJoinCode(): Promise<string | null>
 *     → the 6-char family code if this install came from a smart join link that
 *       routed through the Play Store, else null. Consume-once, best-effort,
 *       never throws.
 */
export async function getInstallReferrerJoinCode(): Promise<string | null> {
  return null;
}
