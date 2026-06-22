/**
 * TaskTimelineSection — 14-day per-task completion grid for the Parent Insights screen.
 *
 * Layout per task row:
 *   [category dot] [task title ····] [14 day cells]
 *
 * Day cells: filled circle = completed, empty = missed, transparent = not scheduled.
 * Weekend columns (Fri when !fridayEnabled, always Sat) have a subtle tinted background.
 *
 * Category summary bars sit above each group so the parent gets a quick read
 * before scanning individual tasks.
 *
 * Weekend definition is family-aware: Israeli families (fridayEnabled = false)
 * treat Friday as weekend; international families with fridayEnabled = true treat
 * Friday as a weekday.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';
import type { TaskTimelineRow, CategorySummary, DayStatus } from '../hooks/useTaskTimeline';
import type { TaskCategory } from '../types/task';

// ─── Category meta ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<TaskCategory | 'other', { emoji: string; color: string }> = {
  learning:       { emoji: '📚', color: '#6C63FF' },
  organization:   { emoji: '🗂️', color: '#F59E0B' },
  'self-care':    { emoji: '🧼', color: '#10B981' },
  responsibility: { emoji: '🏠', color: '#3B82F6' },
  movement:       { emoji: '⚡', color: '#EF4444' },
  other:          { emoji: '📌', color: '#9CA3AF' },
};

// Hebrew day abbreviations (Sun=0…Sat=6)
const DAY_LABELS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const DAY_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RateBar({ rate, color }: { rate: number | null; color: string }) {
  if (rate === null) return null;
  return (
    <View style={styles.rateBarTrack}>
      <View style={[styles.rateBarFill, { width: `${rate}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function DayCell({ status, isWeekend }: { status: DayStatus; isWeekend: boolean }) {
  const bgColor = isWeekend ? 'rgba(99,102,241,0.06)' : 'transparent';
  let fill: string;
  switch (status) {
    case 'completed':     fill = '#10B981'; break; // green
    case 'missed':        fill = 'rgba(239,68,68,0.18)'; break; // faint red
    case 'not-scheduled': fill = 'transparent'; break;
    case 'future':        fill = 'rgba(156,163,175,0.15)'; break;
  }
  const hasBorder = status === 'missed';

  return (
    <View style={[styles.cellOuter, { backgroundColor: bgColor }]}>
      <View style={[
        styles.cellDot,
        { backgroundColor: fill },
        hasBorder && styles.cellDotBorder,
      ]} />
    </View>
  );
}

function CategoryHeader({
  summary,
  isHebrew,
  hasWeekendPattern,
}: {
  summary: CategorySummary;
  isHebrew: boolean;
  hasWeekendPattern: boolean;
}) {
  const { t } = useTranslation();
  const meta  = CATEGORY_META[(summary.category ?? 'other') as TaskCategory | 'other'];
  const label = summary.category ? t(`category.${summary.category}`) : t('category.other');

  const weekdayVsWeekend =
    hasWeekendPattern &&
    summary.weekdayRate !== null &&
    summary.weekendRate !== null &&
    Math.abs(summary.weekdayRate - summary.weekendRate) > 15;

  return (
    <View style={styles.catHeader}>
      <View style={styles.catHeaderLeft}>
        <Text style={styles.catEmoji}>{meta.emoji}</Text>
        <Text style={[styles.catLabel, { color: meta.color }]}>{label}</Text>
        <Text style={styles.catRate}>{summary.overallRate}%</Text>
      </View>

      {weekdayVsWeekend && (
        <View style={styles.weekendBadgeRow}>
          <View style={styles.weekendBadge}>
            <Text style={styles.weekendBadgeText}>
              {isHebrew ? `חול ${summary.weekdayRate}%` : `Wkdy ${summary.weekdayRate}%`}
            </Text>
          </View>
          <View style={[styles.weekendBadge, styles.weekendBadgeWe]}>
            <Text style={[styles.weekendBadgeText, { color: '#6C63FF' }]}>
              {isHebrew ? `ס״ש ${summary.weekendRate}%` : `Wknd ${summary.weekendRate}%`}
            </Text>
          </View>
        </View>
      )}

      <RateBar rate={summary.overallRate} color={meta.color} />
    </View>
  );
}

function TaskRow({
  row,
  dayLabels,
}: {
  row: TaskTimelineRow;
  dayLabels: string[];
}) {
  const meta = CATEGORY_META[(row.category ?? 'other') as TaskCategory | 'other'];

  return (
    <View style={styles.taskRow}>
      {/* Task title — truncated to leave room for dots */}
      <View style={styles.taskTitleCol}>
        <View style={[styles.categoryDot, { backgroundColor: meta.color }]} />
        <Text style={styles.taskTitle} numberOfLines={1}>{row.title}</Text>
      </View>

      {/* Day dots */}
      <View style={styles.dotsRow}>
        {row.days.map((cell, i) => (
          <DayCell key={cell.date} status={cell.status} isWeekend={cell.isWeekend} />
        ))}
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  rows:              TaskTimelineRow[];
  categorySummaries: CategorySummary[];
  hasWeekendPattern: boolean;
  fridayEnabled:     boolean;
}

export function TaskTimelineSection({
  rows, categorySummaries, hasWeekendPattern, fridayEnabled,
}: Props) {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';
  const dayLabels = isHebrew ? DAY_LABELS_HE : DAY_LABELS_EN;

  // Group rows by category
  const groups = useMemo(() => {
    const map = new Map<string, TaskTimelineRow[]>();
    for (const r of rows) {
      const k = r.category ?? 'other';
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    }
    return map;
  }, [rows]);

  // Day header labels (only show every 2nd label to avoid clutter on 14 cols)
  const headerLabels = rows[0]?.days.map((cell, i) => ({
    label:     i % 2 === 0 ? dayLabels[cell.dayOfWeek] : '',
    isWeekend: cell.isWeekend,
    date:      cell.date,
  })) ?? [];

  if (rows.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: T.text }]}>
        {isHebrew ? 'משימות לאורך זמן' : 'Tasks over time'}
      </Text>

      {/* Day-of-week header — aligned with dot columns */}
      <View style={styles.headerRow}>
        <View style={styles.taskTitleCol} />
        <View style={styles.dotsRow}>
          {headerLabels.map((h, i) => (
            <View
              key={h.date}
              style={[styles.cellOuter, h.isWeekend && styles.cellOuterWeekend]}
            >
              <Text style={[
                styles.dayLabel,
                h.isWeekend && styles.dayLabelWeekend,
              ]}>{h.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category groups */}
      {Array.from(groups.entries()).map(([catKey, taskRows]) => {
        const summary = categorySummaries.find(
          s => (s.category ?? 'other') === catKey
        );
        return (
          <View key={catKey} style={styles.group}>
            {summary && (
              <CategoryHeader
                summary={summary}
                isHebrew={isHebrew}
                hasWeekendPattern={hasWeekendPattern}
              />
            )}
            {taskRows.map(row => (
              <TaskRow key={row.taskId} row={row} dayLabels={dayLabels} />
            ))}
          </View>
        );
      })}

      {/* Weekend note */}
      {hasWeekendPattern && (
        <Text style={styles.weekendNote}>
          {isHebrew
            ? `סוף שבוע = ${fridayEnabled ? 'שבת' : 'שישי + שבת'}`
            : `Weekend = ${fridayEnabled ? 'Saturday' : 'Friday + Saturday'}`}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOT_SIZE  = 12;
const CELL_W    = 18;

const styles = StyleSheet.create({
  container:       { marginTop: 24, paddingHorizontal: 0 },
  sectionTitle:    { fontSize: 16, fontWeight: '700', marginBottom: 12, paddingHorizontal: 16 },

  headerRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 2, paddingHorizontal: 16 },
  dayLabel:        { fontSize: 9, color: '#9CA3AF', textAlign: 'center', width: CELL_W },
  dayLabelWeekend: { color: '#6C63FF' },

  group:           { marginBottom: 16 },

  // Category header
  catHeader:       { paddingHorizontal: 16, marginBottom: 6 },
  catHeaderLeft:   { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catEmoji:        { fontSize: 14, marginRight: 6 },
  catLabel:        { fontSize: 13, fontWeight: '600', marginRight: 8 },
  catRate:         { fontSize: 13, color: '#6B7280' },

  weekendBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  weekendBadge:    { backgroundColor: 'rgba(107,114,128,0.1)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  weekendBadgeWe:  { backgroundColor: 'rgba(99,102,241,0.08)' },
  weekendBadgeText:{ fontSize: 11, color: '#6B7280' },

  rateBarTrack:    { height: 3, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2, marginBottom: 2 },
  rateBarFill:     { height: 3, borderRadius: 2 },

  // Task row
  taskRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 3 },
  taskTitleCol:    { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: 8 },
  categoryDot:     { width: 6, height: 6, borderRadius: 3, marginRight: 5, flexShrink: 0 },
  taskTitle:       { fontSize: 12, color: '#374151', flex: 1 },

  // Dots
  dotsRow:         { flexDirection: 'row', alignItems: 'center' },
  cellOuter:       { width: CELL_W, height: 20, alignItems: 'center', justifyContent: 'center' },
  cellOuterWeekend:{ backgroundColor: 'rgba(99,102,241,0.06)' },
  cellDot:         { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  cellDotBorder:   { borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },

  weekendNote:     { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
});
