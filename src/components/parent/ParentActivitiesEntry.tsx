/**
 * ParentActivitiesEntry — a quiet dashboard doorway to "פעילויות וציוד"
 * (Activities & gear: חוגים / קייטנות / pool days + the gear each carries).
 *
 * Why this exists: the feature had exactly one entry — a Settings row — so a
 * parent who never digs into Settings never found it (tester feedback, Noa
 * 2026-07-31). This card surfaces it on the dashboard.
 *
 * Mirrors ParentCaptureEntry in style + telemetry for one dashboard voice, with
 * three deliberate differences:
 *   1. NO feature flag — the feature is already live in Settings, so the card
 *      renders unconditionally (capture is beta-gated; this is not).
 *   2. NO beta pill and NO "new" badge (v1: measure the funnel first).
 *   3. Its own session-dedup Set (src/lib/activities/entryTelemetry.ts) so the
 *      two cards' exposures do not cross-cancel — see that file's header.
 *
 * It sits BELOW the AI insight card (activation discipline): the insight→
 * conversion job stays primary; this card never competes with it.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { logOnboardingEvent } from '../../lib/onboardingFunnel';
import { shouldLogActivitiesEntrySeen } from '../../lib/activities/entryTelemetry';
import type { RootStackParamList } from '../../navigation/types';

export const ParentActivitiesEntry: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { familyId } = useAuth();

  // Exposure, deduped per app session (see entryTelemetry.ts for why the dedup
  // lives in a module, not a ref). Without this event we cannot tell "parents
  // never saw the card" from "saw it and were not convinced" — opposite fixes.
  useEffect(() => {
    if (shouldLogActivitiesEntrySeen(familyId)) {
      logOnboardingEvent({ familyId, eventType: 'activities_entry_seen', source: 'dashboard' });
    }
  }, [familyId]);

  const onPress = () => {
    logOnboardingEvent({ familyId, eventType: 'activities_entry_tapped', source: 'dashboard' });
    navigation.navigate('Activities');
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${t('activities.entryTitle')} — ${t('activities.entrySub')}`}
    >
      <View style={styles.row}>
        <Text style={styles.emoji}>🎒</Text>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: T.text }]}>{t('activities.entryTitle')}</Text>
          <Text style={[styles.sub, { color: T.textMuted }]}>{t('activities.entrySub')}</Text>
        </View>
        <Text style={[styles.chevron, { color: T.textMuted }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 24, marginRight: 12 },
  textCol: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 13, lineHeight: 18 },
  chevron: { fontSize: 22, fontWeight: '700', marginLeft: 8 },
});
