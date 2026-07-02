/**
 * installTarget (web) — classifies a web visitor for the native-install CTA.
 * See docs/sessions/web-to-native-cta/SPEC.md §3.1 / §4.1.
 *
 * Reuses the UA predicates from useInstallPrompt.web (single source of truth for
 * iOS/Android/standalone detection) and adds:
 *   - in-app-webview detection (FB/IG/TikTok/Line/Twitter + generic Android wv),
 *     where beforeinstallprompt never fires and store links get swallowed;
 *   - an async upgrade to 'native-installed' via getInstalledRelatedApps().
 *
 * classifyInstallTarget() is synchronous so the CTA can render immediately;
 * resolveInstalledState() upgrades android-play → native-installed later and is
 * never used as a render gate.
 */
import { isIos, isAndroid, isStandalone } from '../hooks/useInstallPrompt.web';
import { BUFF_URLS } from './buffConfig';

export type InstallTarget =
  | 'android-play'
  | 'native-installed'
  | 'android-inapp-webview'
  | 'ios-pwa'
  | 'ios-inapp-webview'
  | 'desktop'
  | 'standalone';

export interface InstallTargetInfo {
  target: InstallTarget;
  isMobile: boolean;
  isInAppWebView: boolean;
  resolveInstalledState: () => Promise<InstallTarget>;
}

// Package id of the native Android app (Play Store listing in buffConfig).
const ANDROID_PACKAGE = 'com.buffapp.mobile';

// In-app browser (webview) signatures. Inside these, beforeinstallprompt never
// fires and Play links may be swallowed, so the CTA shows an "open in Chrome/
// Safari" breakout instead of a plain install button.
const IN_APP_WEBVIEW_RE =
  /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram|TikTok|musical_ly|BytedanceWebview|\bLine\/|Twitter|; wv\)/i;

function isInAppWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return IN_APP_WEBVIEW_RE.test(navigator.userAgent);
}

interface RelatedApp {
  platform?: string;
  id?: string;
  url?: string;
}
interface NavigatorWithRelated extends Navigator {
  getInstalledRelatedApps?: () => Promise<RelatedApp[]>;
}

/**
 * True only when the browser reports our native Android app installed. Support
 * is Chrome/Android ≥80 over HTTPS with `related_applications` in the manifest;
 * returns [] on iOS/desktop/Firefox/all webviews. Any absence or throw is
 * treated as not-installed (fall through to the store) — never a crash.
 */
async function isNativeInstalled(): Promise<boolean> {
  try {
    const nav = navigator as NavigatorWithRelated;
    if (typeof nav.getInstalledRelatedApps !== 'function') return false;
    const apps = await nav.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.some((a) => a.id === ANDROID_PACKAGE);
  } catch {
    return false;
  }
}

export function classifyInstallTarget(): InstallTargetInfo {
  const inApp = isInAppWebView();
  const mobile = isIos() || isAndroid();

  // standalone short-circuits BEFORE any UA check (already-installed PWA/app).
  let target: InstallTarget;
  if (isStandalone()) {
    target = 'standalone';
  } else if (isIos()) {
    target = inApp ? 'ios-inapp-webview' : 'ios-pwa';
  } else if (isAndroid()) {
    target = inApp ? 'android-inapp-webview' : 'android-play';
  } else {
    target = 'desktop';
  }

  const resolveInstalledState = async (): Promise<InstallTarget> => {
    if (target !== 'android-play') return target;
    return (await isNativeInstalled()) ? 'native-installed' : 'android-play';
  };

  return { target, isMobile: mobile, isInAppWebView: inApp, resolveInstalledState };
}

/**
 * The Play Store install URL with an attribution referrer. Guaranteed to start
 * with the canonical listing origin; callers pass a validated UUID cta_id.
 */
export function buildPlayInstallUrl(ctaId: string, placement: string): string {
  const base = BUFF_URLS.playStoreInstall;
  const safeId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ctaId)
    ? ctaId
    : 'invalid';
  const safePlacement = /^[a-z-]{1,32}$/i.test(placement) ? placement : 'unknown';
  const referrer = `utm_source=web_cta&utm_medium=${safePlacement}&cta_id=${safeId}`;
  return `${base}&referrer=${encodeURIComponent(referrer)}`;
}
