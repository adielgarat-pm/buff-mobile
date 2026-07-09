/**
 * Tests for shareInvite — the cross-platform invite-share helper.
 *
 * Contract under test:
 *   - native → OS Share sheet (`Share.share`), returns true
 *   - web + Web Share API → navigator.share, returns true (incl. AbortError =
 *     user dismissed a sheet that DID open)
 *   - web without Web Share API → WhatsApp tab; returns false if the pop-up
 *     was blocked (nothing visible happened → caller must show a fallback)
 *   - never throws
 *
 * The jest-expo environment is node-based (no `navigator`/`window` globals),
 * so the web tests stub them on globalThis and restore afterwards — which also
 * exercises the helper's own typeof guards.
 */
import { Platform, Share } from 'react-native';
import { shareInvite } from '../shareInvite';

const MESSAGE = 'join BUFF with code ABC123';

const g = globalThis as Record<string, unknown>;
const savedGlobals: Record<string, { existed: boolean; value: unknown }> = {};

/** Stub a global (navigator/window) for one test; restored in afterEach. */
function stubGlobal(name: string, value: unknown) {
  if (!(name in savedGlobals)) {
    savedGlobals[name] = { existed: name in g, value: g[name] };
  }
  g[name] = value;
}

/** Force Platform.OS for a test; returns a restore function. */
function setPlatform(os: string) {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return () => {
    if (original) Object.defineProperty(Platform, 'OS', original);
  };
}

describe('shareInvite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    for (const [name, saved] of Object.entries(savedGlobals)) {
      if (saved.existed) g[name] = saved.value;
      else delete g[name];
      delete savedGlobals[name];
    }
  });

  test('native: opens the OS share sheet and resolves true', async () => {
    const restore = setPlatform('android');
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' } as Awaited<ReturnType<typeof Share.share>>);

    await expect(shareInvite(MESSAGE)).resolves.toBe(true);
    expect(shareSpy).toHaveBeenCalledWith({ message: MESSAGE });
    restore();
  });

  test('native: a throwing share resolves false (never throws)', async () => {
    const restore = setPlatform('android');
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('boom'));

    await expect(shareInvite(MESSAGE)).resolves.toBe(false);
    restore();
  });

  test('web: uses the Web Share API when available and resolves true', async () => {
    const restore = setPlatform('web');
    const navShare = jest.fn().mockResolvedValue(undefined);
    stubGlobal('navigator', { share: navShare });

    await expect(shareInvite(MESSAGE)).resolves.toBe(true);
    expect(navShare).toHaveBeenCalledWith({ text: MESSAGE });
    restore();
  });

  test('web: user dismissing the Web Share sheet (AbortError) still counts as shown', async () => {
    const restore = setPlatform('web');
    const abort = new Error('cancelled');
    abort.name = 'AbortError';
    stubGlobal('navigator', { share: jest.fn().mockRejectedValue(abort) });

    await expect(shareInvite(MESSAGE)).resolves.toBe(true);
    restore();
  });

  test('web without Web Share API: opens WhatsApp with the message prefilled', async () => {
    const restore = setPlatform('web');
    const open = jest.fn().mockReturnValue({});
    stubGlobal('navigator', {});
    stubGlobal('window', { open });

    await expect(shareInvite(MESSAGE)).resolves.toBe(true);
    expect(open).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent(MESSAGE)}`,
      '_blank',
    );
    restore();
  });

  test('web without Web Share API: a blocked pop-up resolves false', async () => {
    const restore = setPlatform('web');
    stubGlobal('navigator', {});
    stubGlobal('window', { open: jest.fn().mockReturnValue(null) });

    await expect(shareInvite(MESSAGE)).resolves.toBe(false);
    restore();
  });
});
