/**
 * Child Tasks — Missions tab.
 *
 * Four phase tabs: Morning → School → Afternoon → Evening.
 * The active tab defaults to the current time-of-day phase via getSmartPhaseForTime.
 * Each tab renders a PhaseView with the phase-filtered task list.
 */
import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phase, PHASES, getSmartPhaseForTime } from '../../types/phase';
import { PhaseView } from '../../components/PhaseView';
import { useChildTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChildData } from '../../hooks/useChildProgress';

/** Derive the current phase from the clock + school config. */
function getCurrentSmartPhase(schoolEndTime: string, isSchoolDay: boolean): Phase {
  const now  = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return getSmartPhaseForTime(hhmm, schoolEndTime, isSchoolDay);
}

/** True on Mon–Fri. */
function isWeekday(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChildTasksScreen() {
  const T = useChildTheme();
  const { profile } = useAuth();

  const childId = profile?.id ?? null;
  const {
    tasks,
    totalBalance,
    schoolEndTime,
    schoolQuestEnabled,
    loading,
    completeTask,
    uncompleteTask,
  } = useChildData(childId);

  const resolvedSchoolEndTime = schoolEndTime ?? '14:00';
  const isSchoolDay           = schoolQuestEnabled && isWeekday();

  const [activePhase, setActivePhase] = useState<Phase>(() =>
    getCurrentSmartPhase(resolvedSchoolEndTime, isSchoolDay)
  );

  const earned = useMemo(
    () => tasks.filter(t => t.completed).reduce((s, t) => s + t.credits, 0),
    [tasks],
  );
  const total = useMemo(
    () => tasks.reduce((s, t) => s + t.credits, 0),
    [tasks],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: T.background }]} edges={['top']}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={T.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: T.background }]} edges={['top']}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[styles.heading, { color: T.primary }]}>Missions</Text>
        <View style={[styles.buffBadge, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.buffEarned, { color: T.buff }]}>{totalBalance.toLocaleString()}</Text>
          <Text style={[styles.buffSep,    { color: T.mutedForeground }]}> ⚡ Buffs</Text>
        </View>
      </View>

      {/* ── Phase tab bar ─────────────────────────────────────────────────── */}
      <View style={[styles.tabBar, { backgroundColor: T.card, borderBottomColor: T.border }]}>
        {PHASES.map(p => {
          const isActive = activePhase === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.tab,
                isActive && [styles.tabActive, { borderBottomColor: T.primary }],
              ]}
              onPress={() => setActivePhase(p.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{p.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? T.primary : T.mutedForeground },
                ]}
              >
                {p.shortLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Phase content ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PhaseView
          phase={activePhase}
          tasks={tasks}
          schoolEndTime={resolvedSchoolEndTime}
          isSchoolDay={isSchoolDay}
          onCompleteTask={completeTask}
          onUncompleteTask={uncompleteTask}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  heading:       { fontSize: 26, fontWeight: '900' },
  buffBadge:     { flexDirection: 'row', alignItems: 'baseline', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  buffEarned:    { fontSize: 18, fontWeight: '800' },
  buffSep:       { fontSize: 13 },

  tabBar:        { flexDirection: 'row', borderBottomWidth: 1 },
  tab:           { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:     { borderBottomWidth: 2 },
  tabIcon:       { fontSize: 16 },
  tabLabel:      { fontSize: 11, fontWeight: '600' },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 32 },
});
