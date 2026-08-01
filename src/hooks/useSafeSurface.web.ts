/**
 * useSafeSurface (web) — no-op. Layer 3's web reload-toast is deferred for v1:
 * Expo Web serves a fresh bundle on every load and the service worker is
 * network-passthrough with no cache (see the in-app-updates SPEC §Web), so a web
 * PWA only goes stale if a tab is left open for hours — low priority. The
 * build-version-check → location.reload() toast is a named follow-up. Returning
 * `safe: false` means the OTA restart toast never shows on web.
 */
import { SafeSurfaceResult } from '../lib/safeSurface';

export function useSafeSurface(): SafeSurfaceResult {
  return { safe: false, reason: 'web_deferred' };
}
