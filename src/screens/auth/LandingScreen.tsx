/**
 * LandingScreen — retired as a UI surface; now a thin redirect shim.
 *
 * The app no longer ships its own marketing landing (that role belongs to the
 * standalone site at https://buffadhd.com). This screen still occupies the root
 * (`/`) route so it catches anyone who lands on the app shell without a deep
 * link, and bounces them onward:
 *   • Web    → the marketing site (https://buffadhd.com). Skipped while a Google
 *              OAuth callback is in flight (Google returns to the www root with
 *              the session in the URL hash — see AuthContext `redirectTo`).
 *   • Native → straight to RoleSelection (no marketing site in front of the app).
 *
 * Marketing CTAs deep-link past this screen entirely (…/RoleSelection, …/Login).
 */
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PASTEL_MODE as T } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'Landing'>;

const MARKETING_URL = 'https://buffadhd.com/';

export default function LandingScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Don't bounce mid-OAuth: Google returns to www root with #access_token=…
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) return;
      if (typeof window !== 'undefined') window.location.replace(MARKETING_URL);
    } else {
      navigation.replace('RoleSelection');
    }
  }, [navigation]);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={T.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.canvas },
});
