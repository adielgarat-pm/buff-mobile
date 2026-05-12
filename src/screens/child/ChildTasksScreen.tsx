/**
 * Child Tasks — Missions tab.
 *
 * Top-level theme router:
 *   - themeName === 'gamer' → GamerTasksScreen (Stitch design 04, BUFF re-skin)
 *   - themeName === 'mint'  → PastelChildTasks (the existing 4-phase-tab UI)
 *
 * The mint implementation lives below as `PastelChildTasks` and is preserved
 * verbatim from the pre-Teen-UI version of this file.
 */
import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Phase, PHASES, getSmartPhaseForTime } from '../../types/phase';
import { PhaseView } from '../../components/PhaseView';
import { useChildTheme, useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import GamerTasksScreen from './GamerTasksScreen';

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

// ─── Top-level router ────────────────────────────────────────────────────────

export default function ChildTasksScreen() {
  const { themeName } = useTheme();
  if (themeName === 'gamer') {
    return <GamerTasksScreen />;
  }
  return <PastelChildTasks />;
}

// ─── Pastel (mint theme) implementation ──────────────────────────────────────

function PastelChildTasks() {
  const T = useChildTheme();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
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

  const resolvedSchoolEndTime = schoolEndTime ?? '14:00';
  const isSchoolDay           = schoolQuestEnabled && isWeekday();

  // Read haptics preference persisted by ChildSettingsScreen
  const [hapticsOn, setHapticsOn] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem('hapticsOn').then(v => {
      if (v !== null) setHapticsOn(v === 'true');
    });
  }, []);

  const [activePhase, setActivePhase] = useState<Phase>(() =>
    getCurrentSmartPhase(resolvedSchoolEndTime, isSchoolDay)
  );

  // Debug: log tasks once loaded to diagnose missing missions after onboarding
  useEffect(() => {
    if (loading) return;
    console.log('[ChildTasks] childId:', childId, '| tasks count:', tasks.length, '| activePhase:', activePhase);
    console.log('[ChildTasks] today (getDay):', new Date().getDay(), '| isSchoolDay:', isSchoolDay, '| schoolEndTime:', resolvedSchoolEndTime);
    if (tasks.length > 0) {
      console.log('[ChildTasks] raw tasks:', JSON.stringify(
        tasks.map(t => ({ id: t.id, title: t.title, time: t.time, scheduleDays: t.scheduleDays }))
      ));
      const today = new Date().getDay();
      const todayTasks = tasks.filter(t => t.scheduleDays?.includes(today));
      console.log('[ChildTasks] tasks passing day filter:', todayTasks.length, 'for day', today);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, childId]);

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
        <Text style={[styles.heading, { color: T.primary }]}>{t('child.heading.quests')}</Text>
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
                {i18n.language === 'he' ? p.shortLabelHe : p.shortLabel}
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
          hapticsEnabled={hapticsOn}
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
