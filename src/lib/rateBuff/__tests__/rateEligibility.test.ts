import {
  isRateEligible,
  RATE_MIN_DAYS,
  RATE_MIN_SESSIONS,
  RATE_LOCAL_COOLDOWN_DAYS,
  type RateEligibilityState,
} from '../rateEligibility';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

const base = (over: Partial<RateEligibilityState> = {}): RateEligibilityState => ({
  isInstalledContext: true,
  alreadyRated: false,
  firstSeenAt: NOW - (RATE_MIN_DAYS + 1) * DAY,
  sessions: RATE_MIN_SESSIONS,
  lastPromptedAt: null,
  now: NOW,
  ...over,
});

describe('isRateEligible', () => {
  it('eligible once retained (installed, ≥7d, ≥3 sessions, not rated, no cooldown)', () => {
    expect(isRateEligible(base())).toBe(true);
  });

  it('not eligible in a non-installed (browser tab) context — install nudge wins there', () => {
    expect(isRateEligible(base({ isInstalledContext: false }))).toBe(false);
  });

  it('never asks again once rated', () => {
    expect(isRateEligible(base({ alreadyRated: true }))).toBe(false);
  });

  it('waits until first-seen is recorded', () => {
    expect(isRateEligible(base({ firstSeenAt: null }))).toBe(false);
  });

  it('requires the user to be retained ≥7 days', () => {
    expect(isRateEligible(base({ firstSeenAt: NOW - (RATE_MIN_DAYS - 1) * DAY }))).toBe(false);
  });

  it('requires ≥3 sessions', () => {
    expect(isRateEligible(base({ sessions: RATE_MIN_SESSIONS - 1 }))).toBe(false);
  });

  it('respects the 90-day local cooldown after a dismiss', () => {
    expect(isRateEligible(base({ lastPromptedAt: NOW - (RATE_LOCAL_COOLDOWN_DAYS - 1) * DAY }))).toBe(false);
    expect(isRateEligible(base({ lastPromptedAt: NOW - (RATE_LOCAL_COOLDOWN_DAYS + 1) * DAY }))).toBe(true);
  });
});
