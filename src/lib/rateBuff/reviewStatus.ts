/**
 * Review status selection (pure — unit tested).
 *
 * The parent explicitly consents to publishing. Consent → the review enters the
 * moderation queue as 'pending'; Adi approves it in the Admin board → it becomes
 * a public testimonial (RLS exposes only status='approved'). No consent →
 * 'private': it still reaches Adi via the Admin board but NEVER appears publicly.
 *
 * This replaces the earlier sentiment gate (≥4★ = publishable). Publishing is now
 * the parent's explicit choice, independent of the star count — a low rating can
 * be shared (with moderation) and a high one can stay private (autonomy, Pillar 3).
 *
 * `reviews.status` has no CHECK constraint (verified 2026-06-20), so 'private'
 * is a free-text value that the public SELECT policy (status='approved') hides.
 */
export type ReviewStatus = 'pending' | 'private';

export function reviewStatusForConsent(consentToPublish: boolean): ReviewStatus {
  return consentToPublish ? 'pending' : 'private';
}
