/**
 * Time-bucketed greeting for the parent dashboard header.
 *
 * The header used to hardcode `dashboard.goodMorning`, so a parent checking
 * "did she do it yet?" at 7pm was greeted with "Good morning" — small, but it
 * reads as the app not paying attention. Pure hour → i18n-key mapping so the
 * bucket logic is unit-testable without rendering the screen.
 *
 * Buckets (pkg/ux-parent-dashboard-ergo):
 *   hour <  12 → morning
 *   12 ≤ hour < 18 → afternoon
 *   hour ≥ 18 → evening
 */
export type GreetingBucket = 'morning' | 'afternoon' | 'evening';

const GREETING_KEY: Record<GreetingBucket, string> = {
  morning:   'dashboard.goodMorning',
  afternoon: 'dashboard.goodAfternoon',
  evening:   'dashboard.goodEvening',
};

export function greetingBucketForHour(hour: number): GreetingBucket {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/** i18n catalog key for the greeting matching the given local hour (0–23). */
export function greetingKeyForHour(hour: number): string {
  return GREETING_KEY[greetingBucketForHour(hour)];
}
