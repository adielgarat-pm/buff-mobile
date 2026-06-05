/**
 * notificationClass — single source of truth for how the parent bell decides
 * what is "new / still relevant".
 *
 * Source SPEC: docs/sessions/notification-bell-show-new/SPEC.md
 *   (Type → class map; OQ-N1..N6).
 *
 * The bell is a *fresh queue*, not an archive. A notification is visible iff:
 *   - it is still UNREAD (read = handled = gone), AND
 *   - it is either ACTION class (persists until handled), OR
 *     INFO class within the recency window (task-performance FYI ages out).
 *
 * Two classes (Adi-decided 2026-06-05):
 *   - ACTION — needs a parent action AND communication with the child
 *     (SOS, redemption request, child suggestion). Never auto-expires.
 *   - INFO   — pure FYI about the child's activity. Auto-expires after
 *     INFO_FEED_TTL_DAYS so it never accumulates into a guilt-pile.
 *
 * Fail-safe: any type NOT in INFO_TYPES (including unknown/future types) is
 * treated as ACTION → it persists until handled, so we never silently drop
 * something that might need a parent response.
 *
 * The SAME `isVisibleInFeed` predicate drives both the feed screen and the
 * bell badge count, so the badge can never disagree with the list (OQ-N6).
 */

export type NotificationClass = 'action' | 'info';

/** INFO-class types. Everything else falls through to ACTION (fail-safe). */
const INFO_TYPES: ReadonlySet<string> = new Set([
  'reward_redeemed',     // kid already claimed a reward — FYI
  'task_completed',      // kid finished a task — FYI
  'quest_milestone',     // legacy celebration — FYI
  'parent_engagement',   // weekly nudge to the parent — FYI
  'family_joined',       // a member joined — FYI
  'child_vibe_shared',   // kid chose to share a non-SOS mood — FYI (emitter: sibling package)
]);

/** Days an unread INFO notification stays visible before it ages out. */
export const INFO_FEED_TTL_DAYS = 7;

export function classifyNotification(type: string): NotificationClass {
  return INFO_TYPES.has(type) ? 'info' : 'action';
}

/** Minimal shape needed to decide feed visibility. */
export interface FeedVisibilityInput {
  type:       string;
  is_read:    boolean;
  created_at: string; // ISO-8601
}

function ageInDays(createdAtIso: string, now: Date): number {
  const created = new Date(createdAtIso).getTime();
  if (Number.isNaN(created)) return 0; // malformed date → treat as fresh, don't hide
  return (now.getTime() - created) / (1000 * 60 * 60 * 24);
}

/**
 * Is this notification currently visible in the bell feed?
 *   unread AND (ACTION  OR  INFO within INFO_FEED_TTL_DAYS)
 */
export function isVisibleInFeed(n: FeedVisibilityInput, now: Date = new Date()): boolean {
  if (n.is_read) return false;
  if (classifyNotification(n.type) === 'action') return true;
  return ageInDays(n.created_at, now) <= INFO_FEED_TTL_DAYS;
}
