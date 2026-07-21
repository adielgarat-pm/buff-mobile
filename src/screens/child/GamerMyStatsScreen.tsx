/**
 * GamerMyStatsScreen — child "My Stats" tab for the Gamer aesthetic mode.
 *
 * Full Stitch 5B layout — LEVEL pill, 3-stat grid (Days Together /
 * Successful Days / Tasks Completed), "Progress to LEVEL N+1" bar,
 * BOOSTERS carousel. Reads from pkg/buddy-v05-backend tables via
 * useBuddyRelationship + useChildBuddyStats + useChildBuddyGifts.
 *
 * Source design: docs/teen-ui-design/me-and-buddy/5b-my-stats/
 * Behavior contract: docs/sessions/teen-ui-with-buddy-character/SPEC.md §3
 *
 * Routing: ChildMyStatsScreen routes here when themeName === 'gamer'.
 * Pause Mode: respects useAppSettings.isPauseActive — shows PauseEmptyState
 * + WelcomeBackModal instead of stat content (consistent with GamerDashboardScreen).
 *
 * Note: 5B does NOT render a buddy character image — that's 5A's job.
 * 5B is always full-layout regardless of buddy_visible (per SPEC §3.3).
 */
import { useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ChildTabsParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useBuddyRelationship } from '../../hooks/useBuddyRelationship';
import { useChildBuddyStats } from '../../hooks/useChildBuddyStats';
import { useChildBuddyGifts } from '../../hooks/useChildBuddyGifts';
import { useBuddyGiftReveal } from '../../hooks/useBuddyGiftReveal';
import PauseEmptyState from '../../components/PauseEmptyState';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';
import { LevelPill } from '../../components/buddy/LevelPill';
import { BoostersCarousel } from '../../components/buddy/BoostersCarousel';
import { BuddyGiftModal } from '../../components/buddy/BuddyGiftModal';
import { FRIENDSHIP_LEVEL_THRESHOLDS } from '../../types/buddy';
import type { BuddyRelationship } from '../../types/buddy';

// ─── BUFF brand palette (Gamer mode) — matches GamerDashboardScreen ──────────
const COLORS = {
  canvas:       '#1a1636',
  surface:      '#2D2546',
  border:       'rgba(255,255,255,0.10)',
  text:         '#FFFFFF',
  textMuted:    '#A78BFA',
  lime:         '#A8E63E',
  trackFaint:   'rgba(168,230,62,0.15)',
} as const;

export default function GamerMyStatsScreen() {
  const { t }       = useTranslation();
  const { profile } = useAuth();
  const { previewChildId } = useMode();
  // Sibling-tab navigation (this screen IS the ChildMyStats tab).
  const navigation = useNavigation<BottomTabNavigationProp<ChildTabsParamList>>();
  const openSettings = useCallback(() => navigation.navigate('ChildSettings'), [navigation]);

  const childId = previewChildId ?? profile?.id ?? null;
  const { relationship, loading: buddyLoading, refetch: refetchBuddy } = useBuddyRelationship(childId);
  useFocusEffect(useCallback(() => { refetchBuddy(); }, [refetchBuddy]));
  const { stats, loading: statsLoading }        = useChildBuddyStats(childId);
  const { gifts, loading: giftsLoading, refetch: refetchGifts, useGift } = useChildBuddyGifts(childId);
  const { isPauseActive } = useAppSettings();
  const welcomeBack = useWelcomeBack();

  const giftReveal = useBuddyGiftReveal({
    useGift,
    refetchGifts,
    refetchRelationship: refetchBuddy,
  });

  // Full-screen loader only on the FIRST load. Focus-triggered refetches
  // (refetchBuddy above) keep the last-rendered content instead of blanking
  // the whole screen — on a slow network the blank-screen-with-a-dot state
  // read as "the Stats tab is broken" (Noa feedback, 2026-07-20).
  const isLoading = buddyLoading || statsLoading || giftsLoading;
  const hasLoadedOnceRef = useRef(false);
  if (!isLoading) hasLoadedOnceRef.current = true;

  if (isLoading && !hasLoadedOnceRef.current) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.lime} />
      </View>
    );
  }

  if (isPauseActive) {
    return (
      <ScrollView style={styles.canvas} contentContainerStyle={styles.content}>
        <Header t={t} onSettingsPress={openSettings} />
        <PauseEmptyState />
        <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
      </ScrollView>
    );
  }

  // Fresh child (no buddy row yet) — render as L1 with zero stats. EOD will
  // backfill when the first successful day lands.
  const level = (relationship?.friendship_level ?? 1) as BuddyRelationship['friendship_level'];
  const successfulDays = relationship?.successful_days_count ?? 0;
  const daysTogether   = stats?.daysTogether   ?? 0;
  const tasksCompleted = stats?.tasksCompleted ?? 0;

  const progress = progressToNextLevel(successfulDays, level);

  return (
    <ScrollView style={styles.canvas} contentContainerStyle={styles.content}>
      <Header t={t} onSettingsPress={openSettings} />

      <View style={styles.levelRow}>
        <LevelPill level={level} />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label={t('gamerMyStats.statDaysTogether')}
          value={String(daysTogether)}
          accent
        />
        <StatCard
          label={t('gamerMyStats.statSuccessfulDays')}
          value={String(successfulDays)}
        />
        <StatCard
          label={t('gamerMyStats.statTasksCompleted')}
          value={String(tasksCompleted)}
        />
      </View>

      {progress && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            {t('gamerMyStats.progressToNextLevel', { level: level + 1 })}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.percent * 100}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.boostersSection}>
        <BoostersCarousel
          gifts={gifts}
          currentLevel={level}
          onPress={giftReveal.open}
        />
      </View>

      <BuddyGiftModal {...giftReveal.modalProps} />
      <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
    </ScrollView>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function progressToNextLevel(
  days: number,
  level: BuddyRelationship['friendship_level'],
): { percent: number; remaining: number } | null {
  if (level === 5) return null;
  const prev = level === 1 ? 0 : FRIENDSHIP_LEVEL_THRESHOLDS[level];
  const next = FRIENDSHIP_LEVEL_THRESHOLDS[(level + 1) as 2 | 3 | 4 | 5];
  const total = next - prev;
  const done  = Math.max(0, Math.min(total, days - prev));
  return {
    percent:   total === 0 ? 0 : done / total,
    remaining: total - done,
  };
}

function Header({ t, onSettingsPress }: {
  t: (k: string) => string;
  onSettingsPress: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.title}>{t('gamerMyStats.title')}</Text>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onSettingsPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('tabs.child.menu')}
        testID="stats-settings-btn"
      >
        <Ionicons name="settings-outline" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent && { color: COLORS.lime }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas:  { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingTop: 52, paddingBottom: 40 },
  loader:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: COLORS.lime,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
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

  levelRow: {
    marginBottom: 20,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 6,
    lineHeight: 36,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  progressSection: {
    marginBottom: 28,
  },
  progressLabel: {
    color:         COLORS.textMuted,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  8,
  },
  progressTrack: {
    height:          8,
    borderRadius:    4,
    backgroundColor: COLORS.trackFaint,
    overflow:        'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: COLORS.lime,
    borderRadius:    4,
  },

  boostersSection: {
    marginBottom: 24,
  },
});
