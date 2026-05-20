/**
 * NotificationEmptyState — calm, declarative empty state for the feed.
 *
 * Source SPEC: docs/sessions/parent-notification-feed/SPEC.md § Phase 3 (OQ-B6).
 *
 * Locked copy:
 *   HE: "אין הודעות חדשות — שקט כרגע"
 *   EN: "All caught up — quiet for now"
 *
 * NO buddy face (Pillar 2 — no sad-buddy). Simple icon + headline.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME } from '../../theme';

export const NotificationEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="notifications-off-outline" size={32} color={PARENT_THEME.textMuted} />
      </View>
      <Text style={styles.headline}>{t('notificationFeed.empty.headline')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PARENT_THEME.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontSize: 16,
    color: PARENT_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
