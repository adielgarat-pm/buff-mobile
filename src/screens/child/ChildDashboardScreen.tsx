/**
 * Child Dashboard — router that picks the right layout per theme.
 *   Gamer theme → GamerDashboardScreen (Stitch-designed, BUFF re-skinned)
 *   Mint theme  → existing Pastel layout in this file
 *
 * Real data from Supabase via useChildData.
 */
import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildTheme, useTheme } from '../../contexts/ThemeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { useChildStreak } from '../../hooks/useChildStreak';
import { useBuffCatch } from '../../hooks/useBuffCatch';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useDailyVibe } from '../../hooks/useDailyVibe';
import { useVibeDismiss } from '../../hooks/useVibeDismiss';
import { isWeekendToday } from '../../utils/schoolDay';
import { isTaskVisibleToday } from '../../utils/taskSchedule';
import { PetDisplay } from '../../components/PetDisplay';
import PauseEmptyState from '../../components/PauseEmptyState';
import OffRoutineBanner from '../../components/OffRoutineBanner';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';
import VibeCheckScreen from './VibeCheckScreen';
import GamerDashboardScreen from './GamerDashboardScreen';
import IncomingStickerModal from '../../components/child/IncomingStickerModal';
import { useIncomingSticker } from '../../hooks/useIncomingSticker';
import LowPowerBanner from '../../components/LowPowerBanner';
import SosButton from '../../components/SosButton';
import InstantBuffCard from '../../components/InstantBuffCard';
import PackingCard from '../../components/PackingCard';
import { LowPowerProvider, type LowPowerContextValue } from '../../contexts/LowPowerContext';
import type { RootStackParamList } from '../../navigation/types';
import { formatNum } from '../../lib/uiLocale';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ChildDashboardScreen() {
  const { themeName } = useTheme();

  // Route by aesthetic mode — Gamer gets the Stitch-designed dashboard,
  // Mint (Pastel) gets the existing layout below.
  if (themeName === 'gamer') {
    return <GamerDashboardScreen />;
  }

  return <PastelChildDashboard />;
}

function PastelChildDashboard() {
  const { t }       = useTranslation();
  const navigation  = useNavigation<Nav>();
  const { profile } = useAuth();
  const { isChildPreview, exitChildPreview, previewChildId, previewChildName } = useMode();
  const T = useChildTheme();

  const childId = previewChildId ?? profile?.id ?? null;
  const { tasks, totalBalance, dailyGoal, loading, refetch, offRoutineActive } = useChildData(childId);
  const { settings, isPauseActive } = useAppSettings();
  const isWeekend = isWeekendToday(settings?.friday_enabled ?? false);
  const welcomeBack = useWelcomeBack();
  // BUFF Catch entry-card stats (personal best + plays left today).
  const { best: catchBest, playsLeft: catchPlaysLeft, reload: reloadCatch } = useBuffCatch(childId);

  // Refetch on focus — completing a task on the Tasks tab writes to a separate
  // useChildData instance, so the dashboard's stat tiles are stale until we
  // re-pull when the child navigates back here. Also refresh the mini-game
  // stats so the card reflects a just-played round.
  useFocusEffect(useCallback(() => { refetch(); void reloadCatch(); }, [refetch, reloadCatch]));

  // Daily Vibe Check — once per day, gated by Pause (Pause wins per SPEC
  // Scenario C). View-as-child IS the kid's actual interface on shared
  // devices, so the modal fires there too; the recordVibe write goes
  // under `previewChildId` and `daily_vibe` RLS accepts the parent's
  // auth session for any child in the family.
  const vibe = useDailyVibe(childId);
  const { hasVibedToday, recordVibe, loading: vibeLoading, isLowPower, sosSent, sendSos, awardInstantBuff } = vibe;
  // Parent→child sticker reveal — fires on dashboard focus if one is unseen.
  const { sticker: incomingSticker, markSeen: markStickerSeen } = useIncomingSticker(childId);
  const { isDismissed: vibeDismissedToday, markDismissed: markVibeDismissed, loading: dismissLoading } = useVibeDismiss(childId);
  const shouldPromptVibe =
    !vibeLoading &&
    !dismissLoading &&
    !!childId &&
    !isPauseActive &&
    !hasVibedToday &&
    !vibeDismissedToday;

  // Low Power Mode value (consumed by SosButton / InstantBuffCard /
  // LowPowerBanner via context to avoid each component spinning up its
  // own realtime subscription).
  const lowPowerValue: LowPowerContextValue = useMemo(() => ({
    isLowPower, sosSent, hasVibedToday, sendSos, awardInstantBuff,
  }), [isLowPower, sosSent, hasVibedToday, sendSos, awardInstantBuff]);

  // Theme-scoped palettes for the LP components — Pastel mint.
  const pastelLPPalettes = useMemo(() => ({
    banner: { bg: T.muted, border: T.border, text: T.foreground },
    sos: {
      bg: T.warning, bgSent: T.muted, border: T.border,
      text: '#FFFFFF', textSent: T.mutedForeground,
    },
    instantBuff: {
      bg: T.card, border: T.border,
      title: T.mutedForeground, prompt: T.foreground,
      ctaBg: T.primary, ctaText: T.primaryForeground, ctaShadow: T.shadow,
    },
  }), [T]);

  const [justCompletedTask, setJustCompletedTask] = useState(false);

  // Only today's tasks count toward Focus Fuel — keeps HQ in sync with the
  // Quests tab (shared day-visibility rule).
  const todayTasks = tasks.filter(t => isTaskVisibleToday(t, isWeekend));
  const doneTasks  = todayTasks.filter(t => t.completed).length;
  const totalTasks = todayTasks.length;
  const fuelPct    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const atGoal     = fuelPct >= 70;

  // Streak is server-derived per child (migration 029, read from daily_progress)
  // so it's correct on shared devices. The hook refetches on focus, so the badge
  // reflects tasks completed on the Tasks tab when the child returns to HQ.
  // Hidden when 0 to avoid a demotivating "0🔥" badge before the first completion.
  const { streak } = useChildStreak(childId);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: T.background }]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <LowPowerProvider value={lowPowerValue}>
      <VibeCheckScreen
        visible={shouldPromptVibe}
        onSelect={(level, type) => {
          void recordVibe(level, type);
        }}
        onDismiss={() => { void markVibeDismissed(); }}
      />
      <IncomingStickerModal sticker={incomingSticker} onDismiss={() => { void markStickerSeen(); }} />
      <ScrollView style={{ flex: 1, backgroundColor: T.background }}
        contentContainerStyle={styles.content}>

      {/* Parent preview banner */}
      {isChildPreview && (
        <TouchableOpacity
          style={[styles.previewBanner, { backgroundColor: T.accent }]}
          onPress={exitChildPreview}
        >
          <Text style={[styles.previewText, { color: T.primaryForeground }]}>
            {t('childDashboard.previewBanner')}
          </Text>
        </TouchableOpacity>
      )}

      {offRoutineActive && !isPauseActive && <OffRoutineBanner />}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: T.mutedForeground }]}>{t('childDashboard.greeting')}</Text>
          <Text style={[styles.name, { color: T.primary }]}>
            {isChildPreview
              ? (previewChildName ?? t('childDashboard.previewName'))
              : (profile?.display_name ?? t('childDashboard.fallbackName'))} ⚡
          </Text>
        </View>
        <View style={styles.headerRight}>
          <SosButton palette={pastelLPPalettes.sos} />
          {streak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: T.muted, borderColor: T.border }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakCount, { color: T.streak }]}>{streak}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Buffs total (from credit_vault) — visible even during pause to reassure */}
      <View style={[styles.buffsCard, { backgroundColor: T.card, borderColor: T.border, shadowColor: T.shadow }]}>
        <Text style={[styles.buffsLabel, { color: T.mutedForeground }]}>{t('childDashboard.totalBuffs')}</Text>
        <Text style={[styles.buffsCount, { color: T.buff }]}>{formatNum(totalBalance)}</Text>
        <Text style={[styles.buffsHint, { color: T.mutedForeground }]}>{t('childDashboard.spendHint')}</Text>
      </View>

      {/* Pause state — short-circuits the rest of the dashboard */}
      {isPauseActive ? (
        <>
          <PauseEmptyState />
          <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
        </>
      ) : (
        <>
          <LowPowerBanner palette={pastelLPPalettes.banner} />
          <PackingCard childId={childId} />
          <DashboardActiveContent
            T={T}
            t={t}
            doneTasks={doneTasks}
            totalTasks={totalTasks}
            fuelPct={fuelPct}
            atGoal={atGoal}
            isChildPreview={isChildPreview}
            profileName={profile?.display_name ?? undefined}
            previewChildName={previewChildName}
            justCompletedTask={justCompletedTask}
            setJustCompletedTask={setJustCompletedTask}
            totalBalance={totalBalance}
            navigation={navigation}
            catchBest={catchBest}
            catchPlaysLeft={catchPlaysLeft}
          />
          <InstantBuffCard palette={pastelLPPalettes.instantBuff} />
          <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
        </>
      )}
      </ScrollView>
    </LowPowerProvider>
  );
}

// Extracted active dashboard sub-component so the top-level render stays readable
// after the pause-state branching. Renders the original fuel meter, pet card, and
// stats row. Pure presentational — no hooks of its own.
interface DashboardActiveContentProps {
  T: ReturnType<typeof useChildTheme>;
  t: (key: string, options?: Record<string, unknown>) => string;
  doneTasks: number;
  totalTasks: number;
  fuelPct: number;
  atGoal: boolean;
  isChildPreview: boolean;
  profileName: string | undefined;
  previewChildName: string | null;
  justCompletedTask: boolean;
  setJustCompletedTask: (v: boolean) => void;
  totalBalance: number;
  navigation: Nav;
  catchBest: number;
  catchPlaysLeft: number;
}

function DashboardActiveContent({
  T, t, doneTasks, totalTasks, fuelPct, atGoal, isChildPreview,
  profileName, previewChildName, justCompletedTask, setJustCompletedTask, totalBalance, navigation,
  catchBest, catchPlaysLeft,
}: DashboardActiveContentProps) {
  return (
    <>
      {/* Focus fuel meter */}
      <View style={[styles.fuelCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <View style={styles.fuelHeader}>
          <Text style={[styles.fuelLabel, { color: T.foreground }]}>{t('childDashboard.focusFuel')}</Text>
          <Text style={[styles.fuelPct, { color: atGoal ? T.success : T.primary }]}>
            {doneTasks}/{totalTasks}
          </Text>
        </View>
        <View style={[styles.barTrack, { backgroundColor: T.muted }]}>
          <View style={[
            styles.barFill,
            { width: `${fuelPct}%`, backgroundColor: atGoal ? T.success : T.primary },
          ]} />
        </View>
        <View style={styles.goalRow}>
          <View style={[styles.goalLine, { left: '70%', borderColor: T.accent }]} />
          <Text style={[styles.goalHint, { color: T.mutedForeground }]}>
            {t('childDashboard.goalHint')}
          </Text>
        </View>
      </View>

      {/* BUFF Catch — daily mini-game entry card (full-screen on tap) */}
      <TouchableOpacity
        style={[styles.catchCard, { backgroundColor: T.card, borderColor: T.border }]}
        onPress={() => navigation.navigate('BuffCatch')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('buffCatch.entryTitle')}
      >
        <Text style={styles.catchEmoji}>⚡</Text>
        <View style={styles.catchTextCol}>
          <Text style={[styles.catchTitle, { color: T.foreground }]}>{t('buffCatch.entryTitle')}</Text>
          <Text style={[styles.catchSub, { color: T.mutedForeground }]}>
            {catchPlaysLeft > 0
              ? t('buffCatch.entryStats', { best: catchBest, left: catchPlaysLeft })
              : t('buffCatch.capSub')}
          </Text>
        </View>
        <View style={[styles.catchCta, { backgroundColor: T.primary, opacity: catchPlaysLeft > 0 ? 1 : 0.5 }]}>
          <Text style={[styles.catchCtaText, { color: T.primaryForeground }]}>
            {catchPlaysLeft > 0 ? t('buffCatch.entryCta') : t('buffCatch.entryCtaTomorrow')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Virtual pet — free for all (core engagement, no longer gated). */}
      <View style={[styles.petCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <PetDisplay
          childName={isChildPreview ? (previewChildName ?? t('childDashboard.previewName')) : profileName}
          justCompletedTask={justCompletedTask}
          onTaskCompletionAck={() => setJustCompletedTask(false)}
          completedToday={doneTasks}
          totalToday={totalTasks}
        />
      </View>

      {/* Quick stat tiles */}
      <View style={styles.statsRow}>
        {[
          { id: 'done',  emoji: '✅', value: doneTasks,              label: t('childDashboard.statDone'),  color: T.success },
          { id: 'left',  emoji: '⏳', value: totalTasks - doneTasks, label: t('childDashboard.statLeft'),  color: T.foreground },
          { id: 'buffs', emoji: '⚡', value: totalBalance,           label: t('childDashboard.statBuffs'), color: T.buff },
        ].map(stat => (
          <View key={stat.id}
            style={[styles.statCard, { backgroundColor: T.card, borderColor: T.border }]}
          >
            <Text style={styles.statEmoji}>{stat.emoji}</Text>
            <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: T.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loader:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:       { padding: 20, paddingTop: 52, paddingBottom: 32 },
  previewBanner: { borderRadius: 10, padding: 10, marginBottom: 16, alignItems: 'center' },
  previewText:   { fontSize: 13, fontWeight: '600' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greeting:      { fontSize: 14 },
  name:          { fontSize: 26, fontWeight: '900' },
  streakBadge:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, gap: 4 },
  streakEmoji:   { fontSize: 18 },
  streakCount:   { fontSize: 18, fontWeight: '700' },
  buffsCard:     { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4 },
  buffsLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  buffsCount:    { fontSize: 44, fontWeight: '900', marginBottom: 4 },
  buffsHint:     { fontSize: 13 },
  fuelCard:      { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  fuelHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  fuelLabel:     { fontSize: 15, fontWeight: '700' },
  fuelPct:       { fontSize: 15, fontWeight: '700' },
  barTrack:      { height: 10, borderRadius: 5, overflow: 'visible', marginBottom: 4, position: 'relative' },
  barFill:       { height: '100%', borderRadius: 5, position: 'absolute', top: 0, left: 0 },
  goalRow:       { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  goalLine:      { position: 'absolute', top: -14, bottom: 0, width: 1, borderLeftWidth: 1, borderStyle: 'dashed' },
  goalHint:      { fontSize: 12 },
  petCard:         { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  lockedPet:       { alignItems: 'center', paddingVertical: 12 },
  lockedPetEmoji:  { fontSize: 52, marginBottom: 10 },
  lockedPetTitle:  { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  lockedPetSub:    { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  lockedPetCta:    { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  lockedPetCtaText: { fontSize: 13, fontWeight: '700' },
  catchCard:     { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  catchEmoji:    { fontSize: 30 },
  catchTextCol:  { flex: 1 },
  catchTitle:    { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  catchSub:      { fontSize: 13 },
  catchCta:      { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 },
  catchCtaText:  { fontSize: 14, fontWeight: '800' },
  statsRow:      { flexDirection: 'row', gap: 10 },
  statCard:      { flex: 1, borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center' },
  statEmoji:     { fontSize: 22, marginBottom: 6 },
  statNumber:    { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel:     { fontSize: 12 },
});
