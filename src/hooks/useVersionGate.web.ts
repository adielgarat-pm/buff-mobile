/**
 * useVersionGate (web no-op, v1) — platform-split contract for the Expo Web bundle.
 *
 * The "is a newer version available?" signal applies to web too (a tab left open
 * for hours can go stale), but the ACTION differs: web has no store — it reloads
 * the page. That web "refresh to update" toast is Phase 2 (needs a build-id
 * marker + a small banner UI). For v1 this is a deliberate no-op: the PWA is
 * served network-passthrough with no precache (public/service-worker.js), so web
 * rarely goes stale — the only gap is a long-lived open tab, deferred to Phase 2.
 *
 * This also keeps the native expo-in-app-updates module out of the web bundle
 * (Platform Parity: unify the signal, split the action).
 */
export function useVersionGate(): void {
  // no-op on web for v1 — see Phase 2 (web reload toast)
}
