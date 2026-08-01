/**
 * useFirstLaunchFreshness (web) — no-op. Expo Web serves a fresh bundle on every
 * load, so there is no embedded-bundle staleness to close and nothing to gate.
 * Always `pending: false` (never holds the splash). Keeps the native
 * `expo-updates` import out of the web bundle.
 */
export function useFirstLaunchFreshness(): { pending: boolean } {
  return { pending: false };
}
