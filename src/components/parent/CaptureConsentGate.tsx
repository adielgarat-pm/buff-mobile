/**
 * CaptureConsentGate — one-time consent shown before the first capture.
 *
 * Discloses that captured content is sent to an AI service for processing and
 * is not stored. Part of the gated parent-capture feature.
 * NOTE: copy is DRAFT pending Adi's review (CLAUDE.md).
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';

interface Props {
  loading: boolean;
  onContinue: () => void;
  onClose: () => void;
}

export const CaptureConsentGate: React.FC<Props> = ({ loading, onContinue, onClose }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: '#F1F1F4' }]}
          accessibilityLabel={t('capture.close')}
        >
          <Text style={[styles.closeX, { color: T.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.accent} />
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.emoji}>🔒</Text>
          <Text style={[styles.title, { color: T.text }]}>{t('capture.consent.title')}</Text>
          <Text style={[styles.text, { color: T.textMuted }]}>{t('capture.consent.body')}</Text>
          <View style={[styles.points, { borderColor: T.cardBorder, backgroundColor: T.card }]}>
            <Text style={[styles.point, { color: T.text }]}>{t('capture.consent.point1')}</Text>
            <Text style={[styles.point, { color: T.text }]}>{t('capture.consent.point2')}</Text>
            <Text style={[styles.point, { color: T.text }]}>{t('capture.consent.point3')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: T.accent }]}
            onPress={onContinue}
          >
            <Text style={styles.ctaText}>{t('capture.consent.cta')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 44, paddingHorizontal: 20, paddingBottom: 8 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 15, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 24, paddingTop: 12 },
  emoji: { fontSize: 34, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  text: { fontSize: 15, lineHeight: 22, marginBottom: 18 },
  points: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 24, gap: 10 },
  point: { fontSize: 14, lineHeight: 20 },
  cta: { borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
