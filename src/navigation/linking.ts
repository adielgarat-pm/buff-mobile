/**
 * linking.ts — Deep link configuration for React Navigation.
 *
 * Maps incoming buff:// URLs to specific screens in the app.
 *
 * Currently registered deep links:
 *   buff://founding-100   →  FoundingHundred screen
 *   buff://join/:code     →  ChildJoinScreen prefilled with family code
 *   https://buffadhd.com/join/:code      →  same, via Android App Link (native)
 *   https://www.buffadhd.com/join/:code  →  same, via the Web PWA (browser URL)
 *
 * NOT in this config: buff://auth/callback (handled separately in
 * AuthContext.handleDeepLink — OAuth state needs to be parsed from
 * URL fragments before navigation, so it doesn't fit React Navigation's
 * declarative model).
 *
 * App scheme `buff` is registered in app.json (`expo.scheme`). The https hosts
 * are registered as Android App Links (app.json android.intentFilters +
 * assetlinks.json on landing-web) so an installed app intercepts the smart join
 * link directly; on web the same path is just the PWA's own URL.
 */
import { Linking } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';
import { getInstallReferrerJoinCode } from '../lib/installReferrer';
import { buildJoinDeepLink } from '../lib/buffConfig';

export const linking: LinkingOptions<RootStackParamList> = {
  // URL schemes the app responds to. `buff://` is our custom scheme; the https
  // prefixes back the smart join link (buildJoinUrl in lib/buffConfig.ts) —
  // buffadhd.com is the Android App Link host, www.buffadhd.com is the Web PWA.
  prefixes: ['buff://', 'https://buffadhd.com', 'https://www.buffadhd.com'],

  /**
   * Initial URL resolution, with the Android deferred-deep-link fallback:
   *   1. A real deep link / App Link / browser URL that launched the app.
   *   2. Otherwise, on Android only, a smart join link that routed through the
   *      Play Store carries the family code in the install referrer. We turn it
   *      into the buff://join/:code URL the `config` below already maps to
   *      ChildJoin — no bespoke navigation, the kid lands pre-filled.
   * Best-effort: getInstallReferrerJoinCode is a no-op (null) off Android and
   * never throws, so this preserves default behaviour on web/iOS.
   */
  getInitialURL: async () => {
    const url = await Linking.getInitialURL();
    if (url) return url;
    const code = await getInstallReferrerJoinCode();
    return code ? buildJoinDeepLink(code) : null;
  },

  // Path-to-screen mappings. Each key is a screen name from
  // RootStackParamList; each value is the URL path after the scheme prefix.
  config: {
    screens: {
      FoundingHundred: 'founding-100',
      ChildJoin:       'join/:code',
      // Future deep-linkable screens go here, e.g.:
      // Paywall: 'paywall',
    },
  },
};
