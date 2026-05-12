/**
 * PauseModeCard — parent-facing toggle for Pause Mode.
 *
 * Rendered in ParentSettingsScreen. Displays current pause state and lets
 * the parent pause (with duration picker) or resume.
 *
 * Source SPEC: docs/sessions/pause-mode/SPEC.md §Phases / Phase 2
 *
 * State machine:
 *   - Not paused → pill-button duration picker + "Pause BUFF" button
 *   - Paused     → status text ("Paused until X" / "Paused indefinitely")
 *                  + "Resume now" button
 *
 * Confirmation:
 *   - Tapping "Pause BUFF" opens a confirm modal (uses native Alert).
 *   - Tapping "Resume now" applies immediately (no confirm — low-risk).
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings, type PauseDuration } from '../hooks/useAppSettings';
import { PARENT_THEME as T } from '../theme';

type DurationKey = 'today' | 'threeDays' | 'oneWeek' | 'indefinite';

const DURATION_OPTIONS: { key: DurationKey; days?: number }[] = [
  { key: 'today',      days: 1 },
  { key: 'threeDays',  days: 3 },
  { key: 'oneWeek',    days: 7 },
  { key: 'indefinite' },  // pause_until = null
];

function durationToPauseDuration(key: DurationKey): PauseDuration {
  if (key === 'indefinite') return { type: 'indefinite' };
  const opt = DURATION_OPTIONS.find(o => o.key === key)!;
  return { type: 'until', days: opt.days! };
}

function formatPauseUntil(isoTs: string, locale: 'en' | 'he'): string {
  const date = new Date(isoTs);
  return date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function PauseModeCard() {
  const { t, i18n }    = useTranslation();
  const locale         = (i18n.language === 'he' ? 'he' : 'en') as 'en' | 'he';
  const {
    isPauseActive,
    pauseUntil,
    togglePause,
    resumePause,
    loading: settingsLoading,
  } = useAppSettings();

  const [selectedDuration, setSelectedDuration] = useState<DurationKey>('threeDays');
  const [busy, setBusy]                         = useState(false);

  // ── Action: pause ──────────────────────────────────────────────────────
  const handlePause = () => {
    const durationLabel = t(`pause.duration.${selectedDuration}`);
    Alert.alert(
      t('pause.confirmTitle'),
      t('pause.confirmMessage', { duration: durationLabel }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('pause.confirmAction'),
          style: 'default',
          onPress: async () => {
            setBusy(true);
            const { error } = await togglePause(durationToPauseDuration(selectedDuration));
            setBusy(false);
            if (error) {
              Alert.alert(t('common.errorTitle'), error.message);
            }
          },
        },
      ],
    );
  };

  // ── Action: resume ─────────────────────────────────────────────────────
  const handleResume = async () => {
    setBusy(true);
    const { error } = await resumePause();
    setBusy(false);
    if (error) {
      Alert.alert(t('common.errorTitle'), error.message);
    }
  };

  // ── Render: paused state ───────────────────────────────────────────────
  if (isPauseActive) {
    const subtitle = pauseUntil
      ? t('pause.statusActive', { date: formatPauseUntil(pauseUntil, locale) })
      : t('pause.statusActiveIndefinite');

    return (
      <View style={[styles.card, { backgroundColor: T.card, borderColor: T.accent, borderWidth: 2 }]}>
        <View style={styles.headerRow}>
          <Ionicons name="pause-circle" size={28} color={T.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.title, { color: T.text }]}>
              {t('pause.statusTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: T.textMuted }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: T.accent, marginTop: 16 }]}
          onPress={handleResume}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('pause.resumeButton')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: not paused ─────────────────────────────────────────────────
  return (
    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <View style={styles.headerRow}>
        <Ionicons name="pause-outline" size={24} color={T.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.title, { color: T.text }]}>
            {t('pause.parentCardTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: T.textMuted }]}>
            {t('pause.parentCardSubtitle')}
          </Text>
        </View>
      </View>

      {/* Duration picker */}
      <View style={styles.pillRow}>
        {DURATION_OPTIONS.map(({ key }) => {
          const selected = key === selectedDuration;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.pill,
                {
                  backgroundColor: selected ? T.accent : 'transparent',
                  borderColor:     selected ? T.accent : T.cardBorder,
                },
              ]}
              onPress={() => setSelectedDuration(key)}
              disabled={busy || settingsLoading}
            >
              <Text style={[styles.pillText, { color: selected ? '#fff' : T.text }]}>
                {t(`pause.duration.${key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pause button */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: T.accent }]}
        onPress={handlePause}
        disabled={busy || settingsLoading}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{t('pause.pauseButton')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card:        { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  headerRow:   { flexDirection: 'row', alignItems: 'center' },
  title:       { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  subtitle:    { fontSize: 13, lineHeight: 18 },
  pillRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 16 },
  pill:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText:    { fontSize: 13, fontWeight: '600' },
  primaryButton:     { borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
