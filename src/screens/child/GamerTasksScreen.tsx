/**
 * GamerTasksScreen — child Tasks tab for the Gamer aesthetic mode.
 *
 * Based on Stitch design 04-tasks-detail (Itay's pick) — re-skinned to
 * the BUFF brand palette per BUFF_BRAND.md §7.5 (violet canvas + lime
 * accent, not Stitch's green-on-green).
 *
 * Source design: docs/teen-ui-design/tasks-detail/
 *
 * Differences from PastelChildTasks (the existing ChildTasksScreen):
 *   - No phase tabs — all phases scroll vertically as sections
 *   - Active phase highlighted with full opacity + lime accent;
 *     past phases dimmed (opacity 0.6); upcoming phases normal
 *   - Top progress card ("X of Y tasks done") with a lime fuel bar
 *   - "Next-up" task (first incomplete in current phase) gets a lime
 *     left-bar indicator + lime border
 *   - "Suggest a task to your parent" CTA at bottom (stub)
 *
 * Routing: ChildTasksScreen routes to this when themeName === 'gamer'.
 *
 * Phase system: uses the existing 4-phase smart router from types/phase
 * (morning / school / afternoon / evening) — Stitch's "NOON" maps to
 * school+afternoon split.
 *
 * School phase: hidden entirely when !isSchoolDay (weekends + school
 * quest disabled), since getSmartPhaseForTime routes those tasks to
 * 'afternoon' anyway.
 */
import { useMemo, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { useAppSettings } from '../../hooks/useAppSettings';
import {
  Phase, PHASES, getSmartPhaseForTime, getCurrentPhase,
} from '../../types/phase';
import { isWeekendToday } from '../../utils/schoolDay';
import PauseEmptyState from '../../components/PauseEmptyState';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';

// ─── BUFF brand palette (Gamer mode) ─────────────────────────────────────────
const COLORS = {
  canvas:       '#1a1636',
  surface:      '#2D2546',
  surfaceDim:   '#231d3a',
  border:       'rgba(255,255,255,0.08)',
  borderActive: '#A8E63E',
  text:         '#FFFFFF',
  textMuted:    '#A78BFA',
  textFaint:    'rgba(255,255,255,0.55)',
  lime:         '#A8E63E',
  limeGlow:     'rgba(168, 230, 62, 0.12)',
  violet:       '#8b5cf6',
} as const;

// ─── Phase metadata for icons + ordering ─────────────────────────────────────
const PHASE_ICONS: Record<Phase, keyof typeof Ionicons.glyphMap> = {
  morning:   'sunny-outline',
  school:    'book-outline',
  afternoon: 'partly-sunny-outline',
  evening:   'moon-outline',
};

/** Format today as "Wednesday, May 7" / Hebrew equivalent. */
function formatToday(locale: 'en' | 'he'): string {
  const today = new Date();
  return today.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function GamerTasksScreen() {
  const { t, i18n }     = useTranslation();
  const locale          = (i18n.language === 'he' ? 'he' : 'en') as 'en' | 'he';
  const { profile }     = useAuth();
  const { previewChildId } = useMode();

  const childId = previewChildId ?? profile?.id ?? null;
  const {
    tasks,
    totalBalance,
    schoolEndTime,
    schoolQuestEnabled,
    loading,
    completeTask,
    uncompleteTask,
  } = useChildData(childId);

  const { settings, isPauseActive } = useAppSettings();
  const fridayEnabled     = settings?.friday_enabled ?? false;
  const welcomeBack       = useWelcomeBack();

  const [hapticsOn, setHapticsOn] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem('hapticsOn').then(v => {
      if (v !== null) setHapticsOn(v === 'true');
    });
  }, []);

  const resolvedSchoolEnd = schoolEndTime ?? '14:00';
  const isWeekend         = isWeekendToday(fridayEnabled);
  const isSchoolDay       = schoolQuestEnabled && !isWeekend;

  // ── Active phase (clock-derived) ─────────────────────────────────────────
  const activePhase: Phase = useMemo(() => {
    // When school quest is off or it's a weekend, getCurrentPhase
    // could still return 'school' (it doesn't know about schoolQuestEnabled).
    // Patch by remapping school → afternoon when !isSchoolDay.
    const base = getCurrentPhase();
    if (base === 'school' && !isSchoolDay) return 'afternoon';
    return base;
  }, [isSchoolDay]);

  // ── Today's visible tasks (filter by schedule_days + weekend) ────────────
  // Mirrors PhaseView + Lovable: a task only appears on its scheduled weekdays,
  // and school-day-only tasks (hideOnWeekend) drop out on weekends. Previously
  // this screen grouped ALL of the child's tasks regardless of day.
  const visibleTasks = useMemo(() => {
    const today = new Date().getDay(); // 0=Sun … 6=Sat
    return tasks.filter(task => {
      const scheduleDays = task.scheduleDays ?? [0, 1, 2, 3, 4, 5];
      if (!scheduleDays.includes(today)) return false;
      if (isWeekend && task.hideOnWeekend) return false;
      return true;
    });
  }, [tasks, isWeekend]);

  // ── Group tasks by phase ─────────────────────────────────────────────────
  const tasksByPhase = useMemo(() => {
    const groups: Record<Phase, typeof tasks> = {
      morning: [], school: [], afternoon: [], evening: [],
    };
    for (const task of visibleTasks) {
      const phase = getSmartPhaseForTime(task.time, resolvedSchoolEnd, isSchoolDay);
      groups[phase].push(task);
    }
    return groups;
  }, [visibleTasks, resolvedSchoolEnd, isSchoolDay]);

  // ── Totals ───────────────────────────────────────────────────────────────
  const doneCount  = visibleTasks.filter(t => t.completed).length;
  const totalCount = visibleTasks.length;
  const pct        = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const atGoal     = pct >= 70;

  // ── Visible phases (skip 'school' when not a school day) ─────────────────
  const visiblePhases: Phase[] = useMemo(() => {
    return PHASES
      .map(p => p.id)
      .filter(p => p !== 'school' || isSchoolDay);
  }, [isSchoolDay]);

  // ── First incomplete task in the active phase (the "next up") ────────────
  const nextUpId: string | null = useMemo(() => {
    const active = tasksByPhase[activePhase];
    const first  = active.find(t => !t.completed);
    return first?.id ?? null;
  }, [tasksByPhase, activePhase]);

  // ── Toggle handler ───────────────────────────────────────────────────────
  // View-as-child IS the kid's actual interface for the ~65% of families
  // where the kid uses the parent's device — not a preview. The mutation
  // already writes under `previewChildId` (line above) and RLS on
  // `daily_progress` is family-scoped, so the parent's auth session is
  // allowed to commit a completion on the kid's behalf. No preview gate.
  const onTaskTap = (taskId: string, completed: boolean) => {
    if (completed) uncompleteTask(taskId);
    else           completeTask(taskId);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.canvas} edges={['top']}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.lime} />
      </SafeAreaView>
    );
  }

  // ── Pause active: short-circuit to empty state ───────────────────────────
  if (isPauseActive) {
    return (
      <SafeAreaView style={styles.canvas} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <PauseEmptyState />
        </ScrollView>
        <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.canvas} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t('gamerTasks.title')}</Text>
            <Text style={styles.headerDate}>{formatToday(locale)}</Text>
          </View>
          <View style={styles.buffsBadge}>
            <Text style={styles.buffsValue}>{totalBalance.toLocaleString()}</Text>
            <Text style={styles.buffsLabel}>{t('gamerTasks.buffsLabel')}</Text>
          </View>
        </View>

        {/* ── Progress card ────────────────────────────────────────────── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {t('gamerTasks.progress', { done: doneCount, total: totalCount })}
            </Text>
            {atGoal && (
              <Text style={styles.progressFlavor}>{t('gamerTasks.crushingIt')}</Text>
            )}
          </View>
          <View style={styles.barTrack}>
            <View style={[
              styles.barFill,
              { width: `${pct}%`, backgroundColor: atGoal ? COLORS.lime : COLORS.violet },
            ]} />
          </View>
        </View>

        {/* ── Phase sections ───────────────────────────────────────────── */}
        {visiblePhases.map(phase => {
          const phaseTasks = tasksByPhase[phase];
          const isActive   = phase === activePhase;
          const isPast     = visiblePhases.indexOf(phase) < visiblePhases.indexOf(activePhase);
          const phaseDone  = phaseTasks.filter(t => t.completed).length;
          const phaseTotal = phaseTasks.length;

          return (
            <View
              key={phase}
              style={[styles.section, isPast && styles.sectionPast]}
            >
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name={PHASE_ICONS[phase]}
                    size={16}
                    color={isActive ? COLORS.lime : COLORS.textMuted}
                  />
                  <Text style={[
                    styles.sectionLabel,
                    { color: isActive ? COLORS.lime : COLORS.textMuted },
                  ]}>
                    {t(`gamerTasks.phase.${phase}`)}
                  </Text>
                </View>
                <Text style={[
                  styles.sectionCount,
                  { color: isActive ? COLORS.lime : COLORS.textMuted },
                ]}>
                  {phaseTotal === 0
                    ? '0/0'
                    : `${phaseDone}/${phaseTotal}${phaseDone === phaseTotal ? ' ✓' : ''}`}
                </Text>
              </View>

              {/* Task cards (or empty state) */}
              {phaseTotal === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{t('gamerTasks.freeTime')}</Text>
                </View>
              ) : (
                <View style={styles.taskList}>
                  {phaseTasks.map(task => {
                    const isNextUp = task.id === nextUpId;
                    return (
                      <View
                        key={task.id}
                        style={[
                          styles.taskCard,
                          task.completed && styles.taskCardDone,
                          isNextUp        && styles.taskCardNextUp,
                        ]}
                      >
                        {/* Next-up left bar */}
                        {isNextUp && <View style={styles.nextUpBar} />}

                        {/* Check circle */}
                        <TouchableOpacity
                          onPress={() => onTaskTap(task.id, task.completed)}
                          style={[
                            styles.checkCircle,
                            {
                              backgroundColor: task.completed ? COLORS.lime : 'transparent',
                              borderColor:     task.completed
                                ? COLORS.lime
                                : (isNextUp ? COLORS.lime : 'rgba(167,139,250,0.5)'),
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={task.completed
                            ? t('gamerTasks.markIncomplete')
                            : t('gamerTasks.markComplete')}
                        >
                          {task.completed && (
                            <Ionicons name="checkmark" size={14} color={COLORS.canvas} />
                          )}
                        </TouchableOpacity>

                        {/* Title */}
                        <Text
                          style={[
                            styles.taskTitle,
                            task.completed && styles.taskTitleDone,
                            isNextUp        && styles.taskTitleNextUp,
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>

                        {/* Credits chip */}
                        <Text style={[
                          styles.taskCredits,
                          task.completed && { opacity: 0.55 },
                        ]}>
                          +{task.credits}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Suggest-a-task CTA (stub) ────────────────────────────────── */}
        <View style={styles.suggestRow}>
          <TouchableOpacity
            style={styles.suggestBtn}
            onPress={() => { /* TODO: hook into task-suggest flow when designed */ }}
          >
            <Ionicons name="add" size={18} color={COLORS.lime} />
            <Text style={styles.suggestText}>{t('gamerTasks.suggestTask')}</Text>
          </TouchableOpacity>
        </View>

        {/* Haptics flag is read but unused in this screen — kept for future
            wiring to per-task haptic feedback. */}
        {hapticsOn ? null : null}
      </ScrollView>

      <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  canvas:  { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingBottom: 60 },

  // ── Header ────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerDate:  { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  buffsBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buffsValue: { color: COLORS.lime, fontSize: 16, fontWeight: '800' },
  buffsLabel: { color: COLORS.textMuted, fontSize: 11 },

  // ── Progress card ─────────────────────────────────────────────────────
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressTitle:  { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  progressFlavor: { color: COLORS.lime, fontSize: 11, fontWeight: '700', fontStyle: 'italic' },
  barTrack: {
    height: 8,
    backgroundColor: COLORS.canvas,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barFill: { height: '100%', borderRadius: 4 },

  // ── Section ───────────────────────────────────────────────────────────
  section:      { marginBottom: 20 },
  sectionPast:  { opacity: 0.55 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionCount:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // ── Task list ─────────────────────────────────────────────────────────
  taskList: { gap: 6 },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
  },
  taskCardDone: { opacity: 0.55 },
  taskCardNextUp: {
    borderColor: COLORS.lime,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.lime,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  nextUpBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: COLORS.lime,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle:        { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '500' },
  taskTitleDone:    { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskTitleNextUp:  { fontWeight: '700' },
  taskCredits:      { color: COLORS.lime, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // ── Empty state ───────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: COLORS.surfaceDim,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textFaint, fontSize: 13, fontStyle: 'italic' },

  // ── Suggest CTA ───────────────────────────────────────────────────────
  suggestRow: { alignItems: 'center', marginTop: 24 },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
