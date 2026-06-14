/**
 * BUFF Catch telemetry — `buff_catch_played` event (SPEC §10).
 *
 * v1 is intentionally lightweight: a Sentry breadcrumb + a dev console log,
 * with NO new analytics table or schema change (keeps the package schema-free
 * and dep-free per SPEC §7/§8). This is enough to confirm the mini-game is
 * being exercised in the field.
 *
 * The §10 hypothesis — "does the daily game bring kids back?" — needs
 * server-side, queryable, per-child aggregation. That is deliberately deferred
 * to a follow-up package (a small `buff_catch_plays` table feeding the admin
 * tester board) rather than smuggled in here.
 */
import * as Sentry from '@sentry/react-native';

export interface BuffCatchPlayedEvent {
  childId:   string;
  score:     number;
  isNewBest: boolean;
}

export function trackBuffCatchPlayed(event: BuffCatchPlayedEvent): void {
  Sentry.addBreadcrumb({
    category: 'buff_catch',
    message:  'buff_catch_played',
    level:    'info',
    data:     { childId: event.childId, score: event.score, isNewBest: event.isNewBest },
  });

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[buff_catch_played]', event);
  }
}
