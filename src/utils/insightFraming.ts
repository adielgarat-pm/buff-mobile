/**
 * insightFraming — pure selection logic for the Parent Insights screen.
 *
 * Mirrors recommendationEngine.ts: the part worth testing is the ladder, so it
 * lives free of hooks. The screen gathers the live signals (useWeeklyStats,
 * useParentInsights, useRewardLoopHealth) and calls selectInsightFraming.
 *
 * It returns TWO things (see DESIGN.md §3 "THE MATRIX"):
 *   1. `weekly` — the Layer-B framing case (B1–B5). Always present; every level
 *      (incl. 0 active days and the <3-days empty state) gets a warm, specific
 *      response so no paying parent ever sees a blank card.
 *   2. `tip` — AT MOST ONE targeted tip (anti-overload, Pillar 1). Layer C0 (the
 *      reward-loop health) is checked FIRST and wins the single slot over the
 *      completion tips C1–C5, because a broken reward loop (earning without ever
 *      redeeming) is the #1 felt-value / churn driver — fix it before any
 *      completion nudge (DESIGN §3 Layer C0; PRD "always close to a win").
 *
 * Values contract: never "failed / behind / dropped"; forward, effort-over-
 * outcome; suggestions optional. Copy lives in i18n — this returns keys only.
 */

// ── CTA levers (reuse existing dashboard actions) ────────────────────────────
export type InsightCtaType =
  | 'send-bonus'        // B1 — recognize a strong week
  | 'send-sticker'      // B2 / B3 — a warm body-double gesture
  | 'set-anchor'        // B4 / C1 meds — pick ONE small anchor (meds sheet)
  | 'open-rewards'      // C0 — open the rewards store / redeem
  | 'start-conversation'// C2–C4 — a coaching tip: the action is the IRL talk, so
                        //   this is a soft, non-navigating nudge (no lever)
  | 'none';

// ── Layer B — weekly framing ─────────────────────────────────────────────────
export type WeeklyCaseId = 'B1' | 'B2' | 'B3' | 'B4' | 'B5';

export interface WeeklyFraming {
  id:          WeeklyCaseId;
  /** i18n key under `insights.weekly.<key>.{headline,message}`. */
  i18nKey:     string;
  ctaType:     InsightCtaType;
  /** True for B5 — render the honest empty state (no numbers, no trend). */
  isEmpty:     boolean;
}

// ── Layer C / C0 — the single tip ────────────────────────────────────────────
export interface InsightTip {
  /** 'C0' = reward-loop health; 'C' = targeted completion tip. */
  layer:   'C0' | 'C';
  caseId:  string;            // 'C0a' | 'C0b' | 'C0c' | 'C1' … 'C4'
  /** i18n key. C0 → `insights.weekly.rewardLoop.<x>`; C → existing `insights.<tip>.*`. */
  i18nKey: string;
  ctaType: InsightCtaType;
}

// ── Inputs ───────────────────────────────────────────────────────────────────

/** Reward-loop signals (gathered by useRewardLoopHealth). */
export interface RewardLoopSignals {
  /** Number of rewards defined for the child. */
  rewardsCount:   number;
  /** Cheapest reward cost in BUFFs (null when no rewards defined). */
  cheapestCost:   number | null;
  /** Current BUFF balance. */
  balance:        number;
  /** Approved redemptions in the last 14 days. */
  redemptions14d: number;
  /** Child has been active recently (any active day in the last 7). */
  isActiveRecently: boolean;
}

/** Targeted-tip signals, already resolved from tasks.category / strategy_id +
 *  phaseInsights (NOT title keywords — see DESIGN). */
export interface TargetedTipSignals {
  /** Medication tasks below the bar (<60%). */
  medsLow:      boolean;
  /** Homework/study (category 'learning') below the bar (<50%). */
  homeworkLow:  boolean;
  /** Hygiene/self-care (non-med) below the bar (<50%). */
  hygieneLow:   boolean;
  /** The single weakest phase under 50%, if any (its `-low` tip key). */
  weakestPhaseKey: string | null;
}

export interface InsightFramingState {
  /** Active days in the last 7 (from useWeeklyStats). */
  activeDays:   number;
  /** Days in the last 7 with any tracked activity — gates the empty state. */
  daysWithData: number;
  reward:       RewardLoopSignals;
  tips:         TargetedTipSignals;
}

export interface InsightFraming {
  weekly: WeeklyFraming;
  tip:    InsightTip | null;
}

// ── Thresholds (tune on real data — see DESIGN §7) ───────────────────────────
/** Below this many days of real usage we show the honest "patterns coming soon". */
export const MIN_DATA_DAYS = 3;
/** Strong week. */
export const STRONG_ACTIVE_DAYS = 5;
/** Building rhythm (lower bound). */
export const BUILDING_ACTIVE_DAYS = 3;
/** Hoarding = balance at least this multiple of the cheapest reward, unspent. */
export const HOARDING_MULTIPLE = 2;

// ── Layer B ──────────────────────────────────────────────────────────────────
function selectWeekly(activeDays: number, daysWithData: number): WeeklyFraming {
  // B5 — not enough real data yet. Honest empty state, no numbers, no trend.
  if (daysWithData < MIN_DATA_DAYS) {
    return { id: 'B5', i18nKey: 'comingSoon', ctaType: 'none', isEmpty: true };
  }
  if (activeDays >= STRONG_ACTIVE_DAYS) {
    return { id: 'B1', i18nKey: 'strong', ctaType: 'send-bonus', isEmpty: false };
  }
  if (activeDays >= BUILDING_ACTIVE_DAYS) {
    return { id: 'B2', i18nKey: 'building', ctaType: 'send-sticker', isEmpty: false };
  }
  if (activeDays >= 1) {
    return { id: 'B3', i18nKey: 'growing', ctaType: 'send-sticker', isEmpty: false };
  }
  // 0 active days — a fresh week ahead (never a failure verdict).
  return { id: 'B4', i18nKey: 'quiet', ctaType: 'set-anchor', isEmpty: false };
}

// ── Layer C0 — reward-loop health (wins the tip slot) ────────────────────────
function selectRewardLoopTip(r: RewardLoopSignals): InsightTip | null {
  // C0a — no rewards defined: BUFFs have no finish line.
  if (r.rewardsCount === 0 || r.cheapestCost === null) {
    return { layer: 'C0', caseId: 'C0a', i18nKey: 'insights.weekly.rewardLoop.noRewards', ctaType: 'open-rewards' };
  }
  // A loop that closed recently is healthy — fall through to the completion tips.
  if (r.redemptions14d > 0) return null;
  // Only nudge a redemption if they actually CAN afford one.
  if (r.balance < r.cheapestCost) return null;

  // C0c — hoarding: balance is multiples of the cheapest reward, nothing spent.
  if (r.balance >= r.cheapestCost * HOARDING_MULTIPLE) {
    return { layer: 'C0', caseId: 'C0c', i18nKey: 'insights.weekly.rewardLoop.hoarding', ctaType: 'open-rewards' };
  }
  // C0b — earning but not redeeming (active, affordable, zero redemptions).
  if (r.isActiveRecently) {
    return { layer: 'C0', caseId: 'C0b', i18nKey: 'insights.weekly.rewardLoop.notRedeeming', ctaType: 'open-rewards' };
  }
  return null;
}

// ── Layer C — targeted completion tip (≤1, by category, severity order) ──────
// Each tip carries a next move. Meds nudge toward a fixed anchor (the med sheet
// is a real lever); the coaching tips suggest a CONVERSATION — the action lives
// in the IRL talk the tip describes, not in sending a reward (Pillars 1+2).
function selectTargetedTip(t: TargetedTipSignals): InsightTip | null {
  // Severity: meds > homework > weakest phase > hygiene (DESIGN §3 Layer C).
  if (t.medsLow)      return { layer: 'C', caseId: 'C1', i18nKey: 'insights.medication-low', ctaType: 'set-anchor' };
  if (t.homeworkLow)  return { layer: 'C', caseId: 'C2', i18nKey: 'insights.homework-low',   ctaType: 'start-conversation' };
  if (t.weakestPhaseKey)
                      return { layer: 'C', caseId: 'C3', i18nKey: `insights.${t.weakestPhaseKey}`, ctaType: 'start-conversation' };
  if (t.hygieneLow)   return { layer: 'C', caseId: 'C4', i18nKey: 'insights.hygiene-low',     ctaType: 'start-conversation' };
  // C5 — no clear low: skip the tip, don't manufacture a problem.
  return null;
}

/**
 * Pick the weekly framing + the single tip. C0 (reward loop) is checked before
 * C1–C5 and wins the slot when it fires.
 */
export function selectInsightFraming(s: InsightFramingState): InsightFraming {
  const weekly = selectWeekly(s.activeDays, s.daysWithData);
  // Reward-loop health first; only if the loop is healthy do we consider a
  // completion tip.
  const tip = selectRewardLoopTip(s.reward) ?? selectTargetedTip(s.tips);
  return { weekly, tip };
}
