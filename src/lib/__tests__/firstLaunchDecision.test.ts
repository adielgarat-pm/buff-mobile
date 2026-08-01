/** Tests for the pure core of Layer 1 (first-launch freshness). */
import { decideFirstLaunch, shouldReloadOnPending } from '../firstLaunchDecision';

describe('decideFirstLaunch', () => {
  test('gates on a genuine first launch (enabled, prod, no flag)', () => {
    expect(decideFirstLaunch({ flag: null, enabled: true, isDev: false })).toBe('gate');
  });

  test('skips when already run once (flag set)', () => {
    expect(decideFirstLaunch({ flag: '1', enabled: true, isDev: false })).toBe('skip');
  });

  test('skips in dev', () => {
    expect(decideFirstLaunch({ flag: null, enabled: true, isDev: true })).toBe('skip');
  });

  test('skips when updates are disabled (Expo Go / sideload)', () => {
    expect(decideFirstLaunch({ flag: null, enabled: false, isDev: false })).toBe('skip');
  });
});

describe('shouldReloadOnPending', () => {
  const base = { gated: true, isUpdatePending: true, timedOut: false, acted: false };

  test('reloads when gated + pending + not timed out + not yet acted', () => {
    expect(shouldReloadOnPending(base)).toBe(true);
  });

  test('does not reload after the timeout fired (late fetch must not yank)', () => {
    expect(shouldReloadOnPending({ ...base, timedOut: true })).toBe(false);
  });

  test('does not reload twice (already acted)', () => {
    expect(shouldReloadOnPending({ ...base, acted: true })).toBe(false);
  });

  test('does not reload when not gating or nothing pending', () => {
    expect(shouldReloadOnPending({ ...base, gated: false })).toBe(false);
    expect(shouldReloadOnPending({ ...base, isUpdatePending: false })).toBe(false);
  });
});
