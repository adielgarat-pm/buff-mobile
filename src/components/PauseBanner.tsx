/**
 * PauseBanner — compact pause-status indicator for parent dashboard.
 *
 * Rendered at the top of ParentDashboardScreen when pause is active.
 * Reminds the parent that tasks are hidden from the kids, and gives
 * a one-tap resume.
 *
 * Source SPEC: docs/sessions/pause-mode/SPEC.md §Scope / Parent UI
 *
 * When not paused: renders nothing.
 */
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../hooks/useAppSettings';
import { PARENT_THEME as T } from '../theme';

function formatDate(isoTs: string, locale: 'en' | 'he'): string {
  const date = new Date(isoTs);
  return date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function PauseBanner() {
  const { t, i18n }    = useTranslation();
  const locale         = (i18n.language === 'he' ? 'he' : 'en') as 'en' | 'he';
  const { isPauseActive, pauseUntil, resumePause } = useAppSettings();
  const [busy, setBusy] = useState(false);

  if (!isPauseActive) return null;

  const subtitle = pauseUntil
    ? t('pause.statusActive', { date: formatDate(pauseUntil, locale) })
    : t('pause.statusActiveIndefinite');

  const handleResume = async () => {
    setBusy(true);
    await resumePause();
    setBusy(false);
  };

  return (
    <View style={[styles.banner, { backgroundColor: T.accent }]}>
      <Ionicons name="pause-circle" size={20} color="#fff" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.title}>{t('pause.dashboardBanner')}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={handleResume} disabled={busy} style={styles.resumeBtn}>
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.resumeText}>{t('pause.resumeButton')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner:      { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 20, marginTop: 12, marginBottom: 4 },
  title:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  subtitle:    { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  resumeBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  resumeText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
});
