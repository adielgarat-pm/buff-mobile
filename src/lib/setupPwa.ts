/**
 * setupPwa — native no-op.
 *
 * On web, Metro resolves the platform-specific `setupPwa.web.ts` instead, which
 * injects the PWA <head> tags and registers the service worker. On iOS/Android
 * there is nothing to do (the native app is the "installed app").
 */
export function setupPwa(): void {
  // no-op on native
}
