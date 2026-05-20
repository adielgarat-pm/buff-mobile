/**
 * GamerDashboardScreen — child dashboard for the Gamer aesthetic mode.
 *
 * Based on Stitch design 02-dashboard-no-buddy (Itay's pick) — re-skinned
 * to the BUFF brand palette per BUFF_BRAND.md §7.5 (violet canvas + lime
 * green accent, not Stitch's green-on-green palette).
 *
 * Source design: docs/teen-ui-design/dashboard-no-buddy/
 *
 * Differences from PastelDashboardScreen (the existing ChildDashboardScreen):
 *   - No BUDDY pet character (per Itay's design call — Teen/Gamer kids
 *     find the buddy "babyish")
 *   - Stat cards take prominence (Successful Days, Current Streak)
 *   - Time-of-day filter chips replace the all-tasks list
 *   - Darker, more tactical aesthetic (deep violet canvas)
 *
 * Routing: ChildDashboardScreen routes to this when themeName === 'gamer'.
 *
 * Pause Mode: respects useAppSettings.isPauseActive — shows PauseEmptyState
 * + WelcomeBackModal (per pause-mode SPEC) instead of task content.
 */
import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { usePetState } from '../../hooks/usePetState';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useBuddyRelationship } from '../../hooks/useBuddyRelationship';
import PauseEmptyState from '../../components/PauseEmptyState';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';
import { BuddyHero } from '../../components/buddy/BuddyHero';
import { BuddyToggleModal } from '../../components/buddy/BuddyToggleModal';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

// ─── BUFF brand palette (Gamer mode) — per BUFF_BRAND.md §7.5 ────────────────
const COLORS = {
  canvas:        '#1a1636',  // deep violet-navy
  surface:       '#2D2546',  // card bg
  surfaceHigh:   '#3D3556',  // modal/elevated
  border:        'rgba(255,255,255,0.10)',
  borderActive:  '#A8E63E',  // lime
  text:          '#FFFFFF',
  textMuted:     '#A78BFA',  // soft violet
  textFaint:     'rgba(255,255,255,0.50)',
  lime:          '#A8E63E',  // signal/success
  violet:        '#8b5cf6',  // primary action
} as const;

type TimeFilter = 'all' | 'morning' | 'noon' | 'afternoon' | 'evening';

const TIME_FILTERS: { key: TimeFilter; labelKey: string }[] = [
  { key: 'all',       labelKey: 'gamerDashboard.filter.all'       },
  { key: 'morning',   labelKey: 'gamerDashboard.filter.morning'   },
  { key: 'noon',      labelKey: 'gamerDashboard.filter.noon'      },
  { key: 'afternoon', labelKey: 'gamerDashboard.filter.afternoon' },
  { key: 'evening',   labelKey: 'gamerDashboard.filter.evening'   },
];

/**
 * Categorize a task's `time` field into a time-of-day bucket.
 * Tasks store time as "HH:MM" or descriptive strings — we parse with
 * a forgiving heuristic.
 */
function timeBucket(time: string | undefined): TimeFilter {
  if (!time) return 'all';

  // Try parsing HH:MM
  const m = time.match(/^(\d{1,2})(?::\d{2})?/);
  if (m) {
    const hour = parseInt(m[1], 10);
    if (hour >= 5  && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    return 'evening';
  }

  // Fallback — descriptive keyword match
  const lower = time.toLowerCase();
  if (/(morning|בוקר)/.test(lower)) return 'morning';
  if (/(noon|צהר)/.test(lower))     return 'noon';
  if (/(afternoon|אחה|אחר)/.test(lower)) return 'afternoon';
  if (/(evening|night|ערב|לילה)/.test(lower)) return 'evening';

  return 'all';
}

export default function GamerDashboardScreen() {
  const { t }       = useTranslation();
  const { profile } = useAuth();
  const { previewChildId, isChildPreview } = useMode();
  const navigation = useNavigation<Nav>();

  const childId = previewChildId ?? profile?.id ?? null;
  const { tasks, totalBalance, loading: dataLoading } = useChildData(childId);
  const { petState, loading: petLoading } = usePetState('wolf');
  const { isPauseActive } = useAppSettings();
  const { relationship, setBuddyVisible } = useBuddyRelationship(childId);
  const welcomeBack = useWelcomeBack();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [hideModalVisible, setHideModalVisible] = useState(false);

  const buddyVisible = relationship?.buddy_visible ?? true;
  const buddyLevel = relationship?.friendship_level ?? 1;
  const buddySkinId = relationship?.current_skin_id ?? null;

  // ── Filtered tasks ─────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (timeFilter === 'all') return tasks;
    return tasks.filter(t => timeBucket(t.time) === timeFilter);
  }, [tasks, timeFilter]);

  const doneCount  = filteredTasks.filter(t => t.completed).length;
  const totalCount = filteredTasks.length;
  const fuelPct    = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const atGoal     = fuelPct >= 70;

  // ── Loading ────────────────────────────────────────────────────────────
  if (dataLoading || petLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.lime} />
      </View>
    );
  }

  // ── Pause active: short-circuit to empty state ─────────────────────────
  if (isPauseActive) {
    return (
      <ScrollView style={styles.canvas} contentContainerStyle={styles.content}>
        <PauseEmptyState />
        <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
      </ScrollView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.canvas} contentContainerStyle={styles.content}>
      {/* Parent preview banner */}
      {isChildPreview && (
        <View style={[styles.previewBanner, { backgroundColor: COLORS.violet }]}>
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.previewText}>{t('gamerDashboard.previewBanner')}</Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingLabel}>
            {t('gamerDashboard.greetingPrefix')}
          </Text>
          <Text style={styles.greetingName}>
            {isChildPreview ? 'Preview' : (profile?.display_name ?? 'Hero')}
          </Text>
        </View>
        <View style={styles.iconRow}>
          <View style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.textMuted} />
          </View>
          <View style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={20} color={COLORS.textMuted} />
          </View>
        </View>
      </View>

      {/* Buddy hero region — conditional on buddy_visible */}
      {buddyVisible && (
        <View style={styles.buddyHeroRow} testID="dashboard-buddy-hero">
          <BuddyHero
            size="dashboard"
            skinId={buddySkinId}
            level={buddyLevel}
            onPress={() => navigation.navigate('GamerMeAndBuddy')}
            onClose={() => setHideModalVisible(true)}
          />
        </View>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statLabelRow}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.lime} />
            <Text style={styles.statLabel}>{t('gamerDashboard.successfulDays')}</Text>
          </View>
          <Text style={styles.statValue}>{petState.evolution_days_count}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statLabelRow}>
            <Ionicons name="flame" size={14} color={COLORS.lime} />
            <Text style={styles.statLabel}>{t('gamerDashboard.currentStreak')}</Text>
          </View>
          <Text style={[styles.statValue, { color: COLORS.lime }]}>{petState.daily_streak}</Text>
        </View>
      </View>

      {/* BUFFs total */}
      <View style={styles.buffsCard}>
        <Text style={styles.buffsLabel}>{t('gamerDashboard.totalBuffs')}</Text>
        <Text style={styles.buffsCount}>{totalBalance.toLocaleString()}</Text>
      </View>

      {/* Focus fuel meter */}
      <View style={styles.fuelCard}>
        <View style={styles.fuelHeaderRow}>
          <Text style={styles.fuelLabel}>⚡ {t('gamerDashboard.focusFuel')}</Text>
          <Text style={[styles.fuelPct, { color: atGoal ? COLORS.lime : COLORS.text }]}>
            {doneCount}/{totalCount}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[
            styles.barFill,
            { width: `${fuelPct}%`, backgroundColor: atGoal ? COLORS.lime : COLORS.violet },
          ]} />
        </View>
        {atGoal && (
          <Text style={styles.goalText}>{t('gamerDashboard.ignitionReached')}</Text>
        )}
      </View>

      {/* Time-of-day filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {TIME_FILTERS.map(({ key, labelKey }) => {
          const selected = key === timeFilter;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? `${COLORS.lime}1A` : COLORS.surface,  // 10% opacity lime when selected
                  borderColor:     selected ? COLORS.lime : COLORS.border,
                },
              ]}
              onPress={() => setTimeFilter(key)}
            >
              <Text style={[
                styles.chipText,
                { color: selected ? COLORS.lime : COLORS.textMuted },
              ]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tasks section */}
      <Text style={styles.sectionTitle}>{t('gamerDashboard.tasksHeader')}</Text>

      {filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyText}>
            {timeFilter === 'all'
              ? t('gamerDashboard.emptyAll')
              : t('gamerDashboard.emptyFiltered')}
          </Text>
        </View>
      ) : (
        filteredTasks.map(task => (
          <View
            key={task.id}
            style={[
              styles.taskCard,
              task.completed && styles.taskCardDone,
            ]}
          >
            <View style={[
              styles.checkCircle,
              {
                backgroundColor: task.completed ? COLORS.lime : 'transparent',
                borderColor:     task.completed ? COLORS.lime : COLORS.borderActive,
              },
            ]}>
              {task.completed && (
                <Ionicons name="checkmark" size={14} color={COLORS.canvas} />
              )}
            </View>
            <Text style={[
              styles.taskTitle,
              task.completed && styles.taskTitleDone,
            ]}>
              {task.title}
            </Text>
            <Text style={styles.taskCredits}>
              +{task.credits} BUFFs
            </Text>
          </View>
        ))
      )}

      <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />

      <BuddyToggleModal
        visible={hideModalVisible}
        mode="hide"
        onConfirm={async () => {
          setHideModalVisible(false);
          await setBuddyVisible(false);
        }}
        onCancel={() => setHideModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  canvas:  { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingTop: 52, paddingBottom: 40 },
  loader:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas },

  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  previewText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 2 },
  greetingName:  { color: COLORS.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  iconRow:       { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  buddyHeroRow: { alignItems: 'center', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statLabel:    { color: COLORS.text, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  statValue:    { color: COLORS.text, fontSize: 36, fontWeight: '900', lineHeight: 40 },

  buffsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buffsLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  buffsCount: { color: COLORS.lime, fontSize: 40, fontWeight: '900' },

  fuelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fuelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fuelLabel:     { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  fuelPct:       { fontSize: 14, fontWeight: '800' },
  barTrack:      { height: 8, borderRadius: 4, backgroundColor: COLORS.canvas, overflow: 'hidden' },
  barFill:       { height: '100%', borderRadius: 4 },
  goalText:      { color: COLORS.lime, fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'right' },

  filterRow: { gap: 8, paddingVertical: 4, paddingRight: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 10,
  },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText:  { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },

  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 230, 62, 0.20)',  // subtle lime border
  },
  taskCardDone: {
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle:     { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  taskTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskCredits:   { color: COLORS.lime, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
