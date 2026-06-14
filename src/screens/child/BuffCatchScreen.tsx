/**
 * BuffCatchScreen — daily mini-game ("BUFF Catch").
 *
 * A short, pure-fun catch game that gives kids a non-task reason to open BUFF
 * daily (SPEC docs/sessions/buff-catch-game/SPEC.md). v1 is deliberately
 * disconnected from the BUFF economy: no currency awarded or spent, no
 * task-gate. The only persistent state is a local personal-best and a daily
 * play counter (added in chunk 3).
 *
 * Routing: full-screen stack route `BuffCatch`, pushed from the dashboard
 * entry card (both Mint + Gamer). Registered as a sibling of ChildApp in
 * RootNavigator so it works for real children AND parents in view-as-child.
 *
 * Theme: adapts to the child's chosen aesthetic via ThemeContext. Mint uses
 * the soft pastel tokens; Gamer matches the violet/lime brand palette used by
 * GamerDashboardScreen (BUFF_BRAND §7.5) for visual continuity with the rest
 * of the Gamer experience.
 *
 * CHUNK 1 (this file): skeleton + navigation only. The game loop, scoring,
 * acceleration, golden buff, persistence and end screen arrive in chunks 2-3.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

// Normalised palette consumed by the game UI, derived from the child's theme.
// Keeping a single shape lets the rest of the screen stay theme-agnostic.
interface CatchPalette {
  canvas:     string; // full-screen background
  surface:    string; // cards / play area
  text:       string; // primary text
  textMuted:  string; // secondary text
  accent:     string; // primary action / highlight
  accentText: string; // text on top of accent
  border:     string;
}

// Gamer palette — matches GamerDashboardScreen's brand palette (BUFF_BRAND §7.5)
// rather than the older cyan ThemeContext gamer tokens, so the game feels like
// part of the same Gamer world the kid already navigates.
const GAMER_PALETTE: CatchPalette = {
  canvas:     '#1a1636',
  surface:    '#2D2546',
  text:       '#FFFFFF',
  textMuted:  '#A78BFA',
  accent:     '#A8E63E',
  accentText: '#1a1636',
  border:     'rgba(255,255,255,0.10)',
};

const MINT_PALETTE: CatchPalette = {
  canvas:     '#DCFCE7',
  surface:    '#FFFFFF',
  text:       '#2D3142',
  textMuted:  '#606672',
  accent:     '#C084FC',
  accentText: '#FFFFFF',
  border:     '#BBF7D0',
};

export default function BuffCatchScreen() {
  const { t }        = useTranslation();
  const { themeName } = useTheme();
  const navigation   = useNavigation<Nav>();
  const insets       = useSafeAreaInsets();

  const P = themeName === 'gamer' ? GAMER_PALETTE : MINT_PALETTE;

  // 'idle' = ready to start. 'playing' / 'done' land in chunks 2-3.
  const [phase] = useState<'idle' | 'playing' | 'done'>('idle');

  return (
    <View style={[styles.canvas, { backgroundColor: P.canvas }]}>
      {/* Header — close button + title */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, { backgroundColor: P.surface, borderColor: P.border }]}
          accessibilityRole="button"
          accessibilityLabel={t('buffCatch.close')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={P.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: P.text }]}>{t('buffCatch.title')}</Text>
        {/* Spacer to keep the title centred opposite the close button */}
        <View style={styles.closeBtn} />
      </View>

      {/* Play area (idle state) */}
      {phase === 'idle' && (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>⚡</Text>
          <Text style={[styles.ready, { color: P.text }]}>{t('buffCatch.ready')}</Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: P.accent }]}
            activeOpacity={0.85}
            // Game loop wired in chunk 2.
            onPress={() => { /* TODO chunk 2: start round */ }}
            accessibilityRole="button"
            accessibilityLabel={t('buffCatch.start')}
          >
            <Text style={[styles.startText, { color: P.accentText }]}>{t('buffCatch.start')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },

  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  bigEmoji: { fontSize: 72, marginBottom: 16 },
  ready:    { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 28, lineHeight: 24 },
  startBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 28,
  },
  startText: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
