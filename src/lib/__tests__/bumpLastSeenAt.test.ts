/**
 * bumpLastSeenAt — the app-foreground heartbeat.
 *
 * Web wrote last_platform = 'android-web' | 'ios-web' | 'desktop-web', which the
 * old CHECK rejected, and because it was one update last_seen_at never moved for
 * any web user (engagement scans + push suppression blind). Migration 060
 * widens the CHECK; this guards that a rejected platform/country write can
 * never take the heartbeat down with it again.
 */
import { Platform } from 'react-native';
import { bumpLastSeenAt } from '../pushTokens';
import { supabase } from '../../integrations/supabase/client';

jest.mock('expo-notifications', () => ({}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ regionCode: 'IL' }] }));
jest.mock('../pushTelemetry', () => ({ logPushStep: jest.fn() }));
jest.mock('../../integrations/supabase/client', () => ({ supabase: { from: jest.fn() } }));

const mockedFrom = supabase.from as jest.Mock;
let updates: Record<string, unknown>[];

function install(results: { error: { message: string } | null }[]) {
  updates = [];
  mockedFrom.mockImplementation(() => ({
    update: (payload: Record<string, unknown>) => {
      updates.push(payload);
      return { eq: jest.fn().mockResolvedValue(results[updates.length - 1] ?? { error: null }) };
    },
  }));
}

const originalOS = Platform.OS;
afterEach(() => { Object.defineProperty(Platform, 'OS', { value: originalOS }); });

it('web on an Android phone stamps android-web with the heartbeat, in one write', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'web' });
  Object.defineProperty(global, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Linux; Android 14)' }, configurable: true });
  install([{ error: null }]);

  await expect(bumpLastSeenAt('p1')).resolves.toBe(true);
  expect(updates).toHaveLength(1);
  expect(updates[0]).toMatchObject({ last_platform: 'android-web', last_country: 'IL' });
  expect(updates[0].last_seen_at).toEqual(expect.any(String));
});

it('a rejected platform write still records last_seen_at', async () => {
  install([
    { error: { message: 'new row violates check constraint "profiles_last_platform_check"' } },
    { error: null },
  ]);

  await expect(bumpLastSeenAt('p1')).resolves.toBe(true);
  expect(updates).toHaveLength(2);
  expect(Object.keys(updates[1])).toEqual(['last_seen_at']);
  expect(updates[1].last_seen_at).toBe(updates[0].last_seen_at);
});

it('reports failure when even the bare heartbeat fails', async () => {
  install([{ error: { message: 'x' } }, { error: { message: 'offline' } }]);
  await expect(bumpLastSeenAt('p1')).resolves.toBe(false);
});
