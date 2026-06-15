/**
 * GamerMeAndBuddyScreen — Stitch 5A "Me & Buddy" screen.
 *
 * Stack-pushed from GamerDashboardScreen (tap on Buddy) and from
 * ChildSettings (Menu/Profile entry — wired in chunk 3-C). Renders the
 * hero buddy + relationship state in detail. The no-character variant
 * (5B) lives at GamerMyStatsScreen — this screen always shows the buddy.
 *
 * Source design: docs/teen-ui-design/me-and-buddy/5a-with-buddy/
 * Behavior contract: docs/sessions/teen-ui-with-buddy-character/SPEC.md §3.4
 */
import { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useBuddyRelationship } from '../../hooks/useBuddyRelationship';
import { useChildBuddyStats } from '../../hooks/useChildBuddyStats';
import { useChildBuddyGifts } from '../../hooks/useChildBuddyGifts';
import { useBuddyGiftReveal } from '../../hooks/useBuddyGiftReveal';
import { usePetState } from '../../hooks/usePetState';
import PauseEmptyState from '../../components/PauseEmptyState';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';
import { LevelPill } from '../../components/buddy/LevelPill';
import { BoostersCarousel } from '../../components/buddy/BoostersCarousel';
import { BuddyGiftModal } from '../../components/buddy/BuddyGiftModal';
import { BuddyHero } from '../../components/buddy/BuddyHero';
import { getBuddyDefaultName } from '../../components/buddy/buddyAssets';
import {
  FRIENDSHIP_LEVEL_THRESHOLDS,
  friendshipLevelI18nKey,
} from '../../types/buddy';
import type { BuddyRelationship } from '../../types/buddy';
import type { RootStackParamList } from '../../navigation/types';

const COLORS = {
  canvas:     '#1a1636',
  surface:    '#2D2546',
  border:     'rgba(255,255,255,0.10)',
  text:       '#FFFFFF',
  textMuted:  '#A78BFA',
  lime:       '#A8E63E',
  faint:      'rgba(255,255,255,0.25)',
  trackFaint: 'rgba(168,230,62,0.15)',
} as const;

type Nav = StackNavigationProp<RootStackParamList>;

export default function GamerMeAndBuddyScreen() {
  const { t }       = useTranslation();
  const { profile } = useAuth();
  const { previewChildId } = useMode();
  const navigation = useNavigation<Nav>();

  const childId = previewChildId ?? profile?.id ?? null;
  const { relationship, loading: buddyLoading, refetch: refetchBuddy } = useBuddyRelationship(childId);
  useFocusEffect(useCallback(() => { refetchBuddy(); }, [refetchBuddy]));
  const { stats, loading: statsLoading }        = useChildBuddyStats(childId);
  const { gifts, loading: giftsLoading, refetch: refetchGifts, useGift } = useChildBuddyGifts(childId);
  const { petState, loading: petLoading }       = usePetState('wolf');
  const { isPauseActive } = useAppSettings();
  const welcomeBack = useWelcomeBack();

  const giftReveal = useBuddyGiftReveal({
    useGift,
    refetchGifts,
    refetchRelationship: refetchBuddy,
  });

  if (buddyLoading || statsLoading || giftsLoading || petLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.lime} />
      </View>
    );
  }

  const level = (relationship?.friendship_level ?? 1) as BuddyRelationship['friendship_level'];
  const successfulDays = relationship?.successful_days_count ?? 0;
  const daysTogether   = stats?.daysTogether   ?? 0;
  const tasksCompleted = stats?.tasksCompleted ?? 0;

  // BUDDY skin follows the child's PetSkinPicker choice when
  // buddy_relationships.current_skin_id is null (see GamerDashboardScreen
  // for the same fallback). The default-name lookup still uses the
  // buddy-specific identity (STORMY/LUNA) — non-buddy skins (tiger, shark,
  // dragon, …) fall back to the generic "Buddy" label and the kid can
  // rename via the BuddyNameModal.
  const skinId = relationship?.current_skin_id ?? petState.current_skin;
  const defaultName = getBuddyDefaultName(skinId) ?? 'Buddy';
  const buddyName = relationship?.buddy_name ?? defaultName;

  // Gender resolution: profile.gender doesn't exist on live schema today
  // (per IN-2026-05-20-01) — pass null and the helper resolves to 'other'.
  const friendshipLabel = t(friendshipLevelI18nKey(level, null));
  const story = t(`buddy.story.L${level}`, { buddyName });

  const progress = progressToNextLevel(successfulDays, level);
  const themeColor    = relationship?.current_theme_color ?? null;
  const hasPendingGift = relationship?.has_pending_gift ?? false;

  return (
    <ScrollView style={styles.canvas} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="back"
          style={styles.backBtn}
          testID="me-and-buddy-back"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('meAndBuddy.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      {isPauseActive ? (
        <>
          <PauseEmptyState />
          <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
        </>
      ) : (
        <>
          <View style={styles.heroSection}>
            <BuddyHero
              size="screen"
              skinId={skinId}
              level={level}
              themeColor={themeColor}
              hasPendingGift={hasPendingGift}
            />
            <Text style={styles.buddyName}>{buddyName}</Text>
            <View style={styles.friendshipChip}>
              <Text style={styles.friendshipLabel}>{friendshipLabel}</Text>
              <View style={styles.heartsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons
                    key={n}
                    name={n <= level ? 'heart' : 'heart-outline'}
                    size={14}
                    color={n <= level ? COLORS.lime : COLORS.faint}
                    style={{ marginLeft: 2 }}
                  />
                ))}
              </View>
            </View>
            <View style={styles.levelRow}>
              <LevelPill level={level} />
            </View>
            <Text style={styles.story} testID="buddy-story">{story}</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard label={t('gamerMyStats.statDaysTogether')} value={String(daysTogether)} accent />
            <StatCard label={t('gamerMyStats.statSuccessfulDays')} value={String(successfulDays)} />
            <StatCard label={t('gamerMyStats.statTasksCompleted')} value={String(tasksCompleted)} />
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

          <BuddyGiftModal {...giftReveal.modalProps} buddyName={buddyName} />
          <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
        </>
      )}
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
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.lime,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  buddyName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  friendshipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  friendshipLabel: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heartsRow: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  levelRow: {
    marginTop: 4,
  },
  story: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 12,
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
