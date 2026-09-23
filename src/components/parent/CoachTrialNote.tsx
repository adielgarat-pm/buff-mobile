/**
 * CoachTrialNote — the three one-time BUFF Coach trial moments on the parent
 * dashboard (Freemium v2, D: Adi 2026-09-23; copy approved by Adi, Hebrew
 * verbatim).
 *
 *   started — positive, in-context: the coach is on for 14 days.
 *   ending  — 4 days left; tap opens what the coach found so far.
 *   ended   — the trial is over; everything the child uses stays free and a
 *             weekly insight continues. [Keep BUFF Coach] [Close].
 *
 * Rules (Pillar 1 + 2, CLAUDE.md): parent-only (renders nothing for a child
 * profile), never in onboarding, no loss/shame framing, dismissible, each
 * phase shown once per family. On iOS (no IAP yet) the purchase button is
 * hidden; on web it opens the Paywall, which routes to the Android app.
 */
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useFamilyTrial } from '../../hooks/useFamilyTrial';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  childName?:  string;
  childId?:    string | null;
}

export const CoachTrialNote: React.FC<Props> = ({ childName = '', childId = null }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { phase, dismiss } = useFamilyTrial();

  if (profile?.role === 'child' || phase === 'none') return null;

  const canBuyHere = Platform.OS !== 'ios';

  if (phase === 'ending') {
    return (
      <TouchableOpacity
        testID="coach-trial-note-ending"
        style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}
        activeOpacity={0.85}
        accessibilityRole="button"
        onPress={() => {
          dismiss();
          navigation.navigate('ParentInsights', { childId: childId ?? undefined });
        }}
      >
        <Text style={[styles.body, { color: T.text }]}>{t('coachTrial.ending')}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={`coach-trial-note-${phase}`}
      style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}
    >
      <Text style={[styles.body, { color: T.text }]}>
        {t(phase === 'started' ? 'coachTrial.started' : 'coachTrial.ended', { name: childName })}
      </Text>
      <View style={styles.row}>
        {phase === 'ended' && canBuyHere && (
          <TouchableOpacity
            testID="coach-trial-keep"
            style={[styles.primary, { backgroundColor: T.accent }]}
            accessibilityRole="button"
            onPress={() => {
              dismiss();
              navigation.navigate('Paywall', { childName: childName || undefined });
            }}
          >
            <Text style={styles.primaryText}>{t('coachTrial.keep')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          testID="coach-trial-close"
          style={styles.secondary}
          accessibilityRole="button"
          onPress={dismiss}
        >
          <Text style={[styles.secondaryText, { color: T.textMuted }]}>{t('coachTrial.close')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card:          { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  body:          { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  primary:       { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  primaryText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondary:     { paddingVertical: 10, paddingHorizontal: 8 },
  secondaryText: { fontSize: 14, fontWeight: '600' },
});
