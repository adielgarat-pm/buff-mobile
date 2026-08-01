/**
 * reloadOnce — the SINGLE entry point for applying a downloaded OTA via
 * expo-updates `reloadAsync()`.
 *
 * Why a shared guard: three callers can ask to reload — Layer 1 (first-launch
 * freshness), Layer 3 (the restart toast), and LanguageContext's RTL switch. If
 * two fire in the same session they must not both call `reloadAsync()` (a
 * double reload is jarring and racy). A module-level in-flight boolean makes the
 * first call win and every subsequent call a no-op until the JS context tears
 * down (which reloadAsync does on success, so the flag naturally resets on the
 * fresh launch).
 *
 * Native-safe: expo-updates is imported lazily inside the call and wrapped in
 * try/catch, so a disabled/unavailable updates module (dev, Expo Go) is a
 * swallowed no-op, never a crash. `Updates.reloadAsync()` never resolves on
 * success (the context is destroyed) — the returned promise is intentionally
 * not awaited by callers for control flow.
 */
import * as Sentry from '@sentry/react-native';

let reloadInFlight = false;

export function isReloadInFlight(): boolean {
  return reloadInFlight;
}

/**
 * Apply the pending OTA and restart the JS runtime. Returns true if a reload was
 * initiated, false if one was already in flight or updates are unavailable.
 */
export async function reloadOnce(source: string): Promise<boolean> {
  if (reloadInFlight) return false;
  reloadInFlight = true;
  try {
    const Updates = require('expo-updates') as typeof import('expo-updates');
    if (!Updates.isEnabled) {
      reloadInFlight = false;
      return false;
    }
    await Updates.reloadAsync(); // never resolves on success — context tears down
    return true;
  } catch (err) {
    // Reset so a later, legitimate attempt can retry; surface for visibility.
    reloadInFlight = false;
    Sentry.addBreadcrumb({
      category: 'ota_reload',
      message: 'reload_failed',
      level: 'warning',
      data: { source, reason: err instanceof Error ? err.message : String(err) },
    });
    return false;
  }
}
