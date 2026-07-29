/**
 * useInsightViewLog — records that the AI insight card was actually SEEN.
 *
 * The rules worth guarding are the ones that decide whether View Rate is a real
 * number or a fiction:
 *   - a card that never renders is never logged (that IS the metric);
 *   - one view per child per placement per session — a parent re-focusing the
 *     dashboard, or a `computedAt` that flaps to null mid-render, must not
 *     inflate the count (regression: prod 2026-07-28 wrote two rows 66ms apart
 *     for the same child, variants '2026-07-17' and 'unknown');
 *   - the same insight seen on BOTH surfaces is two genuine views, not one;
 *   - it never throws — instrumentation must not break the dashboard.
 *
 * The dedup guard is module-level and deliberately survives for the life of the
 * JS session, so each test uses its own childId rather than resetting it —
 * re-requiring the module under isolateModules would load a second copy of React.
 */
import { renderHook } from '@testing-library/react-native';

import { useInsightViewLog, type InsightViewLogOpts } from '../useInsightViewLog';
import { logOnboardingEvent } from '../../lib/onboardingFunnel';

jest.mock('../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));

const mockedLog = logOnboardingEvent as unknown as jest.Mock;

/** A fresh, never-before-seen child so the session dedup Set can't leak between tests. */
function opts(childId: string, over: Partial<InsightViewLogOpts> = {}): InsightViewLogOpts {
  return {
    familyId:   'fam-1',
    childId,
    computedAt: '2026-07-17T09:00:00.000Z',
    visible:    true,
    placement:  'dashboard',
    ...over,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('useInsightViewLog', () => {
  it('logs a view when the card is visible', () => {
    renderHook(() => useInsightViewLog(opts('c-visible')));
    expect(mockedLog).toHaveBeenCalledTimes(1);
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      familyId:  'fam-1',
      childId:   'c-visible',
      eventType: 'insight_viewed',
      source:    'dashboard',
      variant:   '2026-07-17',
    }));
  });

  it('does NOT log while the card is not rendered', () => {
    renderHook(() => useInsightViewLog(opts('c-hidden', { visible: false })));
    expect(mockedLog).not.toHaveBeenCalled();
  });

  it('does not log without a family scope (RLS would reject the row anyway)', () => {
    renderHook(() => useInsightViewLog(opts('c-nofam', { familyId: null })));
    expect(mockedLog).not.toHaveBeenCalled();
  });

  it('logs once across re-renders of the same card', () => {
    const { rerender } = renderHook(() => useInsightViewLog(opts('c-rerender')));
    rerender({});
    rerender({});
    expect(mockedLog).toHaveBeenCalledTimes(1);
  });

  // The prod regression: computedAt briefly null while smartInsight is still set.
  it('logs once when computedAt flaps to null mid-session', () => {
    const { rerender } = renderHook(
      (p: InsightViewLogOpts) => useInsightViewLog(p),
      { initialProps: opts('c-flap') },
    );
    rerender(opts('c-flap', { computedAt: null }));
    rerender(opts('c-flap'));
    expect(mockedLog).toHaveBeenCalledTimes(1);
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({ variant: '2026-07-17' }));
  });

  it('counts the two surfaces separately — both are real views', () => {
    renderHook(() => useInsightViewLog(opts('c-both')));
    renderHook(() => useInsightViewLog(opts('c-both', { placement: 'insights_screen' })));
    expect(mockedLog).toHaveBeenCalledTimes(2);
    expect(mockedLog).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: 'insights_screen' }),
    );
  });

  it('counts different children separately', () => {
    renderHook(() => useInsightViewLog(opts('c-kid-a')));
    renderHook(() => useInsightViewLog(opts('c-kid-b')));
    expect(mockedLog).toHaveBeenCalledTimes(2);
  });

  it('still logs an insight that has no computed_at (pre-042 rows)', () => {
    renderHook(() => useInsightViewLog(opts('c-nodate', { computedAt: null })));
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({ variant: 'unknown' }));
  });
});
