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
import { TomorrowPreview } from '../../components/child/TomorrowPreview';
import { useChildTheme, useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { useChildSuggestions } from '../../hooks/useChildSuggestions';
import { SuggestModal, SuggestionStatusList, type SuggestPalette } from '../../components/child/ChildSuggest';
import { TeenTaskModal } from '../../components/child/TeenTaskModal';
import { useExperienceBand } from '../../hooks/useExperienceBand';
import { canSelfManageTasks } from '../../lib/experienceBand';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../../hooks/useAppSettings';
import { isWeekendToday } from '../../utils/schoolDay';
import PauseEmptyState from '../../components/PauseEmptyState';
import GamerTasksScreen from './GamerTasksScreen';
import { formatNum } from '../../lib/uiLocale';

/** Derive the current phase from the clock + school config. */
function getCurrentSmartPhase(schoolEndTime: string, isSchoolDay: boolean): Phase {
  const now  = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return getSmartPhaseForTime(hhmm, schoolEndTime, isSchoolDay);
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
    addTask,
  } = useChildData(childId);
  const { settings, isPauseActive } = useAppSettings();
  const fridayEnabled = settings?.friday_enabled ?? false;

  const { suggestions, submit, withdraw } = useChildSuggestions(childId);
  const [suggestOpen, setSuggestOpen] = useState(false);

  // pkg/teen-autonomy: teens create tasks directly; juniors propose (gate is
  // age band, not the mint/gamer skin).
  const canCreateTasks = canSelfManageTasks(useExperienceBand());
  const [createOpen, setCreateOpen] = useState(false);

  const suggestPalette: SuggestPalette = {
    overlay:    'rgba(0,0,0,0.45)',
    surface:    T.card,
    text:       T.foreground,
    textMuted:  T.mutedForeground,
    accent:     T.primary,
    accentText: T.primaryForeground,
    inputBg:    T.background,
    border:     T.border,
  };

  const resolvedSchoolEndTime = schoolEndTime ?? '14:00';
  const isWeekend             = isWeekendToday(fridayEnabled);
  const isSchoolDay           = schoolQuestEnabled && !isWeekend;

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

  // ── Pause active: short-circuit to empty state (mirrors GamerTasksScreen) ──
  if (isPauseActive) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: T.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <PauseEmptyState />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: T.background }]} edges={['top']}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[styles.heading, { color: T.primary }]}>{t('child.heading.quests')}</Text>
        <View style={[styles.buffBadge, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.buffEarned, { color: T.buff }]}>{formatNum(totalBalance)}</Text>
          <Text style={[styles.buffSep,    { color: T.mutedForeground }]}>{t('childTasks.buffsSuffix')}</Text>
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
          isWeekend={isWeekend}
          onCompleteTask={completeTask}
          onUncompleteTask={uncompleteTask}
          hapticsEnabled={hapticsOn}
        />

        {/* Tomorrow's dated tasks (camp days, bag prep) — read-only heads-up */}
        <TomorrowPreview
          tasks={tasks}
          colors={{ card: T.card, border: T.border, text: T.foreground, muted: T.mutedForeground }}
        />

        {/* Task authoring — teens create directly; juniors propose to a parent */}
        {canCreateTasks ? (
          <View style={styles.suggestRow}>
            <TouchableOpacity
              style={[styles.suggestBtn, { backgroundColor: T.card, borderColor: T.accent }]}
              onPress={() => setCreateOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={T.accent} />
              <Text style={[styles.suggestText, { color: T.accent }]}>{t('teenTask.cta', { defaultValue: 'Add a task' })}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.suggestRow}>
              <TouchableOpacity
                style={[styles.suggestBtn, { backgroundColor: T.card, borderColor: T.accent }]}
                onPress={() => setSuggestOpen(true)}
                activeOpacity={0.7}
              >
                {/* Use accent (not primary): in the Mint theme `primary` is a very pale
                    lavender that reads as disabled on the white card. accent is the
                    visible interactive purple. */}
                <Ionicons name="add" size={18} color={T.accent} />
                <Text style={[styles.suggestText, { color: T.accent }]}>{t('childSuggest.task.cta')}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <SuggestionStatusList
                suggestions={suggestions}
                kind="task"
                palette={suggestPalette}
                onWithdraw={withdraw}
              />
            </View>
          </>
        )}
      </ScrollView>

      <SuggestModal
        visible={suggestOpen}
        kind="task"
        palette={suggestPalette}
        onClose={() => setSuggestOpen(false)}
        onSubmit={({ title }) => submit({ kind: 'task', title })}
      />
      <TeenTaskModal
        visible={createOpen}
        palette={suggestPalette}
        onClose={() => setCreateOpen(false)}
        onCreate={(input) => addTask(input, { createdByChild: true })}
      />
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

  suggestRow:    { alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
  suggestBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  suggestText:   { fontSize: 13, fontWeight: '700' },
});
