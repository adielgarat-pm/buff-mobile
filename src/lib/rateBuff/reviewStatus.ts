/**
 * Review status selection (pure — unit tested).
 *
 * Happy ratings (≥4★) enter the moderation queue as 'pending'. Adi approves
 * them → they become public testimonials (RLS exposes only status='approved').
 * Low ratings are stored 'private' so they NEVER appear publicly but still
 * reach Adi via the Admin Tester Board. No store CTA is ever shown for these.
 *
 * `reviews.status` has no CHECK constraint (verified 2026-06-20), so 'private'
 * is a free-text value that the public SELECT policy (status='approved') hides.
 */
export type ReviewStatus = 'pending' | 'private';

export const HAPPY_THRESHOLD = 4;

export function reviewStatusForRating(rating: number): ReviewStatus {
  return rating >= HAPPY_THRESHOLD ? 'pending' : 'private';
}

/** Whether a high-intent (store / public) CTA may be offered for this rating. */
export function isHighIntent(rating: number): boolean {
  return rating >= HAPPY_THRESHOLD;
}
