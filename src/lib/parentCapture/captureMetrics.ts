/**
 * captureMetrics — usability instrumentation for parent capture ("Smart Organizer").
 *
 * The question this answers: did the feature actually save the parent work?
 * `capture_runs` already logged how many items the AI RETURNED; what was blind
 * is what the parent then did with them — how many were kept, thrown away, or
 * re-assigned because the AI guessed the wrong child.
 *
 * Metric definitions (see scripts/capture-usage.sql):
 *   Trust Rate   = kept_count / item_count      → how much of the output survived
 *   Edit Rate    = edited_count / kept_count    → how often the AI's assignment was wrong
 *   Abandon      = confirmed_at IS NULL         → parent saw the review and walked away
 *
 * Contract (same posture as onboardingFunnel):
 *   - Never throws. Instrumentation must never break a user flow.
 *   - Counts only. No titles, no raw input — nothing that could carry content.
 */

import { supabase } from '../../integrations/supabase/client';

/** What the AI proposed, snapshotted before the parent touched the review card. */
export interface ReviewBaseline {
  owner: 'parent' | 'child';
  childId: string | null;
}

/** The minimum shape of a review row this module needs (see ReviewEntry). */
export interface ReviewEntryLike {
  parsed: { id: string };
  owner: 'parent' | 'child';
  childId: string | null;
  discarded: boolean;
}

export interface CaptureRunSummary {
  keptCount: number;
  discardedCount: number;
  editedCount: number;
}

/** Snapshot the AI's proposal, keyed by parsed item id. */
export function baselineFromEntries(
  entries: ReadonlyArray<ReviewEntryLike>,
): Record<string, ReviewBaseline> {
  const out: Record<string, ReviewBaseline> = {};
  for (const e of entries) out[e.parsed.id] = { owner: e.owner, childId: e.childId };
  return out;
}

/**
 * Compare the confirmed review against the AI's proposal.
 *
 * "Edited" counts only KEPT items whose owner or child assignment changed —
 * a discard is already counted as a discard, not also as an edit. An item with
 * no baseline (shouldn't happen) is treated as unedited rather than inflating
 * the edit rate.
 */
export function summarizeReview(
  entries: ReadonlyArray<ReviewEntryLike>,
  baseline: Readonly<Record<string, ReviewBaseline>>,
): CaptureRunSummary {
  let keptCount = 0;
  let discardedCount = 0;
  let editedCount = 0;

  for (const e of entries) {
    if (e.discarded) {
      discardedCount++;
      continue;
    }
    keptCount++;
    const base = baseline[e.parsed.id];
    if (!base) continue;
    if (base.owner !== e.owner || base.childId !== e.childId) editedCount++;
  }

  return { keptCount, discardedCount, editedCount };
}

/**
 * Attach the parent's confirm summary to the run row the Edge Function wrote.
 * A missing runId (server could not log) is a silent no-op — the items still
 * save; only the metric is lost.
 */
export async function logCaptureConfirm(
  runId: string | null | undefined,
  summary: CaptureRunSummary,
): Promise<void> {
  try {
    if (!runId) return;
    await supabase
      .from('capture_runs')
      .update({
        kept_count: summary.keptCount,
        discarded_count: summary.discardedCount,
        edited_count: summary.editedCount,
        confirmed_at: new Date().toISOString(),
      } as never)
      .eq('id', runId);
  } catch {
    /* analytics must never break a flow */
  }
}
