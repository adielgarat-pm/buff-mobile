/**
 * YesterdayRecapCard — one-child read-only summary of yesterday's tasks.
 *
 * Renders inside the "Yesterday" section on Parent Dashboard.
 * Source SPEC: docs/sessions/yesterday-recap/SPEC.md §IN
 *
 * Pillar 2 contract:
 *   - No counts of failure ("X missed" is banned)
 *   - Neutral ✓ / ○ symbols, no ✗ or red
 *   - Softened copy for 0/N case ("אתמול לא היה סימון")
 *   - "All complete" gets a celebratory variant
 *
 * Visual hierarchy: muted vs the "Today" childCard — smaller padding,
 * subdued colors, smaller summary badge. Today stays the dominant signal.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';
import PhilosophyTip from './PhilosophyTip';
import type { ChildYesterdayRecap } from '../utils/yesterdayRecapUtils';

interface Props {
  childName:   string;
  childAvatar: string;
  recap:       ChildYesterdayRecap;
}

export default function YesterdayRecapCard({ childName, childAvatar, recap }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const { totalScheduled, totalCompleted, tasks } = recap;

  // Section-level filter should already prevent zero-scheduled cards.
  // Defensive: if it slips through, render nothing.
  if (totalScheduled === 0) return null;

  const isAllComplete = totalCompleted === totalScheduled;
  const isZeroMarked  = totalCompleted === 0;

  // Summary text (collapsed badge)
  //  - All complete: "7/7"
  //  - Zero marked: softened phrase (per SPEC §Open Decision 2 — option C)
  //  - Partial: "5/7"
  const summary = isZeroMarked
    ? t('yesterdayRecap.zeroMarked')                          // "אתמול לא היה סימון"
    : t('yesterdayRecap.summary', { completed: totalCompleted, total: totalScheduled });

  return (
    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      {/* Header (tappable to expand) */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.avatar}>{childAvatar}</Text>
        <Text style={[styles.name, { color: T.text }]} numberOfLines={1}>
          {childName}
        </Text>
        <Text style={[styles.summary, { color: T.textMuted }]}>{summary}</Text>
        <Text style={[styles.chevron, { color: T.textMuted }]}>{expanded ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <View style={[styles.divider, { backgroundColor: T.cardBorder }]} />

          {tasks.map(task => (
            <View key={task.taskId} style={styles.row}>
              <Text
                style={[
                  styles.mark,
                  { color: task.completed ? T.success : T.textMuted },
                ]}
                accessibilityLabel={
                  task.completed
                    ? t('yesterdayRecap.a11y.completed')
                    : t('yesterdayRecap.a11y.notMarked')
                }
              >
                {task.completed ? '✓' : '○'}
              </Text>
              <Text style={[styles.time, { color: T.textMuted }]}>{task.time}</Text>
              <Text style={[styles.title, { color: T.text }]} numberOfLines={1}>
                {task.title}
              </Text>
            </View>
          ))}

          {/* Celebration or conversation tip — never both, never blank. */}
          {isAllComplete ? (
            <Text style={[styles.celebration, { color: T.success }]}>
              {t('yesterdayRecap.allComplete')}
            </Text>
          ) : (
            <View style={styles.tipWrap}>
              <PhilosophyTip
                tipKey="yesterdayRecap.tipConversation"
                dismissible
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Muted compared to the "Today" childCard: shorter padding, no progress bar,
  // no action buttons. The summary lives on the header itself.
  card:       { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, borderWidth: 1 },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:     { fontSize: 22 },
  name:       { flex: 1, fontSize: 15, fontWeight: '600' },
  summary:    { fontSize: 13, fontWeight: '600' },
  chevron:    { fontSize: 14, marginLeft: 4 },

  body:       { marginTop: 8 },
  divider:    { height: 1, marginBottom: 8 },

  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  mark:       { fontSize: 16, width: 18, textAlign: 'center', fontWeight: '700' },
  time:       { fontSize: 12, width: 48 },
  title:      { flex: 1, fontSize: 14 },

  celebration:{ fontSize: 13, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  tipWrap:    { marginTop: 10 },
});
