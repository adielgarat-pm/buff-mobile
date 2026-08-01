/**
 * safeSurface — the pure predicate deciding whether the OTA restart toast
 * (Layer 3) may appear right now. Kept dependency-free so it is unit-testable
 * without React/RN.
 *
 * The toast applies a state-discarding reload on tap, and kids share the parent
 * device (~65%), so it may ONLY show on a stable, read-mostly PARENT surface —
 * never over a child's flow, a parent's mid-edit, a celebration, a paywall, or
 * while the app is backgrounded/just-opened.
 *
 * Route gating is intentionally coarse and robust: modals, editors, the paywall,
 * and onboarding are all presented as top-level routes ON TOP of the parent tab
 * shell ('ParentApp'), so `routeName === 'ParentApp'` alone means "on the parent
 * tabs, not over any of them, and not on a child/onboarding/login surface."
 */
export const SAFE_ROUTE = 'ParentApp' as const;

export interface SafeSurfaceInputs {
  routeName: string | null;
  viewMode: 'parent' | 'child';
  isChildPreview: boolean;
  isPauseActive: boolean;
  isForeground: boolean;
  /** A short settle delay has elapsed since the app became interactive. */
  settled: boolean;
  /** A reward celebration is animating right now. */
  celebrating: boolean;
}

export interface SafeSurfaceResult {
  safe: boolean;
  /** Present when not safe — a non-identifying reason for telemetry. */
  reason?: string;
}

export function evaluateSafeSurface(i: SafeSurfaceInputs): SafeSurfaceResult {
  if (!i.isForeground) return { safe: false, reason: 'background' };
  if (!i.settled) return { safe: false, reason: 'settling' };
  if (i.isPauseActive) return { safe: false, reason: 'pause_mode' };
  if (i.isChildPreview) return { safe: false, reason: 'view_as_child' };
  if (i.viewMode !== 'parent') return { safe: false, reason: 'child_mode' };
  if (i.celebrating) return { safe: false, reason: 'celebrating' };
  if (i.routeName !== SAFE_ROUTE) return { safe: false, reason: `route:${i.routeName ?? 'none'}` };
  return { safe: true };
}
