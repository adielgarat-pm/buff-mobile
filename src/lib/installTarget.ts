/**
 * installTarget (native no-op) — platform-split contract for the web-to-native
 * install CTA. See docs/sessions/web-to-native-cta/SPEC.md §4.1.
 *
 * The CTA is a WEB-ONLY surface: on the native app there is nothing to install,
 * so this stub reports an inert 'standalone' target and the CTA component
 * renders null. Metro resolves installTarget.web.ts for the Expo Web bundle.
 *
 * IMPORTANT: this file must never import any web/DOM module. Keeping it free of
 * web imports is what guarantees no web code leaks into the native bundle — the
 * launch-crash blind spot (IN-2026-06-17). Do not add browser globals here.
 */
export type InstallTarget =
  | 'android-play'
  | 'native-installed'
  | 'android-inapp-webview'
  | 'ios-pwa'
  | 'ios-inapp-webview'
  | 'desktop'
  | 'standalone';

export interface InstallTargetInfo {
  /** The visitor class the CTA should render for. */
  target: InstallTarget;
  /** iOS or Android (any browser). */
  isMobile: boolean;
  /** Inside an in-app webview (FB/IG/TikTok…) where install links misbehave. */
  isInAppWebView: boolean;
  /** Async upgrade of 'android-play' → 'native-installed'; never a render gate. */
  resolveInstalledState: () => Promise<InstallTarget>;
}

export function classifyInstallTarget(): InstallTargetInfo {
  return {
    target: 'standalone',
    isMobile: false,
    isInAppWebView: false,
    resolveInstalledState: async () => 'standalone',
  };
}
