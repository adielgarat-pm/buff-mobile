/**
 * GamerMyStatsScreen — child "My Stats" tab for the Gamer aesthetic mode.
 *
 * Lite version of Stitch 5B — drops LEVEL pill, "Progress to LEVEL N" bar,
 * BOOSTERS carousel, and hero image. All four return when pkg/buddy-v05-backend
 * ships (which adds friendship_levels + boosters tables).
 *
 * Source design: docs/teen-ui-design/me-and-buddy/5b-my-stats/
 *
 * Routing: ChildMyStatsScreen routes to this when themeName === 'gamer'.
 * Pastel theme renders nothing here — the tab itself is hidden in ChildTabs.
 *
 * Pause Mode: respects useAppSettings.isPauseActive — shows PauseEmptyState
 * + WelcomeBackModal instead of stat content (consistent with GamerDashboardScreen).
 */
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { usePetState } from '../../hooks/usePetState';
import { useAppSettings } from '../../hooks/useAppSettings';
import PauseEmptyState from '../../components/PauseEmptyState';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';

// ─── BUFF brand palette (Gamer mode) — matches GamerDashboardScreen ──────────
const COLORS = {
  canvas:       '#1a1636',
  surface:      '#2D2546',
  border:       'rgba(255,255,255,0.10)',
  text:         '#FFFFFF',
  textMuted:    '#A78BFA',
  lime:         '#A8E63E',
} as const;

export default function GamerMyStatsScreen() {
  const { t }       = useTranslation();
  const { profile } = useAuth();
  const { previewChildId } = useMode();

  const childId = previewChildId ?? profile?.id ?? null;
  const { totalBalance, loading: dataLoading } = useChildData(childId);
  const { petState, loading: petLoading } = usePetState('wolf');
  const { isPauseActive } = useAppSettings();
  const welcomeBack = useWelcomeBack();

  if (dataLoading || petLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.lime} />
      </View>
    );
  }

  if (isPauseActive) {
    return (
      <ScrollView style={styles.canvas} contentContainerStyle={styles.content}>
        <Header t={t} />
        <PauseEmptyState />
        <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.canvas} contentContainerStyle={styles.content}>
      <Header t={t} />

      <View style={styles.statsGrid}>
        <StatCard
          label={t('gamerMyStats.statBuffs')}
          value={totalBalance.toLocaleString()}
          accent
        />
        <StatCard
          label={t('gamerMyStats.statSuccessfulDays')}
          value={String(petState.evolution_days_count)}
        />
        <StatCard
          label={t('gamerMyStats.statCurrentStreak')}
          value={String(petState.daily_streak)}
        />
      </View>

      <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
    </ScrollView>
  );
}

function Header({ t }: { t: (k: string) => string }) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.title}>{t('gamerMyStats.title')}</Text>
      <View style={styles.iconBtn}>
        {/* Inert placeholder — wired up when Settings screen 07 ships */}
        <Ionicons name="settings-outline" size={20} color={COLORS.textMuted} />
      </View>
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
    marginBottom: 28,
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

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
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
});
