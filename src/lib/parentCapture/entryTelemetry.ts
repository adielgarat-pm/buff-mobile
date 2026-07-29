/**
 * entryTelemetry — "was the Smart Organizer entry card actually seen?", once.
 *
 * Why this is a module and not a `useRef` in the component: the parent dashboard
 * re-renders on every pull-to-refresh, on every focus, and the card unmounts and
 * remounts when the parent navigates away and back. A ref resets on remount, so
 * the counter would measure "dashboard mounts" and we would read it as "parents
 * reached". #402 shipped exactly that mistake in the other direction — a view-log
 * that counted a card which never rendered — and it cost us the metric.
 *
 * A module-level Set lives for the app process. That is the definition of
 * "session" we want: the same parent opening the dashboard four times in one
 * sitting is ONE exposure; tomorrow's cold start is a new one. It is deliberately
 * NOT persisted — a permanent "seen once ever" flag would hide the thing worth
 * knowing, which is whether she keeps seeing the card and keeps ignoring it.
 *
 * Pure and side-effect free apart from its own memory, so the rule is testable
 * without a screen.
 */

const seenThisSession = new Set<string>();

/**
 * True the first time this family sees the entry card in this app session,
 * false every time after. Callers log only when this returns true.
 *
 * A missing familyId returns false: `logOnboardingEvent` skips those rows anyway
 * (RLS needs a family scope), and letting them through would mark the session as
 * counted before the profile finished loading — the exposure would then never be
 * logged at all.
 */
export function shouldLogEntrySeen(familyId: string | null | undefined): boolean {
  if (!familyId) return false;
  if (seenThisSession.has(familyId)) return false;
  seenThisSession.add(familyId);
  return true;
}

/** Test-only reset. Never call this from app code. */
export function __resetEntryTelemetryForTests(): void {
  seenThisSession.clear();
}
