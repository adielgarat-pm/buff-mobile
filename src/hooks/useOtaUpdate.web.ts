/**
 * useOtaUpdate (web no-op) — platform-split contract for the Expo Web bundle.
 *
 * OTA via expo-updates is native-only: it hot-swaps the JS bundle inside a
 * Play/App-Store binary. On web there is no binary — the PWA is served fresh
 * from the network on each load (public/service-worker.js is network-passthrough
 * with no precache), so "the newest JS" is simply whatever the server returns on
 * the next reload. Nothing to check or fetch here.
 *
 * This file also keeps the expo-updates native module out of the web bundle,
 * per the Platform Parity rule (unify the signal, split the action).
 */
export function useOtaUpdate(): void {
  // no-op on web
}
