/**
 * @jest-environment jsdom
 *
 * installTarget.web — visitor classification matrix (SPEC §3.1 / §6.1.1).
 * Imports .web explicitly so Metro platform resolution is bypassed in jest.
 */
import {
  classifyInstallTarget,
  buildPlayInstallUrl,
} from '../installTarget.web';

// useInstallPrompt.web (imported transitively) pulls in setupPwa.web at load;
// stub it so no beforeinstallprompt listener is registered during the test.
jest.mock('../setupPwa.web', () => ({
  getDeferredInstallPrompt: () => null,
  clearDeferredInstallPrompt: () => {},
}));

const setUA = (ua: string) =>
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });

const setStandalone = (standalone: boolean) =>
  Object.defineProperty(window, 'matchMedia', {
    value: jest.fn(() => ({ matches: standalone })),
    writable: true,
    configurable: true,
  });

const setRelatedApps = (fn: unknown) =>
  Object.defineProperty(navigator, 'getInstalledRelatedApps', {
    value: fn,
    configurable: true,
  });

const UA_DESKTOP =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const UA_ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';
const UA_ANDROID_FB =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0.0;]';
const UA_ANDROID_IG =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 Instagram 300.0.0.0 Android';
const UA_ANDROID_TIKTOK =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 BytedanceWebview/d8a21c musical_ly_2023';
const UA_IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120 Mobile/15E148 Safari/604.1';
const UA_IOS_FB =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.0;]';

beforeEach(() => {
  setStandalone(false);
  setUA(UA_DESKTOP);
  Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true });
  setRelatedApps(undefined);
});

describe('classifyInstallTarget — UA matrix', () => {
  it('Android Chrome → android-play', () => {
    setUA(UA_ANDROID_CHROME);
    const info = classifyInstallTarget();
    expect(info.target).toBe('android-play');
    expect(info.isMobile).toBe(true);
    expect(info.isInAppWebView).toBe(false);
  });

  it('Android Facebook in-app webview → android-inapp-webview', () => {
    setUA(UA_ANDROID_FB);
    expect(classifyInstallTarget().target).toBe('android-inapp-webview');
  });

  it('Android Instagram in-app webview → android-inapp-webview', () => {
    setUA(UA_ANDROID_IG);
    expect(classifyInstallTarget().target).toBe('android-inapp-webview');
  });

  it('Android TikTok in-app webview → android-inapp-webview', () => {
    setUA(UA_ANDROID_TIKTOK);
    expect(classifyInstallTarget().target).toBe('android-inapp-webview');
  });

  it('iOS Safari → ios-pwa', () => {
    setUA(UA_IOS_SAFARI);
    const info = classifyInstallTarget();
    expect(info.target).toBe('ios-pwa');
    expect(info.isMobile).toBe(true);
  });

  it('iOS Chrome (CriOS) → ios-pwa', () => {
    setUA(UA_IOS_CHROME);
    expect(classifyInstallTarget().target).toBe('ios-pwa');
  });

  it('iOS Facebook in-app webview → ios-inapp-webview', () => {
    setUA(UA_IOS_FB);
    expect(classifyInstallTarget().target).toBe('ios-inapp-webview');
  });

  it('Desktop Chrome → desktop', () => {
    setUA(UA_DESKTOP);
    const info = classifyInstallTarget();
    expect(info.target).toBe('desktop');
    expect(info.isMobile).toBe(false);
  });

  it('standalone short-circuits before any UA check (even Android)', () => {
    setUA(UA_ANDROID_CHROME);
    setStandalone(true);
    expect(classifyInstallTarget().target).toBe('standalone');
  });
});

describe('resolveInstalledState — async native-installed upgrade', () => {
  it('android-play → native-installed when the app is reported installed', async () => {
    setUA(UA_ANDROID_CHROME);
    setRelatedApps(jest.fn().mockResolvedValue([{ platform: 'play', id: 'com.buffapp.mobile' }]));
    const info = classifyInstallTarget();
    expect(info.target).toBe('android-play');
    await expect(info.resolveInstalledState()).resolves.toBe('native-installed');
  });

  it('android-play stays android-play when getInstalledRelatedApps is absent', async () => {
    setUA(UA_ANDROID_CHROME);
    setRelatedApps(undefined);
    await expect(classifyInstallTarget().resolveInstalledState()).resolves.toBe('android-play');
  });

  it('android-play stays android-play when getInstalledRelatedApps throws', async () => {
    setUA(UA_ANDROID_CHROME);
    setRelatedApps(jest.fn().mockRejectedValue(new Error('unsupported')));
    await expect(classifyInstallTarget().resolveInstalledState()).resolves.toBe('android-play');
  });

  it('does not upgrade non-android targets', async () => {
    setUA(UA_IOS_SAFARI);
    setRelatedApps(jest.fn().mockResolvedValue([{ id: 'com.buffapp.mobile' }]));
    await expect(classifyInstallTarget().resolveInstalledState()).resolves.toBe('ios-pwa');
  });
});

describe('buildPlayInstallUrl', () => {
  const CTA = '11111111-2222-4333-8444-555555555555';

  it('always starts with the canonical Play listing origin and carries the referrer', () => {
    const url = buildPlayInstallUrl(CTA, 'post-signup');
    expect(url.startsWith('https://play.google.com/store/apps/details?id=com.buffapp.mobile')).toBe(true);
    expect(url).toContain('referrer=');
    const referrer = decodeURIComponent(url.split('referrer=')[1]);
    expect(referrer).toContain('utm_source=web_cta');
    expect(referrer).toContain('utm_medium=post-signup');
    expect(referrer).toContain(`cta_id=${CTA}`);
  });

  it('sanitizes a tampered (non-UUID) cta_id', () => {
    const url = buildPlayInstallUrl('javascript:alert(1)', 'entry');
    expect(url.startsWith('https://play.google.com/store/apps/details?id=com.buffapp.mobile')).toBe(true);
    expect(decodeURIComponent(url)).toContain('cta_id=invalid');
    expect(url).not.toContain('javascript');
  });
});
