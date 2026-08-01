/**
 * currentRoute — a tiny module-level store of the app's TOP-LEVEL focused route
 * name, fed by RootNavigator's `NavigationContainer.onStateChange`.
 *
 * Why: the OTA restart toast (Layer 3) must only appear on a stable parent
 * surface. Modals/editors/paywall/onboarding are all presented as top-level
 * routes ON TOP of the tab shell ('ParentApp'), so "top route === 'ParentApp'"
 * cleanly means "on the parent tabs, not over any modal/editor/paywall/child
 * surface" — without needing nested navigation state. There is no global
 * navigation ref in this app, so this store is the read point.
 *
 * Pure module state + subscription; safe to import from anywhere and easy to
 * unit-test (no React/RN required).
 */
type Listener = (routeName: string | null) => void;

let current: string | null = null;
const listeners = new Set<Listener>();

/** Called by RootNavigator on every navigation state change. */
export function setCurrentRoute(routeName: string | null): void {
  if (routeName === current) return;
  current = routeName;
  listeners.forEach((l) => l(current));
}

export function getCurrentRoute(): string | null {
  return current;
}

export function subscribeCurrentRoute(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
