import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Task, TaskCategory } from '../types/task';
import { Phase, PhaseConfig } from '../types/phase';
import { useChildTheme } from '../contexts/ThemeContext';
import { uiLocale } from '../lib/uiLocale';

// ─── Category config ──────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<TaskCategory, IoniconsName> = {
  learning:       'book-outline',
  organization:   'calendar-outline',
  'self-care':    'sparkles-outline',
  responsibility: 'home-outline',
  movement:       'walk-outline',
};

const CATEGORY_I18N_KEYS: Record<TaskCategory, string> = {
  learning:       'category.learning',
  organization:   'category.organization',
  'self-care':    'category.selfCare',
  responsibility: 'category.responsibility',
  movement:       'category.movement',
};

// ─── Out-of-window detection ──────────────────────────────────────────────────

/**
 * Returns true when the completedAt time falls outside the phase's hour window.
 * e.g. a Morning task (06–09) completed at 14:30 → out of window.
 */
function isOutOfWindow(completedAt: Date | string | undefined, phase: PhaseConfig): boolean {
  if (!completedAt) return false;
  const d = completedAt instanceof Date ? completedAt : new Date(completedAt);
  const h = d.getHours();
  // evening wraps to midnight so endHour is effectively 24
  const end = phase.id === 'evening' ? 24 : phase.endHour;
  return h < phase.startHour || h >= end;
}

/** Format a Date/string as "2:30 PM" (in the active UI language's locale). */
function formatTime(completedAt: Date | string): string {
  const d = completedAt instanceof Date ? completedAt : new Date(completedAt);
  return d.toLocaleTimeString(uiLocale(), { hour: 'numeric', minute: '2-digit' });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  task:              Task;
  phase:             PhaseConfig;
  onComplete:        (id: string) => void;
  onUncomplete:      (id: string) => void;
  /** When false, no haptic feedback fires. Defaults to true. */
  hapticsEnabled?:   boolean;
}

export function PhaseTaskCard({ task, phase, onComplete, onUncomplete, hapticsEnabled = true }: Props) {
  const T = useChildTheme();
  const [pressed, setPressed] = useState(false);
  const { t } = useTranslation();

  const outOfWindow = task.completed && isOutOfWindow(task.completedAt, phase);
  const categoryLabel = t(CATEGORY_I18N_KEYS[task.category]);
  const iconName      = CATEGORY_ICONS[task.category];

  const handlePress = () => {
    if (task.completed) {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUncomplete(task.id);
    } else {
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(task.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: task.completed ? T.primary + '18' : T.card,
          borderColor:     task.completed ? T.primary + '55' : T.border,
          shadowColor:     task.completed ? T.shadow : 'transparent',
        },
      ]}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.85}
    >
      {/* ── Checkbox ─────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.checkbox,
          {
            borderColor:     task.completed ? T.primary : T.border,
            backgroundColor: task.completed ? T.primary : 'transparent',
          },
        ]}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={16} color={T.primaryForeground} />
        )}
      </View>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Title + credits row */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color:              task.completed ? T.mutedForeground : T.foreground,
                textDecorationLine: task.completed ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text style={[styles.credits, { color: task.completed ? T.buff : T.mutedForeground }]}>
            +{task.credits}
          </Text>
        </View>

        {/* Description */}
        {task.description && !task.completed && (
          <Text style={[styles.description, { color: T.mutedForeground }]} numberOfLines={1}>
            📝 {task.description}
          </Text>
        )}

        {/* Meta row: time + category */}
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color={T.mutedForeground} />
          <Text style={[styles.metaText, { color: T.mutedForeground }]}>{task.time}</Text>

          <View style={[styles.categoryPill, { backgroundColor: T.muted }]}>
            <Ionicons name={iconName} size={10} color={T.mutedForeground} />
            <Text style={[styles.categoryText, { color: T.mutedForeground }]}>
              {categoryLabel}
            </Text>
          </View>
        </View>

        {/* Out-of-window completion timestamp */}
        {outOfWindow && task.completedAt && (
          <View style={styles.timestampRow}>
            <Ionicons name="alert-circle-outline" size={11} color={T.warning} />
            <Text style={[styles.timestampText, { color: T.warning }]}>
              Completed at {formatTime(task.completedAt)} (outside window)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    borderRadius:   14,
    borderWidth:    1,
    padding:        14,
    marginBottom:   10,
    gap:            12,
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.5,
    shadowRadius:   6,
    elevation:      2,
  },
  checkbox: {
    width:           28,
    height:          28,
    borderRadius:    14,
    borderWidth:     2,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       1,
    flexShrink:      0,
  },
  content:     { flex: 1, minWidth: 0 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title:       { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  credits:     { fontSize: 14, fontWeight: '700', flexShrink: 0 },
  description: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText:    { fontSize: 12, marginRight: 6 },
  categoryPill:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  categoryText:  { fontSize: 10, fontWeight: '500' },
  timestampRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  timestampText: { fontSize: 11, fontWeight: '500' },
});
