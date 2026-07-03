import { reviewStatusForConsent } from '../reviewStatus';

describe('reviewStatusForConsent', () => {
  it('routes a consented review to the public moderation queue (pending)', () => {
    expect(reviewStatusForConsent(true)).toBe('pending');
  });

  it('keeps a non-consented review private (never public)', () => {
    expect(reviewStatusForConsent(false)).toBe('private');
  });
});
