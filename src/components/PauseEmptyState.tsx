/**
 * PauseEmptyState — child-facing screen during Pause Mode.
 *
 * Renders when family pause is active. Replaces the task list / progress
 * UI with a calm, friendly "we're on a break" message.
 *
 * Source SPEC: docs/sessions/pause-mode/SPEC.md §Phases / Phase 3
 *
 * Design intent (Pillar 2 — Positive Coaching):
 *   - NO shame / failure framing
 *   - NO "X days missed" counter
 *   - Calm, slightly playful copy
 *   - When pause_until is set, mention return date
 *   - Vibe Check still accessible (separate screen — kid can flag a
 *     hard day even mid-pause)
 */
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChildTheme } from '../contexts/ThemeContext';
import { useAppSettings } from '../hooks/useAppSettings';

function formatReturnDate(isoTs: string, locale: 'en' | 'he'): string {
  const date = new Date(isoTs);
  return date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function PauseEmptyState() {
  const { t, i18n }    = useTranslation();
  const T              = useChildTheme();
  const { pauseUntil } = useAppSettings();
  const locale         = (i18n.language === 'he' ? 'he' : 'en') as 'en' | 'he';

  const subtitle = pauseUntil
    ? t('pause.childEmptySubtitle.withDate', {
        date: formatReturnDate(pauseUntil, locale),
      })
    : t('pause.childEmptySubtitle.indefinite');

  return (
    <View style={[styles.container, { backgroundColor: T.card, borderColor: T.border }]}>
      {/* Calm visual — moon/coffee/zzz to evoke rest, not failure */}
      <Text style={styles.emoji}>☕️</Text>

      <Text style={[styles.title, { color: T.foreground }]}>
        {t('pause.childEmptyTitle')}
      </Text>
      <Text style={[styles.subtitle, { color: T.mutedForeground }]}>
        {subtitle}
      </Text>

      {/* Reassurance — BUFFs are safe (visible above this card in the
          parent ScrollView). No explicit "your buffs are safe" text needed;
          the BUFFs total card sits above this. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  emoji:    { fontSize: 56, marginBottom: 16 },
  title:    { fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
