/**
 * ParentCaptureEntry — the single, flag-gated entry point to parent capture.
 *
 * Renders nothing when FEATURE_PARENT_CAPTURE is false (production), so `main`
 * stays clean. When enabled, it's a calm card on the parent dashboard that opens
 * the "This Week" hub. See docs/sessions/parent-capture/.
 *
 * NOTE: copy is DRAFT pending Adi's review (CLAUDE.md).
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import { FEATURE_PARENT_CAPTURE } from '../../config/parentCaptureConfig';
import type { RootStackParamList } from '../../navigation/types';

export const ParentCaptureEntry: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  if (!FEATURE_PARENT_CAPTURE) return null;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}
      onPress={() => navigation.navigate('ParentThisWeek')}
      activeOpacity={0.8}
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
  sub: { fontSize: 13 },
  chevron: { fontSize: 22, fontWeight: '700', marginLeft: 8 },
});
