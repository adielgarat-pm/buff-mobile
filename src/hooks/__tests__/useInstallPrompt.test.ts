/**
 * @jest-environment jsdom
 *
 * Tests for useInstallPrompt (web) — SPEC §2.1 decision table.
 * Imports .web explicitly so Metro platform resolution is bypassed in jest.
 * Uses jsdom so navigator/window/matchMedia are available.
 */
import { renderHook, act } from '@testing-library/react-native';
import { useInstallPrompt } from '../useInstallPrompt.web';

// ---------- mock setupPwa.web ----------
interface MockPromptEvent {
  prompt: jest.Mock;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let mockDeferredPrompt: MockPromptEvent | null = null;

jest.mock('../../lib/setupPwa.web', () => ({
  getDeferredInstallPrompt: () => mockDeferredPrompt,
  clearDeferredInstallPrompt: () => {
    mockDeferredPrompt = null;
  },
}));

// ---------- UA / matchMedia helpers ----------
const setUA = (ua: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
};

const setStandalone = (standalone: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    value: jest.fn(() => ({ matches: standalone })),
    writable: true,
    configurable: true,
  });
};

const UA_DESKTOP_CHROME =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const UA_ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';
const UA_IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120 Mobile/15E148 Safari/604.1';

beforeEach(() => {
  mockDeferredPrompt = null;
  setStandalone(false);
  setUA(UA_DESKTOP_CHROME);
  // Ensure navigator.standalone is undefined (desktop default)
  Object.defineProperty(navigator, 'standalone', {
    value: undefined,
    configurable: true,
  });
});

it('returns hidden on desktop without a deferred prompt', () => {
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('hidden');
  expect(result.current.isMobile).toBe(false);
});

it('returns install on Android Chrome when a deferred prompt is available', () => {
  setUA(UA_ANDROID_CHROME);
  mockDeferredPrompt = {
    prompt: jest.fn(),
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  };
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('install');
  expect(result.current.isMobile).toBe(true);
});

it('returns ios-safari on iOS Safari', () => {
  setUA(UA_IOS_SAFARI);
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('ios-safari');
  expect(result.current.isMobile).toBe(true);
});

it('returns ios-other on iOS Chrome (CriOS)', () => {
  setUA(UA_IOS_CHROME);
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('ios-other');
  expect(result.current.isMobile).toBe(true);
});

it('returns hidden when already installed (standalone), even with a deferred prompt', () => {
  setUA(UA_ANDROID_CHROME);
  mockDeferredPrompt = {
    prompt: jest.fn(),
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  };
  setStandalone(true);
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('hidden');
});

it('returns hidden when already installed via navigator.standalone (iOS)', () => {
  setUA(UA_IOS_SAFARI);
  Object.defineProperty(navigator, 'standalone', {
    value: true,
    configurable: true,
  });
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('hidden');
});

it('updates mode to install when beforeinstallprompt fires after mount', async () => {
  // Start with no prompt (desktop-like)
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('hidden');

  // Simulate the browser firing beforeinstallprompt later
  mockDeferredPrompt = {
    prompt: jest.fn(),
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  };
  setUA(UA_ANDROID_CHROME);
  await act(async () => {
    window.dispatchEvent(new Event('beforeinstallprompt'));
  });
  expect(result.current.mode).toBe('install');
});

it('promptInstall() calls .prompt() and clears the deferred event on accept', async () => {
  setUA(UA_ANDROID_CHROME);
  const mockPrompt = jest.fn().mockResolvedValue(undefined);
  mockDeferredPrompt = {
    prompt: mockPrompt,
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  };
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('install');

  await act(async () => {
    await result.current.promptInstall();
  });

  expect(mockPrompt).toHaveBeenCalledTimes(1);
  expect(mockDeferredPrompt).toBeNull();
  expect(result.current.mode).toBe('hidden');
});

it('promptInstall() is a no-op when there is no deferred prompt', async () => {
  const { result } = renderHook(() => useInstallPrompt());
  // Should not throw
  await act(async () => {
    await result.current.promptInstall();
  });
});

it('updates mode to hidden when appinstalled fires', async () => {
  setUA(UA_ANDROID_CHROME);
  mockDeferredPrompt = {
    prompt: jest.fn(),
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  };
  const { result } = renderHook(() => useInstallPrompt());
  expect(result.current.mode).toBe('install');

  await act(async () => {
    window.dispatchEvent(new Event('appinstalled'));
  });
  expect(result.current.mode).toBe('hidden');
});
