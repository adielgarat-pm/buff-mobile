/**
 * Child Dashboard — router that picks the right layout per theme.
 *   Gamer theme → GamerDashboardScreen (Stitch-designed, BUFF re-skinned)
 *   Mint theme  → existing Pastel layout in this file
 *
 * Real data from Supabase via useChildData.
 */
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildTheme, useTheme } from '../../contexts/ThemeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppSettings } from '../../hooks/useAppSettings';
import { PetDisplay } from '../../components/PetDisplay';
import PauseEmptyState from '../../components/PauseEmptyState';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';
import GamerDashboardScreen from './GamerDashboardScreen';
import type { RootStackParamList } from '../../navigation/types';

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
  const navigation  = useNavigation<Nav>();
  const { profile } = useAuth();
  const { isChildPreview, exitChildPreview, previewChildId } = useMode();
  const T = useChildTheme();
  const { isSubscribed } = useSubscription();

  const childId = previewChildId ?? profile?.id ?? null;
  const { tasks, totalBalance, dailyGoal, loading } = useChildData(childId);
  const { isPauseActive } = useAppSettings();
  const welcomeBack = useWelcomeBack();

  const [justCompletedTask, setJustCompletedTask] = useState(false);

  const doneTasks  = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const fuelPct    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const atGoal     = fuelPct >= 70;

  // Streak comes from pet state — keep from PetDisplay; show 0 until pet state loads
  const streak = 0; // TODO: expose from usePetState once wired up

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: T.background }]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.background }}
      contentContainerStyle={styles.content}>

      {/* Parent preview banner */}
      {isChildPreview && (
        <TouchableOpacity
          style={[styles.previewBanner, { backgroundColor: T.accent }]}
          onPress={exitChildPreview}
        >
          <Text style={[styles.previewText, { color: T.primaryForeground }]}>
            👁 Parent Preview — tap to exit
          </Text>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: T.mutedForeground }]}>Hey,</Text>
          <Text style={[styles.name, { color: T.primary }]}>
            {isChildPreview ? 'Preview' : (profile?.display_name ?? 'Hero')} ⚡
          </Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: T.muted, borderColor: T.border }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakCount, { color: T.streak }]}>{streak}</Text>
        </View>
      </View>

      {/* Buffs total (from credit_vault) — visible even during pause to reassure */}
      <View style={[styles.buffsCard, { backgroundColor: T.card, borderColor: T.border, shadowColor: T.shadow }]}>
        <Text style={[styles.buffsLabel, { color: T.mutedForeground }]}>TOTAL BUFFS</Text>
        <Text style={[styles.buffsCount, { color: T.buff }]}>{totalBalance.toLocaleString()}</Text>
        <Text style={[styles.buffsHint, { color: T.mutedForeground }]}>Spend them in the Shop →</Text>
      </View>

      {/* Pause state — short-circuits the rest of the dashboard */}
      {isPauseActive ? (
        <>
          <PauseEmptyState />
          <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
        </>
      ) : (
        <>
          <DashboardActiveContent
            T={T}
            doneTasks={doneTasks}
            totalTasks={totalTasks}
            fuelPct={fuelPct}
            atGoal={atGoal}
            isSubscribed={isSubscribed}
            isChildPreview={isChildPreview}
            profileName={profile?.display_name ?? undefined}
            justCompletedTask={justCompletedTask}
            setJustCompletedTask={setJustCompletedTask}
            totalBalance={totalBalance}
            navigation={navigation}
          />
          <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
        </>
      )}
    </ScrollView>
  );
}

// Extracted active dashboard sub-component so the top-level render stays readable
// after the pause-state branching. Renders the original fuel meter, pet card, and
// stats row. Pure presentational — no hooks of its own.
interface DashboardActiveContentProps {
  T: ReturnType<typeof useChildTheme>;
  doneTasks: number;
  totalTasks: number;
  fuelPct: number;
  atGoal: boolean;
  isSubscribed: boolean;
  isChildPreview: boolean;
  profileName: string | undefined;
  justCompletedTask: boolean;
  setJustCompletedTask: (v: boolean) => void;
  totalBalance: number;
  navigation: Nav;
}

function DashboardActiveContent({
  T, doneTasks, totalTasks, fuelPct, atGoal, isSubscribed, isChildPreview,
  profileName, justCompletedTask, setJustCompletedTask, totalBalance, navigation,
}: DashboardActiveContentProps) {
  return (
    <>
      {/* Focus fuel meter */}
      <View style={[styles.fuelCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <View style={styles.fuelHeader}>
          <Text style={[styles.fuelLabel, { color: T.foreground }]}>⚡ Focus Fuel</Text>
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
            70% = Ignition! 🏆
          </Text>
        </View>
      </View>

      {/* Virtual pet — Premium gate */}
      <View style={[styles.petCard, { backgroundColor: T.card, borderColor: T.border }]}>
        {isSubscribed ? (
          <PetDisplay
            childName={isChildPreview ? 'Preview' : profileName}
            justCompletedTask={justCompletedTask}
            onTaskCompletionAck={() => setJustCompletedTask(false)}
            completedToday={doneTasks}
            totalToday={totalTasks}
          />
        ) : (
          <TouchableOpacity
            style={styles.lockedPet}
            onPress={() => navigation.navigate('Paywall', {
              childName: isChildPreview ? undefined : profileName,
            })}
            activeOpacity={0.8}
          >
            <Text style={styles.lockedPetEmoji}>🥚</Text>
            <Text style={[styles.lockedPetTitle, { color: T.foreground }]}>Buddy locked 🔒</Text>
            <Text style={[styles.lockedPetSub, { color: T.mutedForeground }]}>
              Unlock BUFF Premium to hatch your pet
            </Text>
            <View style={[styles.lockedPetCta, { backgroundColor: T.primary }]}>
              <Text style={[styles.lockedPetCtaText, { color: T.primaryForeground }]}>Unlock ✨</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick stat tiles */}
      <View style={styles.statsRow}>
        {[
          { emoji: '✅', value: doneTasks,             label: 'Done',   color: T.success },
          { emoji: '⏳', value: totalTasks - doneTasks, label: 'Left',   color: T.foreground },
          { emoji: '⚡', value: totalBalance,           label: 'Buffs',  color: T.buff },
        ].map(stat => (
          <View key={stat.label}
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
  statsRow:      { flexDirection: 'row', gap: 10 },
  statCard:      { flex: 1, borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center' },
  statEmoji:     { fontSize: 22, marginBottom: 6 },
  statNumber:    { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel:     { fontSize: 12 },
});
