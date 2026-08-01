/**
 * Tests for reloadOnce — the single-owner OTA reload guard. expo-updates is
 * mocked (not linked in jest); the module is isolated per test so the in-flight
 * boolean resets.
 */
jest.mock('expo-updates', () => ({
  isEnabled: true,
  reloadAsync: jest.fn(() => Promise.resolve()),
}));

function load() {
  let mod: typeof import('../reloadOnce');
  let Updates: { isEnabled: boolean; reloadAsync: jest.Mock };
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Updates = require('expo-updates');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../reloadOnce');
  });
  return { mod: mod!, Updates: Updates! };
}

describe('reloadOnce', () => {
  beforeEach(() => {
    // The mocked module (and its jest.fn) is a singleton across isolateModules,
    // so reset call counts + restore defaults between tests.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Updates = require('expo-updates');
    Updates.reloadAsync.mockReset();
    Updates.reloadAsync.mockResolvedValue(undefined);
    Updates.isEnabled = true;
  });

  test('initiates a reload when enabled and reports in-flight', async () => {
    const { mod, Updates } = load();
    Updates.reloadAsync.mockResolvedValue(undefined);
    const ok = await mod.reloadOnce('test');
    expect(ok).toBe(true);
    expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
    expect(mod.isReloadInFlight()).toBe(true);
  });

  test('second concurrent call is a no-op while in flight', async () => {
    const { mod, Updates } = load();
    Updates.reloadAsync.mockResolvedValue(undefined);
    await mod.reloadOnce('a');
    const second = await mod.reloadOnce('b');
    expect(second).toBe(false);
    expect(Updates.reloadAsync).toHaveBeenCalledTimes(1); // only the first
  });

  test('no-op (false) when updates are disabled, and not left in-flight', async () => {
    const { mod, Updates } = load();
    Updates.isEnabled = false;
    const ok = await mod.reloadOnce('test');
    expect(ok).toBe(false);
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
    expect(mod.isReloadInFlight()).toBe(false);
  });

  test('a reload error resets in-flight so a later attempt can retry', async () => {
    const { mod, Updates } = load();
    Updates.isEnabled = true;
    Updates.reloadAsync.mockRejectedValueOnce(new Error('boom'));
    const ok = await mod.reloadOnce('test');
    expect(ok).toBe(false);
    expect(mod.isReloadInFlight()).toBe(false);
  });
});
