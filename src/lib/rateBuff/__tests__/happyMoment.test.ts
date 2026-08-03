/**
 * happyMoment tests — the winning-day gate for the rate prompt
 * (pkg/rate-happy-moment). Pins the canonical min(3, scheduled) rule
 * (D-2026-06-14) so a future "success" redefinition can't silently change
 * when we ask for a review.
 */
import { isWinningRecap, hasWinningYesterday } from '../happyMoment';

const recap = (totalScheduled: number, totalCompleted: number) => ({ totalScheduled, totalCompleted });

describe('isWinningRecap', () => {
  it('is false when nothing was scheduled (no evidence either way)', () => {
    expect(isWinningRecap(recap(0, 0))).toBe(false);
  });

  it('is false below the min(3, scheduled) threshold', () => {
    expect(isWinningRecap(recap(5, 1))).toBe(false); // option-B day, not a win under A
    expect(isWinningRecap(recap(5, 2))).toBe(false);
    expect(isWinningRecap(recap(3, 2))).toBe(false);
  });

  it('is true at exactly 3 completed on a bigger list', () => {
    expect(isWinningRecap(recap(5, 3))).toBe(true);
  });

  it('caps the threshold at the scheduled count (min rule)', () => {
    expect(isWinningRecap(recap(2, 2))).toBe(true); // 2 of 2 wins — threshold is min(3,2)=2
    expect(isWinningRecap(recap(1, 1))).toBe(true);
  });

  it('is true on a fully completed long list', () => {
    expect(isWinningRecap(recap(7, 7))).toBe(true);
  });
});

describe('hasWinningYesterday', () => {
  it('is false for an empty recap map (recaps not loaded yet)', () => {
    expect(hasWinningYesterday({})).toBe(false);
  });

  it('is false when every child fell short', () => {
    expect(hasWinningYesterday({ a: recap(5, 1), b: recap(4, 0) })).toBe(false);
  });

  it('is true when ANY child had a winning day', () => {
    expect(hasWinningYesterday({ a: recap(5, 1), b: recap(3, 3) })).toBe(true);
  });

  it('ignores zero-scheduled children entirely', () => {
    expect(hasWinningYesterday({ a: recap(0, 0) })).toBe(false);
    expect(hasWinningYesterday({ a: recap(0, 0), b: recap(2, 2) })).toBe(true);
  });
});
