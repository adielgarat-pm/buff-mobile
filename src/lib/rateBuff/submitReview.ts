/**
 * Write a review to the existing `reviews` table (Lovable's pipeline, reused).
 *
 * RLS (verified 2026-06-20): INSERT for authenticated requires
 * `user_id = auth.uid()`. The rater is always a parent (kids never log in), so
 * the parent's auth session satisfies this. No migration — the table + policies
 * already exist and feed buffadhd.com's TestimonialsSection after moderation.
 *
 * `rating` and `review_text` are both NOT NULL in the schema, so we always send a
 * real star count (the sheet requires a selection) and an empty string — never
 * null — for a blank note.
 */
import { supabase } from '../../integrations/supabase/client';
import { reviewStatusForConsent } from './reviewStatus';

export interface SubmitReviewArgs {
  rating: number;
  /** Free text; trimmed. Empty → stored as '' (column is NOT NULL). */
  text: string;
  displayName: string;
  familyId: string | null;
  userId: string;
  /** Current UI language for `detected_lang` (translation happens at moderation). */
  lang: string;
  /** Parent ticked "you may publish my review" → moderation queue; else private. */
  consentToPublish: boolean;
}

export async function submitReview(args: SubmitReviewArgs): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('reviews').insert({
    user_id: args.userId,
    family_id: args.familyId,
    display_name: args.displayName,
    rating: args.rating,
    review_text: args.text.trim(),
    status: reviewStatusForConsent(args.consentToPublish),
    detected_lang: args.lang,
  });
  return { error: error ? new Error(error.message) : null };
}
