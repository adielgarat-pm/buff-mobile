/**
 * useAutoCoachInsight — the cost guards around AI insight generation, and the
 * free-taste gate that decides who ever sees the AI at all.
 *
 * These rules spend real money and drive the paywall, so the ones worth guarding
 * are the ones where being wrong is expensive in one direction or fatal in the
 * other:
 *   - a NON-entitled family gets FREE_INSIGHTS_PER_CHILD and no more (spend);
 *   - ... but it does get them, on native, where before this package it could
 *     never see the AI at all (the whole point of pkg/ai-taste-gate);
 *   - an unloaded totalCount must not hand out a free generation (render race);
 *   - the weekly cap, the activeDays floor, and the once-per-week attempt guard
 *     all still hold — the taste gate must not become a hole in the cost guards.
 */
import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useAutoCoachInsight, FREE_INSIGHTS_PER_CHILD, type AutoCoachInsightOpts } from '../useAutoCoachInsight';

/** Distinct child per test: the hook keeps a module-level once-per-week guard. */
let seq = 0;
function opts(over: Partial<AutoCoachInsightOpts> = {}): AutoCoachInsightOpts {
  return {
    childId:            `child-${++seq}`,
    smartInsight:       null,
    computedAt:         null,
    loadingState:       false,
    generating:         false,
    generationsLeft:    3,
    hasRealEntitlement: false,
    activeDays:         5,
    totalCount:         0,
    generate:           jest.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function run(o: AutoCoachInsightOpts) {
  renderHook(() => useAutoCoachInsight(o));
  return o.generate as jest.Mock;
}

describe('useAutoCoachInsight — free-taste gate', () => {
  afterEach(() => { Platform.OS = 'android'; });

  it('generates for a NON-entitled family that has never had an insight', () => {
    // The regression this package exists for: before the taste gate this
    // returned early and a free Android parent never saw the AI.
    expect(run(opts({ hasRealEntitlement: false, totalCount: 0 }))).toHaveBeenCalled();
  });

  it('does NOT generate once the free taste is spent', () => {
    expect(run(opts({ hasRealEntitlement: false, totalCount: FREE_INSIGHTS_PER_CHILD })))
      .not.toHaveBeenCalled();
  });

  it('does not spend a free generation when totalCount has not loaded', () => {
    // totalCount omitted -> defaults to "already used". A render race must cost
    // nothing; the worst case is one delayed insight, not one leaked call.
    const o = opts({ hasRealEntitlement: false });
    delete (o as Partial<AutoCoachInsightOpts>).totalCount;
    expect(run(o)).not.toHaveBeenCalled();
  });

  it('still generates for an entitled family past the free taste', () => {
    expect(run(opts({ hasRealEntitlement: true, totalCount: 99 }))).toHaveBeenCalled();
  });

  it('still generates on web past the free taste (web is free by design)', () => {
    Platform.OS = 'web';
    expect(run(opts({ hasRealEntitlement: false, totalCount: 99 }))).toHaveBeenCalled();
  });
});

describe('useAutoCoachInsight — cost guards still hold', () => {
  it('respects the weekly cap', () => {
    expect(run(opts({ generationsLeft: 0 }))).not.toHaveBeenCalled();
  });

  it('needs real data (activeDays >= 2)', () => {
    expect(run(opts({ activeDays: 1 }))).not.toHaveBeenCalled();
  });

  it('reuses a current-week insight instead of regenerating', () => {
    const today = new Date().toISOString();
    expect(run(opts({ smartInsight: { headline: 'x' }, computedAt: today })))
      .not.toHaveBeenCalled();
  });

  it('refreshes an insight from a previous week', () => {
    expect(run(opts({ smartInsight: { headline: 'x' }, computedAt: '2020-01-01T00:00:00.000Z' })))
      .toHaveBeenCalled();
  });

  it('waits while state is still loading', () => {
    expect(run(opts({ loadingState: true }))).not.toHaveBeenCalled();
  });

  it('attempts at most once per child per week across mounts', () => {
    const o = opts();
    renderHook(() => useAutoCoachInsight(o));
    renderHook(() => useAutoCoachInsight(o));
    renderHook(() => useAutoCoachInsight(o));
    expect(o.generate).toHaveBeenCalledTimes(1);
  });
});
