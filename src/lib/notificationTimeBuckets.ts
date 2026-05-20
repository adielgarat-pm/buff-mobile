/**
 * notificationTimeBuckets — group notifications by recency.
 *
 * Source SPEC: docs/sessions/parent-notification-feed/SPEC.md § Phase 3 (OQ-B3).
 *
 * Four buckets:
 *   - Today      — created today (UTC date match)
 *   - Yesterday  — created yesterday
 *   - This week  — within last 7 days but not today/yesterday
 *   - Older      — anything older than 7 days
 *
 * Pure function — no React, no i18n. Caller supplies the labels.
 */

export type TimeBucket = 'today' | 'yesterday' | 'this_week' | 'older';

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function getTimeBucket(createdAt: string, now: Date = new Date()): TimeBucket {
  const rowMidnight = toUtcMidnight(new Date(createdAt));
  const todayMidnight = toUtcMidnight(now);
  const diffDays = Math.floor((todayMidnight - rowMidnight) / DAY_MS);

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return 'this_week';
  return 'older';
}

/** Group an ordered list (DESC by created_at) into sections per bucket. */
export interface BucketedSection<T> {
  bucket: TimeBucket;
  items:  T[];
}

export function bucketize<T extends { created_at: string }>(
  items: T[],
  now: Date = new Date(),
): BucketedSection<T>[] {
  const sections: Record<TimeBucket, T[]> = {
    today:     [],
    yesterday: [],
    this_week: [],
    older:     [],
  };
  for (const item of items) {
    sections[getTimeBucket(item.created_at, now)].push(item);
  }
  const order: TimeBucket[] = ['today', 'yesterday', 'this_week', 'older'];
  return order
    .filter((b) => sections[b].length > 0)
    .map((bucket) => ({ bucket, items: sections[bucket] }));
}
