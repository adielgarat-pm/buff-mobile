import {
  selectInsightFraming,
  MIN_DATA_DAYS,
  STRONG_ACTIVE_DAYS,
  BUILDING_ACTIVE_DAYS,
  HOARDING_MULTIPLE,
  type InsightFramingState,
  type RewardLoopSignals,
  type TargetedTipSignals,
} from '../insightFraming';

// A healthy reward loop (redeemed recently) → never fires a C0 tip.
const healthyReward: RewardLoopSignals = {
  rewardsCount:     2,
  cheapestCost:     20,
  balance:          50,
  redemptions14d:   1,
  isActiveRecently: true,
};

// No targeted lows → no C tip.
const noTips: TargetedTipSignals = {
  medsLow:         false,
  homeworkLow:     false,
  hygieneLow:      false,
  weakestPhaseKey: null,
};

/** Baseline: enough data, building week, healthy loop, no lows → B2, no tip. */
const base: InsightFramingState = {
  activeDays:   3,
  daysWithData: 7,
  reward:       healthyReward,
  tips:         noTips,
};

describe('selectInsightFraming — Layer B (weekly framing)', () => {
  it('B5 — fewer than MIN_DATA_DAYS of real data → honest empty state', () => {
    const r = selectInsightFraming({ ...base, daysWithData: MIN_DATA_DAYS - 1, activeDays: 0 });
    expect(r.weekly.id).toBe('B5');
    expect(r.weekly.isEmpty).toBe(true);
    expect(r.weekly.ctaType).toBe('none');
  });

  it('B1 — strong week (>=5 active) → send-bonus CTA', () => {
    const r = selectInsightFraming({ ...base, activeDays: STRONG_ACTIVE_DAYS });
    expect(r.weekly.id).toBe('B1');
    expect(r.weekly.ctaType).toBe('send-bonus');
  });

  it('B2 — building (3–4 active) → send-sticker CTA', () => {
    const r = selectInsightFraming({ ...base, activeDays: BUILDING_ACTIVE_DAYS });
    expect(r.weekly.id).toBe('B2');
    expect(r.weekly.ctaType).toBe('send-sticker');
  });

  it('B3 — growing (1–2 active) → send-sticker CTA', () => {
    const r = selectInsightFraming({ ...base, activeDays: 1 });
    expect(r.weekly.id).toBe('B3');
    expect(r.weekly.ctaType).toBe('send-sticker');
  });

  it('B4 — quiet week (0 active) → set-anchor CTA, never a failure', () => {
    const r = selectInsightFraming({ ...base, activeDays: 0 });
    expect(r.weekly.id).toBe('B4');
    expect(r.weekly.ctaType).toBe('set-anchor');
    expect(r.weekly.isEmpty).toBe(false);
  });

  it('B5 overrides the active-days bucket when data is too thin', () => {
    // Even with 5 "active" days, <3 days of data means we cannot trust the trend.
    const r = selectInsightFraming({ ...base, activeDays: 5, daysWithData: 2 });
    expect(r.weekly.id).toBe('B5');
  });
});

describe('selectInsightFraming — Layer C0 (reward loop wins the tip slot)', () => {
  it('C0a — no rewards defined → define-a-reward nudge', () => {
    const r = selectInsightFraming({
      ...base,
      reward: { ...healthyReward, rewardsCount: 0, cheapestCost: null },
    });
    expect(r.tip?.layer).toBe('C0');
    expect(r.tip?.caseId).toBe('C0a');
    expect(r.tip?.ctaType).toBe('open-rewards');
  });

  it('C0b — earning but not redeeming (affordable, 0 redemptions, active)', () => {
    const r = selectInsightFraming({
      ...base,
      reward: { rewardsCount: 2, cheapestCost: 20, balance: 30, redemptions14d: 0, isActiveRecently: true },
    });
    expect(r.tip?.caseId).toBe('C0b');
  });

  it('C0c — hoarding (balance >= HOARDING_MULTIPLE × cheapest, nothing spent)', () => {
    const r = selectInsightFraming({
      ...base,
      reward: {
        rewardsCount: 2, cheapestCost: 20,
        balance: 20 * HOARDING_MULTIPLE, redemptions14d: 0, isActiveRecently: true,
      },
    });
    expect(r.tip?.caseId).toBe('C0c');
  });

  it('C0d — healthy loop (redeemed within 14d) → no C0 tip, falls through to C', () => {
    const r = selectInsightFraming({
      ...base,
      reward: { ...healthyReward, redemptions14d: 1 },
      tips:   { ...noTips, medsLow: true },
    });
    expect(r.tip?.layer).toBe('C');
    expect(r.tip?.caseId).toBe('C1');
  });

  it('does not nudge a redemption the child cannot afford', () => {
    const r = selectInsightFraming({
      ...base,
      reward: { rewardsCount: 2, cheapestCost: 100, balance: 10, redemptions14d: 0, isActiveRecently: true },
      tips:   { ...noTips, homeworkLow: true },
    });
    // Loop "broken" but unaffordable → skip C0, let the completion tip show.
    expect(r.tip?.layer).toBe('C');
    expect(r.tip?.caseId).toBe('C2');
  });

  it('C0 outranks a completion low (single tip slot)', () => {
    const r = selectInsightFraming({
      ...base,
      reward: { rewardsCount: 0, cheapestCost: null, balance: 0, redemptions14d: 0, isActiveRecently: true },
      tips:   { medsLow: true, homeworkLow: true, hygieneLow: true, weakestPhaseKey: 'morning-low' },
    });
    expect(r.tip?.layer).toBe('C0');
    expect(r.tip?.caseId).toBe('C0a');
  });
});

describe('selectInsightFraming — Layer C (targeted tips, severity order)', () => {
  it('C1 — meds low outranks everything else, nudges a fixed anchor', () => {
    const r = selectInsightFraming({
      ...base,
      tips: { medsLow: true, homeworkLow: true, hygieneLow: true, weakestPhaseKey: 'morning-low' },
    });
    expect(r.tip?.caseId).toBe('C1');
    expect(r.tip?.i18nKey).toBe('insights.medication-low');
    expect(r.tip?.ctaType).toBe('set-anchor');
  });

  it('C2 — homework low outranks phase + hygiene, carries a sticker CTA', () => {
    const r = selectInsightFraming({
      ...base,
      tips: { medsLow: false, homeworkLow: true, hygieneLow: true, weakestPhaseKey: 'morning-low' },
    });
    expect(r.tip?.caseId).toBe('C2');
    expect(r.tip?.i18nKey).toBe('insights.homework-low');
    expect(r.tip?.ctaType).toBe('send-sticker');
  });

  it('C3 — weakest phase outranks hygiene', () => {
    const r = selectInsightFraming({
      ...base,
      tips: { medsLow: false, homeworkLow: false, hygieneLow: true, weakestPhaseKey: 'evening-low' },
    });
    expect(r.tip?.caseId).toBe('C3');
    expect(r.tip?.i18nKey).toBe('insights.evening-low');
  });

  it('C4 — hygiene low when nothing else', () => {
    const r = selectInsightFraming({
      ...base,
      tips: { medsLow: false, homeworkLow: false, hygieneLow: true, weakestPhaseKey: null },
    });
    expect(r.tip?.caseId).toBe('C4');
    expect(r.tip?.i18nKey).toBe('insights.hygiene-low');
  });

  it('C5 — no clear low → no tip (do not manufacture a problem)', () => {
    const r = selectInsightFraming(base);
    expect(r.tip).toBeNull();
  });
});
