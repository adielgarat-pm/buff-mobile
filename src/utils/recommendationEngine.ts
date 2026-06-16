/**
 * recommendationEngine — pure selection logic for the parent dashboard's
 * "Recommended now" card.
 *
 * Source plan: spec-typed-toucan (Insights → Action Engine).
 *
 * Why a pure function (mirrors pauseUtils.ts / vibeUtils.ts): the ladder is
 * the part worth testing, so it lives free of hooks. `useParentRecommendations`
 * gathers the live signals and calls `selectRecommendation`.
 *
 * Design: returns AT MOST ONE recommendation (anti-overload, BUFF Pillar). A
 * transparent priority ladder — first match wins. The card only fires for the
 * NEW actionable states (low-vibe, comeback/lapse, celebrate); existing phase
 * insights keep rendering through the legacy insight card when no recommendation
 * is returned, so this layer is purely additive.
 *
 * Values contract:
 *   - Pillar 1 (Intrinsic): the comeback CTA centers a single meaningful anchor;
 *     stickers are a body-double gesture, not a reward bribe.
 *   - Pillar 2 (Positive Coaching): never emitted while paused; copy keys are
 *     neutral/forward-looking; no failure framing.
 *   - Pillar 3 (Independence): one tap, dismissible; nothing is forced on the kid.
 */

/** Minimum daily streak before we suggest celebrating. Plan open-item: N. */
export const STREAK_CELEBRATE_THRESHOLD = 3;

/** Which existing dashboard lever a recommendation routes its CTA to. The
 *  dashboard owns the wiring (openSticker / setMedSheetTarget / openBonus);
 *  the engine stays side-effect free. */
export type RecommendationCtaType = 'send-sticker' | 'add-med' | 'send-bonus' | 'none';

export type RecommendationTrigger = 'low-vibe' | 'comeback' | 'celebrate';

export interface Recommendation {
  /** Stable id (includes childId so React keys are unique in multi-kid). */
  id:        string;
  trigger:   RecommendationTrigger;
  /** Copy lives at `recommendations.<i18nKey>.{title,description,cta}`. */
  i18nKey:   string;
  icon:      string;
  ctaType:   RecommendationCtaType;
  childId:   string;
  childName: string;
}

/** Severity vocabulary borrowed from useParentInsights.InsightCard. Only the
 *  field we gate on is needed here. 'info' === positive-streak (the only
 *  non-low insight); 'suggestion'|'attention' === a low insight worth keeping. */
export interface TopInsightLite {
  severity: 'info' | 'suggestion' | 'attention';
}

export interface RecommendationState {
  childId:          string;
  childName:        string;
  /** Pause wins over everything — respect the family's break. */
  isPaused:         boolean;
  /** Child's today vibe is low (vibe_level <= 2 / low_power_mode). */
  isLowVibe:        boolean;
  /** An unread anchor_recovery notification exists for this child (5+ days). */
  isLapsed:         boolean;
  /** Child already has a standalone meds task — steers the comeback CTA. */
  hasStandaloneMed: boolean;
  /** Server-derived consecutive-day streak (useChildStreak). */
  streak:           number;
  /** The top legacy insight, if any. Gates the celebration so a low insight
   *  is never hidden behind a streak celebration. */
  topInsight:       TopInsightLite | null;
}

/**
 * Pick the single highest-priority recommendation, or null when the legacy
 * insight card should be left to render (phase lows) / nothing applies.
 */
export function selectRecommendation(s: RecommendationState): Recommendation | null {
  // 1. Pause active → suppress entirely (respect the break).
  if (s.isPaused) return null;

  // 2. Low vibe today → a warm body-double gesture reaches the kid now.
  if (s.isLowVibe) {
    return {
      id:        `rec-low-vibe-${s.childId}`,
      trigger:   'low-vibe',
      i18nKey:   'low-vibe',
      icon:      '💜',
      ctaType:   'send-sticker',
      childId:   s.childId,
      childName: s.childName,
    };
  }

  // 3. Lapse → the comeback action. Establish one anchor (meds) if there isn't
  //    one yet; otherwise a small reconnect gesture.
  if (s.isLapsed) {
    return s.hasStandaloneMed
      ? {
          id:        `rec-comeback-reconnect-${s.childId}`,
          trigger:   'comeback',
          i18nKey:   'comeback-reconnect',
          icon:      '⚓',
          ctaType:   'send-sticker',
          childId:   s.childId,
          childName: s.childName,
        }
      : {
          id:        `rec-comeback-anchor-${s.childId}`,
          trigger:   'comeback',
          i18nKey:   'comeback-anchor',
          icon:      '⚓',
          ctaType:   'add-med',
          childId:   s.childId,
          childName: s.childName,
        };
  }

  // 4. Positive streak → celebrate, but never hide a low insight behind it.
  //    'info' is the only non-low insight severity (positive-streak).
  const hasLowInsight = !!s.topInsight && s.topInsight.severity !== 'info';
  if (s.streak >= STREAK_CELEBRATE_THRESHOLD && !hasLowInsight) {
    return {
      id:        `rec-celebrate-${s.childId}`,
      trigger:   'celebrate',
      i18nKey:   'celebrate',
      icon:      '⭐',
      ctaType:   'send-sticker',
      childId:   s.childId,
      childName: s.childName,
    };
  }

  // 5. Nothing actionable — let the legacy insight / locked card render.
  return null;
}
