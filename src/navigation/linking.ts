/**
 * linking.ts — Deep link configuration for React Navigation.
 *
 * Maps incoming buff:// URLs to specific screens in the app.
 *
 * Currently registered deep links:
 *   buff://founding-100  →  FoundingHundred screen
 *   buff://join/:code    →  ChildJoinScreen prefilled with family code
 *
 * NOT in this config: buff://auth/callback (handled separately in
 * AuthContext.handleDeepLink — OAuth state needs to be parsed from
 * URL fragments before navigation, so it doesn't fit React Navigation's
 * declarative model).
 *
 * App scheme `buff` is registered in app.json (`expo.scheme`).
 * Android picks it up automatically via Expo's auto-generated manifest.
 */
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  // URL schemes the app will respond to. `buff://` is our custom scheme.
  // (Future: add `https://buffadhd.com` once Android App Links / iOS
  // Universal Links are configured. Not in MVP scope.)
  prefixes: ['buff://'],

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
