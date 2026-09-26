/**
 * Evening child-invite reminder (migration 059), client side:
 *   - the push / bell tap lands on the parent dashboard (Invite a child card)
 *   - the device time zone is read on both platforms, with an Intl fallback
 */
import * as Localization from 'expo-localization';
import { resolveRouteAction } from '../notificationRouter';
import { deviceTimeZone } from '../deviceTimeZone';

jest.mock('expo-localization', () => ({ getCalendars: jest.fn() }));
const mockedCalendars = Localization.getCalendars as jest.Mock;

describe('child_invite_reminder routing', () => {
  it('opens the parent dashboard for that child', () => {
    expect(resolveRouteAction({ type: 'child_invite_reminder', child_id: 'c1' }))
      .toEqual({ kind: 'parent_dashboard', childId: 'c1' });
  });
});

describe('deviceTimeZone', () => {
  it('uses the OS calendar time zone', () => {
    mockedCalendars.mockReturnValue([{ timeZone: 'America/New_York' }]);
    expect(deviceTimeZone()).toBe('America/New_York');
  });
  it('falls back to Intl when the calendar reports none', () => {
    mockedCalendars.mockReturnValue([{ timeZone: null }]);
    expect(deviceTimeZone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
  it('never throws', () => {
    mockedCalendars.mockImplementation(() => { throw new Error('no module'); });
    expect(() => deviceTimeZone()).not.toThrow();
  });
});
