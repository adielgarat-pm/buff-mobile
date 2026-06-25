/**
 * High-intent destination (Web) — none in v1.
 *
 * On web the high-intent action is the in-house `reviews` write itself
 * (→ moderated → site testimonial). No Google-review link in v1 (decision
 * §2.1): gating a third-party review platform by sentiment is exactly what
 * Google's policy + the FTC fake-reviews rule target. First-party curation of
 * genuine testimonials on our own site is the safe path.
 */
import type { HighIntentCta } from './highIntentDestination';

export function getHighIntentCta(): HighIntentCta | null {
  return null;
}
