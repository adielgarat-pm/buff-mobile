/**
 * Write a review to the existing `reviews` table (Lovable's pipeline, reused).
 *
 * RLS (verified 2026-06-20): INSERT for authenticated requires
 * `user_id = auth.uid()`. The rater is always a parent (kids never log in), so
 * the parent's auth session satisfies this. No migration — the table + policies
 * already exist and feed buffadhd.com's TestimonialsSection after moderation.
 */
import { supabase } from '../../integrations/supabase/client';
import { reviewStatusForRating } from './reviewStatus';

export interface SubmitReviewArgs {
  rating: number;
  /** Free text; trimmed. Empty → stored as null. */
  text: string;
  displayName: string;
  familyId: string | null;
  userId: string;
  /** Current UI language for `detected_lang` (translation happens at moderation). */
  lang: string;
}

export async function submitReview(args: SubmitReviewArgs): Promise<{ error: Error | null }> {
  const trimmed = args.text.trim();
  const { error } = await supabase.from('reviews').insert({
    user_id: args.userId,
    family_id: args.familyId,
    display_name: args.displayName,
    rating: args.rating,
    review_text: trimmed.length > 0 ? trimmed : null,
    status: reviewStatusForRating(args.rating),
    detected_lang: args.lang,
  });
  return { error: error ? new Error(error.message) : null };
}
