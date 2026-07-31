/**
 * entryTelemetry — "was the Activities & gear entry card actually seen?", once.
 *
 * A deliberate parallel to src/lib/parentCapture/entryTelemetry.ts, with its OWN
 * module-level Set. The two cards live on the same dashboard: if they shared one
 * Set keyed by familyId, whichever rendered first would mark the family "seen"
 * and the second card's exposure would never log. Separate Sets keep the two
 * funnels independent — and keep the tuned capture path (#411) untouched.
 *
 * Why a module and not a `useRef` in the component: the parent dashboard
 * re-renders on every pull-to-refresh and re-focus, and the card unmounts and
 * remounts on navigation. A ref resets on remount, so it would measure
 * "dashboard mounts", not "families reached". A module-level Set lives for the
 * app process — the same parent opening the dashboard four times in one sitting
 * is ONE exposure; tomorrow's cold start is a new one. Deliberately NOT
 * persisted: a permanent "seen once ever" flag would hide the thing worth
 * knowing — whether she keeps seeing the card and keeps ignoring it.
 *
 * Pure and side-effect free apart from its own memory, so the rule is testable
 * without a screen.
 */

const seenThisSession = new Set<string>();

/**
 * True the first time this family sees the Activities entry card in this app
 * session, false every time after. Callers log only when this returns true.
 *
 * A missing familyId returns false: `logOnboardingEvent` skips those rows anyway
 * (RLS needs a family scope), and letting them through would mark the session as
 * counted before the profile finished loading — the exposure would then never be
 * logged at all.
 */
export function shouldLogActivitiesEntrySeen(familyId: string | null | undefined): boolean {
  if (!familyId) return false;
  if (seenThisSession.has(familyId)) return false;
  seenThisSession.add(familyId);
  return true;
}

/** Test-only reset. Never call this from app code. */
export function __resetActivitiesEntryTelemetryForTests(): void {
  seenThisSession.clear();
}
