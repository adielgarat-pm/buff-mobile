/**
 * ParentCaptureEntry — the single, flag-gated entry point to the Smart Organizer.
 *
 * Renders nothing when FEATURE_PARENT_CAPTURE is false, so `main` stays clean
 * when the beta is off. See docs/sessions/smart-organizer-discovery/SPEC.md.
 *
 * Two things this card learned on 2026-07-29, after production showed that no
 * real family had EVER run a capture (9 runs ever: 8 Adi's, 1 test account):
 *
 *   1. It now says what it does. It used to read "השבוע / מה שהמשפחה צריכה
 *      לדעת" — no "message", no "paste", not even the name the feature is sold
 *      under. A parent scanning the dashboard had no reason to tap it.
 *   2. It goes straight to the capture screen. It used to open the "This Week"
 *      hub, so reaching the actual feature took two taps through a screen that
 *      reads "שקט" (empty) for anyone who has never captured anything.
 *
 * The hub is still one tap away — from inside the capture screen — so nothing
 * became unreachable.
 *
 * NOTE: copy approved by Adi 2026-07-29 — "מאחת הקבוצות", never "מקבוצת הכיתה":
 * a parent has a class group AND a scouts group AND a camp group, and naming one
 * makes the feature look school-only.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import { FEATURE_PARENT_CAPTURE } from '../../config/parentCaptureConfig';
import { useAuth } from '../../contexts/AuthContext';
import { logOnboardingEvent } from '../../lib/onboardingFunnel';
import { shouldLogEntrySeen } from '../../lib/parentCapture/entryTelemetry';
import type { RootStackParamList } from '../../navigation/types';

export const ParentCaptureEntry: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { familyId } = useAuth();

  // Exposure, deduped per app session — see entryTelemetry.ts for why the dedup
  // does not live in a ref here. Without this event we cannot tell "parents never
  // saw the card" from "saw it and were not convinced", which are opposite fixes.
  useEffect(() => {
    if (!FEATURE_PARENT_CAPTURE) return;
    if (shouldLogEntrySeen(familyId)) {
      logOnboardingEvent({ familyId, eventType: 'capture_entry_seen', source: 'dashboard' });
    }
  }, [familyId]);

  if (!FEATURE_PARENT_CAPTURE) return null;

  const onPress = () => {
    logOnboardingEvent({ familyId, eventType: 'capture_entry_tapped', source: 'dashboard' });
    navigation.navigate('ParentCapture');
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${t('capture.entryTitle')} — ${t('capture.entrySub')}`}
    >
      <View style={styles.row}>
        <Text style={styles.emoji}>🗒️</Text>
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: T.text }]}>{t('capture.entryTitle')}</Text>
            <View style={[styles.betaPill, { borderColor: T.accent }]}>
              <Text style={[styles.betaText, { color: T.accent }]}>{t('capture.betaBadge')}</Text>
            </View>
          </View>
          <Text style={[styles.sub, { color: T.textMuted }]}>{t('capture.entrySub')}</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  betaPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  betaText: { fontSize: 10, fontWeight: '700' },
  sub: { fontSize: 13, lineHeight: 18 },
  chevron: { fontSize: 22, fontWeight: '700', marginLeft: 8 },
});
