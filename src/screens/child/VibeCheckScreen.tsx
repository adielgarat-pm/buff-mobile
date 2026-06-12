/**
 * VibeCheckScreen — full-screen daily Vibe Check prompt.
 *
 * Theme-aware: routes between Pastel (emoji faces) and Gamer (a
 * recharging battery) per SPEC § Decisions OQ6 / OQ7.
 *
 * Pure presentational — wiring to useDailyVibe lives in the dashboard
 * that mounts this. Dashboard combines `hasVibedToday + !isPauseActive`
 * to gate visibility (Pause wins per SPEC Scenario C).
 *
 * Dismiss behavior: per SPEC § Decisions OQ3, the kid can dismiss
 * without selecting. Dismiss closes the modal with no DB write; the
 * caller should mark "dismissed for today" in local state so no
 * re-prompt fires until the next calendar day.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useChildTheme } from '../../contexts/ThemeContext';
import { VibeFaces }   from '../../components/VibeFaces';
import { VibeBattery } from '../../components/VibeBattery';
import { isVibeShareable, type VibeLevel, type VibeType } from '../../utils/vibeUtils';

// ─── BUFF Gamer palette (matches GamerDashboardScreen — BUFF_BRAND.md §7.5) ──
// Hardcoded here because Gamer screens use a violet+lime brand palette
// distinct from ThemeContext.GAMER (which is cyan). Duplication noted in
// INTEGRATION_LEARNINGS for a future palette-extraction package.
const GAMER_PALETTE = {
  canvas:       '#1a1636',
  surface:      '#2D2546',
  surfaceHigh:  '#3D3556',
  border:       'rgba(255,255,255,0.10)',
  lime:         '#A8E63E',
  violet:       '#8b5cf6',
  text:         '#FFFFFF',
  textMuted:    '#A78BFA',
  textFaint:    'rgba(255,255,255,0.50)',
} as const;

export interface VibeCheckScreenProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Called when a level is selected. `type` is passed back so the
   *  caller can persist it to `child_vibes.vibe_type` ('emoji' for
   *  Pastel, 'battery' for Gamer). `share` is true when the kid opted to
   *  tell their parent about a non-low mood (pkg/vibe-share-notification);
   *  the caller chains shareVibe() after recordVibe(). */
  onSelect:  (level: VibeLevel, type: VibeType, share?: boolean) => void;
  /** Called when the kid dismisses without selecting. */
  onDismiss: () => void;
  /** Optional theme override — defaults to useChildTheme().themeName.
   *  Used by the dev preview to render both themes side-by-side. */
  themeOverride?: 'mint' | 'gamer';
}

export default function VibeCheckScreen({
  visible, onSelect, onDismiss, themeOverride,
}: VibeCheckScreenProps) {
  // We always call useChildTheme — themeOverride only swaps which branch
  // renders, not the underlying tokens (Pastel still reads from context).
  const ctxTheme = useChildTheme();
  const effectiveTheme: 'mint' | 'gamer' = themeOverride ?? ctxTheme.name;
  const isGamer = effectiveTheme === 'gamer';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onDismiss}
    >
      {isGamer ? (
        <GamerCheckContent onSelect={onSelect} onDismiss={onDismiss} />
      ) : (
        <PastelCheckContent themeTokens={ctxTheme} onSelect={onSelect} onDismiss={onDismiss} />
      )}
    </Modal>
  );
}

// ─── Pastel content ──────────────────────────────────────────────────────────

interface PastelProps {
  themeTokens: ReturnType<typeof useChildTheme>;
  onSelect:    (level: VibeLevel, type: VibeType, share?: boolean) => void;
  onDismiss:   () => void;
}

function PastelCheckContent({ themeTokens: T, onSelect, onDismiss }: PastelProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<VibeLevel | null>(null);
  // pkg/vibe-share-notification — when a non-low level is picked, hold here
  // and offer the optional "tell your parent?" step before the modal closes.
  const [pendingShare, setPendingShare] = useState<VibeLevel | null>(null);

  const handleSelect = (level: VibeLevel) => {
    setSelected(level);
    // Tiny delay so the kid sees the selection animate before the next step.
    setTimeout(() => {
      if (isVibeShareable(level)) setPendingShare(level);
      else onSelect(level, 'emoji');
    }, 180);
  };

  return (
    <SafeAreaView style={[pastelStyles.safe, { backgroundColor: T.background }]}>
      <View style={pastelStyles.container}>
        <View style={[pastelStyles.card, { backgroundColor: T.card, borderColor: T.border, shadowColor: T.shadow }]}>
          {pendingShare !== null ? (
            <ShareVibePrompt
              palette={{
                title:      T.foreground,
                subtitle:   T.mutedForeground,
                shareBg:    T.primary,
                shareText:  T.primaryForeground,
                keepText:   T.mutedForeground,
              }}
              onShare={() => onSelect(pendingShare, 'emoji', true)}
              onKeep={() => onSelect(pendingShare, 'emoji', false)}
            />
          ) : (
            <>
              <Text style={[pastelStyles.title,    { color: T.foreground }]}>
                {t('vibeCheck.title')}
              </Text>
              <Text style={[pastelStyles.subtitle, { color: T.mutedForeground }]}>
                {t('vibeCheck.subtitle')}
              </Text>

              <View style={pastelStyles.facesRow}>
                <VibeFaces
                  selectedLevel={selected}
                  onSelect={handleSelect}
                  palette={{
                    cardBg:         T.muted,
                    cardBorder:     T.border,
                    cardShadow:     T.shadow,
                    selectedFill:   T.primary,
                    selectedBorder: T.accent,
                  }}
                />
              </View>

              <TouchableOpacity onPress={onDismiss} style={pastelStyles.dismissBtn}>
                <Text style={[pastelStyles.dismissText, { color: T.mutedForeground }]}>
                  {t('vibeCheck.dismiss')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const pastelStyles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  facesRow: { marginBottom: 24 },
  dismissBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  dismissText: { fontSize: 14, fontWeight: '600' },
});

// ─── Gamer content ───────────────────────────────────────────────────────────

interface GamerProps {
  onSelect:  (level: VibeLevel, type: VibeType, share?: boolean) => void;
  onDismiss: () => void;
}

function GamerCheckContent({ onSelect, onDismiss }: GamerProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<VibeLevel | null>(null);
  const [pendingShare, setPendingShare] = useState<VibeLevel | null>(null);

  const handleSelect = (level: VibeLevel) => {
    setSelected(level);
    setTimeout(() => {
      if (isVibeShareable(level)) setPendingShare(level);
      else onSelect(level, 'battery');
    }, 180);
  };

  return (
    <SafeAreaView style={[gamerStyles.safe, { backgroundColor: GAMER_PALETTE.canvas }]}>
      <View style={gamerStyles.container}>
        <View style={gamerStyles.card}>
          {pendingShare !== null ? (
            <ShareVibePrompt
              palette={{
                title:      GAMER_PALETTE.text,
                subtitle:   GAMER_PALETTE.textMuted,
                shareBg:    GAMER_PALETTE.lime,
                shareText:  GAMER_PALETTE.canvas,
                keepText:   GAMER_PALETTE.textFaint,
              }}
              onShare={() => onSelect(pendingShare, 'battery', true)}
              onKeep={() => onSelect(pendingShare, 'battery', false)}
            />
          ) : (
            <>
              <Text style={gamerStyles.title}>
                {t('vibeCheck.title')}
              </Text>
              <Text style={gamerStyles.subtitle}>
                {t('vibeCheck.subtitle')}
              </Text>

              <View style={gamerStyles.batteryRow}>
                <VibeBattery
                  selectedLevel={selected}
                  onSelect={handleSelect}
                  palette={{
                    trackBg:        GAMER_PALETTE.surface,
                    border:         GAMER_PALETTE.border,
                    unselectedFill: GAMER_PALETTE.violet,
                    selectedFill:   GAMER_PALETTE.lime,
                    selectedGlow:   GAMER_PALETTE.lime,
                    boltColor:      GAMER_PALETTE.canvas,
                    labelColor:     GAMER_PALETTE.textMuted,
                  }}
                />
              </View>

              <TouchableOpacity onPress={onDismiss} style={gamerStyles.dismissBtn}>
                <Text style={gamerStyles.dismissText}>{t('vibeCheck.dismiss')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Share step (pkg/vibe-share-notification) ────────────────────────────────
// Theme-agnostic via palette props — rendered inside either theme's card after
// the kid picks a non-low mood. Kid-initiated consent, mirrors SosButton's
// tap→confirm shape. Copy is body-double/warm (OQ-A draft; Adi's gate).

interface ShareVibePromptPalette {
  title:     string;
  subtitle:  string;
  shareBg:   string;
  shareText: string;
  keepText:  string;
}

function ShareVibePrompt({
  palette: P, onShare, onKeep,
}: {
  palette: ShareVibePromptPalette;
  onShare: () => void;
  onKeep:  () => void;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={[shareStyles.title, { color: P.title }]}>
        {t('vibeCheck.share.prompt')}
      </Text>
      <Text style={[shareStyles.subtitle, { color: P.subtitle }]}>
        {t('vibeCheck.share.subtitle')}
      </Text>

      <TouchableOpacity
        onPress={onShare}
        style={[shareStyles.shareBtn, { backgroundColor: P.shareBg }]}
        accessibilityRole="button"
      >
        <Text style={[shareStyles.shareText, { color: P.shareText }]}>
          {t('vibeCheck.share.yes')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onKeep} style={shareStyles.keepBtn} accessibilityRole="button">
        <Text style={[shareStyles.keepText, { color: P.keepText }]}>
          {t('vibeCheck.share.no')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const shareStyles = StyleSheet.create({
  title:    { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  shareBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareText: { fontSize: 16, fontWeight: '800' },
  keepBtn:   { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  keepText:  { fontSize: 14, fontWeight: '600' },
});

const gamerStyles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: GAMER_PALETTE.surfaceHigh,
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: GAMER_PALETTE.border,
    shadowColor: GAMER_PALETTE.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  title: {
    color: GAMER_PALETTE.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    color: GAMER_PALETTE.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  batteryRow: { marginBottom: 24 },
  dismissBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  dismissText: {
    color: GAMER_PALETTE.textFaint,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
