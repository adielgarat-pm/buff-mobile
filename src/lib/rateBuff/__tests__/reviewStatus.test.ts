import { reviewStatusForRating, isHighIntent } from '../reviewStatus';

describe('reviewStatusForRating', () => {
  it('routes 4-5★ to the public moderation queue (pending)', () => {
    expect(reviewStatusForRating(5)).toBe('pending');
    expect(reviewStatusForRating(4)).toBe('pending');
  });

  it('keeps 1-3★ private (never public, no store CTA)', () => {
    expect(reviewStatusForRating(3)).toBe('private');
    expect(reviewStatusForRating(2)).toBe('private');
    expect(reviewStatusForRating(1)).toBe('private');
  });
});

describe('isHighIntent', () => {
  it('only 4-5★ are high-intent (eligible for the store CTA)', () => {
    expect(isHighIntent(5)).toBe(true);
    expect(isHighIntent(4)).toBe(true);
    expect(isHighIntent(3)).toBe(false);
    expect(isHighIntent(1)).toBe(false);
  });
});
