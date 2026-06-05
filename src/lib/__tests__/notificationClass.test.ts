import {
  classifyNotification,
  isVisibleInFeed,
  INFO_FEED_TTL_DAYS,
} from '../notificationClass';

const NOW = new Date('2026-06-05T12:00:00.000Z');

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

describe('classifyNotification', () => {
  it('classifies the known ACTION types as action', () => {
    expect(classifyNotification('parent_sos')).toBe('action');
    expect(classifyNotification('reward_redemption_requested')).toBe('action');
    expect(classifyNotification('child_suggestion')).toBe('action');
  });

  it('classifies the known INFO types as info', () => {
    expect(classifyNotification('task_completed')).toBe('info');
    expect(classifyNotification('reward_redeemed')).toBe('info');
    expect(classifyNotification('quest_milestone')).toBe('info');
    expect(classifyNotification('parent_engagement')).toBe('info');
    expect(classifyNotification('family_joined')).toBe('info');
    expect(classifyNotification('child_vibe_shared')).toBe('info');
  });

  it('fails safe: unknown / future types default to action', () => {
    expect(classifyNotification('some_new_type')).toBe('action');
    expect(classifyNotification('')).toBe('action');
  });
});

describe('isVisibleInFeed', () => {
  it('hides anything already read, regardless of class or age', () => {
    expect(isVisibleInFeed({ type: 'parent_sos', is_read: true, created_at: daysAgo(0) }, NOW)).toBe(false);
    expect(isVisibleInFeed({ type: 'task_completed', is_read: true, created_at: daysAgo(0) }, NOW)).toBe(false);
  });

  it('keeps unread ACTION items forever (no expiry)', () => {
    expect(isVisibleInFeed({ type: 'parent_sos', is_read: false, created_at: daysAgo(0) }, NOW)).toBe(true);
    expect(isVisibleInFeed({ type: 'parent_sos', is_read: false, created_at: daysAgo(100) }, NOW)).toBe(true);
    expect(isVisibleInFeed({ type: 'reward_redemption_requested', is_read: false, created_at: daysAgo(45) }, NOW)).toBe(true);
  });

  it('keeps unread INFO inside the recency window but drops it once stale', () => {
    expect(isVisibleInFeed({ type: 'task_completed', is_read: false, created_at: daysAgo(0) }, NOW)).toBe(true);
    expect(isVisibleInFeed({ type: 'task_completed', is_read: false, created_at: daysAgo(INFO_FEED_TTL_DAYS) }, NOW)).toBe(true);
    expect(isVisibleInFeed({ type: 'task_completed', is_read: false, created_at: daysAgo(INFO_FEED_TTL_DAYS + 1) }, NOW)).toBe(false);
  });

  it('treats unknown types as ACTION (visible while unread, never expires)', () => {
    expect(isVisibleInFeed({ type: 'some_new_type', is_read: false, created_at: daysAgo(365) }, NOW)).toBe(true);
  });
});
