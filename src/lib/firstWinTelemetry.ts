/**
 * firstWinTelemetry — the two child-side events the First Win metric needs
 * (pkg/first-win P0, docs/sessions/first-win/TESTS.md §A).
 *
 *   child_first_open    — the child app was opened for this child, either by the
 *                         child (source 'child_device') or handed over on the
 *                         parent's device (source 'view_as_child'). Logged once
 *                         per child per JS session; "first ever" is derived in
 *                         SQL as min(occurred_at). This replaces reading
 *                         profiles.last_seen_at, which is stamped at profile
 *                         creation and is NOT evidence of an open
 *                         (IN-2026-09-24-01).
 *   first_task_complete — the child's first counted completion, with an
 *                         immutable timestamp. daily_progress is an upsert that
 *                         rewrites completed_at/source on re-mark, so the metric
 *                         reads this event instead of the row.
 *
 * Counted sources follow Adi's D1 (2026-09-24): child_device, legacy NULL,
 * view_as_child and onboarding_handoff. 'parent' (a parent surface) and the
 * seed sources never count.
 *
 * Contract: fire-and-forget, never throws, skips without a family scope.
 */
import { supabase } from '../integrations/supabase/client';
import { logOnboardingEvent } from './onboardingFunnel';

export type ChildSurfaceSource = 'child_device' | 'view_as_child';

/** PostgREST filter for daily_progress rows that count as a first win (D1). */
export const COUNTED_SOURCES_FILTER =
  'source.is.null,source.in.(child_device,view_as_child,onboarding_handoff)';

const openedThisSession = new Set<string>();
/** Children known (this session) to already have a counted completion. */
const winKnownThisSession = new Set<string>();
/** In-flight first-win checks, so two quick completions share one answer. */
const pendingChecks = new Map<string, Promise<boolean>>();

export function logChildFirstOpen(args: {
  familyId: string | null | undefined;
  childId: string | null | undefined;
  source: ChildSurfaceSource;
}): void {
  const { familyId, childId, source } = args;
  if (!familyId || !childId) return;
  const key = `${childId}|${source}`;
  if (openedThisSession.has(key)) return;
  openedThisSession.add(key);
  void logOnboardingEvent({ familyId, eventType: 'child_first_open', childId, source });
}

/**
 * Call BEFORE writing a completion. Resolves true when this child has no
 * counted completion yet, i.e. the write about to happen is their first win.
 * One query per child per session at most; afterwards it answers from memory.
 * A failed query resolves false (never invent a first win).
 */
export function isFirstCountedCompletion(childId: string): Promise<boolean> {
  if (winKnownThisSession.has(childId)) return Promise.resolve(false);
  const pending = pendingChecks.get(childId);
  // A second completion while the first check is in flight is never the first win.
  if (pending) return pending.then(() => false);
  const check = queryIsFirst(childId).then((first) => {
    // Claim the answer synchronously so later completions answer from memory.
    // A failed query (null) is not cached, so the next completion retries. If
    // the write after a `true` fails, the event is lost for this session; the
    // funnel SQL still recovers the win from daily_progress (least(event, row)).
    if (first === null) return false;
    winKnownThisSession.add(childId);
    return first;
  });
  pendingChecks.set(childId, check);
  return check.finally(() => pendingChecks.delete(childId));
}

async function queryIsFirst(childId: string): Promise<boolean | null> {
  try {
    const { count, error } = await supabase
      .from('daily_progress')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('completed', true)
      .is('revoked_at', null)
      .or(COUNTED_SOURCES_FILTER);
    if (error || count == null) return null;
    return count === 0;
  } catch {
    return null;
  }
}

/** Call AFTER the completion write succeeded, when isFirstCountedCompletion was true. */
export function logFirstWin(args: {
  familyId: string;
  childId: string;
  source: ChildSurfaceSource | 'onboarding_handoff';
}): void {
  winKnownThisSession.add(args.childId);
  void logOnboardingEvent({
    familyId:  args.familyId,
    eventType: 'first_task_complete',
    childId:   args.childId,
    source:    args.source,
  });
}

/** Test-only reset. Never call this from app code. */
export function __resetFirstWinTelemetryForTests(): void {
  openedThisSession.clear();
  winKnownThisSession.clear();
  pendingChecks.clear();
}
