/**
 * useParentRecommendations — gathers the live per-child signals and runs the
 * pure `selectRecommendation` ladder to produce the dashboard's single
 * "Recommended now" card.
 *
 * Source plan: spec-typed-toucan (Insights → Action Engine).
 *
 * Signal sourcing (reuse over re-query):
 *   - Pause:   useAppSettings().isPauseActive
 *   - Vibe:    useDailyVibe(childId).isLowPower
 *   - Streak:  useChildStreak(childId).streak
 *   - Lapse + standalone-med + topInsight: passed in from the dashboard, which
 *     already computes them (anchor_recovery prompts, the OQ7 meds set, and
 *     useParentInsights) — avoids duplicate notification-feed subscriptions and
 *     re-running the meds heuristic.
 *
 * Returns at most one recommendation. The dashboard maps `ctaType` to its own
 * existing handlers (openSticker / setMedSheetTarget / openBonus); this hook is
 * read-only.
 */
import { useMemo } from 'react';
import { useAppSettings } from './useAppSettings';
import { useDailyVibe } from './useDailyVibe';
import { useChildStreak } from './useChildStreak';
import {
  selectRecommendation,
  type Recommendation,
  type TopInsightLite,
} from '../utils/recommendationEngine';

export interface ParentRecommendationContext {
  childName:        string;
  /** Unread anchor_recovery notification exists for this child. */
  isLapsed:         boolean;
  /** Child already has a standalone meds task (dashboard's OQ7 set). */
  hasStandaloneMed: boolean;
  /** Top legacy insight for this child, or null. */
  topInsight:       TopInsightLite | null;
}

export function useParentRecommendations(
  childId: string | null,
  ctx: ParentRecommendationContext,
): { recommendation: Recommendation | null; loading: boolean } {
  const { isPauseActive, loading: settingsLoading } = useAppSettings();
  const { isLowPower, loading: vibeLoading }         = useDailyVibe(childId);
  const { streak }                                   = useChildStreak(childId);

  const recommendation = useMemo(() => {
    if (!childId) return null;
    return selectRecommendation({
      childId,
      childName:        ctx.childName,
      isPaused:         isPauseActive,
      isLowVibe:        isLowPower,
      isLapsed:         ctx.isLapsed,
      hasStandaloneMed: ctx.hasStandaloneMed,
      streak,
      topInsight:       ctx.topInsight,
    });
  }, [
    childId, ctx.childName, ctx.isLapsed, ctx.hasStandaloneMed, ctx.topInsight,
    isPauseActive, isLowPower, streak,
  ]);

  return { recommendation, loading: settingsLoading || vibeLoading };
}
