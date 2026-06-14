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
 * GamerDashboardScreen (BUFF_BRAND §7.5) for visual continuity.
 *
 * CHUNK 2 (this file): the game loop — buffs spawn at random positions, the
 * kid taps to catch them, the round runs 30s with gradual acceleration, and a
 * rare golden buff is worth ×3. Persistence, the daily cap, the BUDDY line and
 * telemetry land in chunk 3 (the 'done' screen here is a minimal placeholder).
 */
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, AppState,
  type LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

// ─── Mechanic tuning (SPEC §6) ───────────────────────────────────────────────
const ROUND_MS        = 30_000; // round duration
const SPAWN_MAX_MS    = 900;    // spawn interval at t=0 (slow)
const SPAWN_MIN_MS    = 450;    // spawn interval at t=end (fast)
const VISIBLE_MAX_MS  = 1_400;  // how long a buff stays at t=0
const VISIBLE_MIN_MS  = 800;    // …at t=end
const MAX_CONCURRENT  = 3;      // max buffs on screen at once
const GOLDEN_CHANCE   = 0.08;   // 8% of buffs are golden
const GOLDEN_POINTS   = 3;      // golden buff is worth ×3
const NORMAL_POINTS   = 1;
const BUFF_SIZE       = 68;     // px — finger-safe target

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

interface Buff {
  id:     number;
  x:      number;
  y:      number;
  golden: boolean;
}

// ─── Theme palette ───────────────────────────────────────────────────────────
interface CatchPalette {
  canvas:     string;
  surface:    string;
  text:       string;
  textMuted:  string;
  accent:     string; // primary action / normal buff
  accentText: string;
  golden:     string; // golden buff
  border:     string;
}

// Gamer palette — matches GamerDashboardScreen's brand palette (BUFF_BRAND §7.5).
const GAMER_PALETTE: CatchPalette = {
  canvas:     '#1a1636',
  surface:    '#2D2546',
  text:       '#FFFFFF',
  textMuted:  '#A78BFA',
  accent:     '#A8E63E',
  accentText: '#1a1636',
  golden:     '#FFD54A',
  border:     'rgba(255,255,255,0.10)',
};

const MINT_PALETTE: CatchPalette = {
  canvas:     '#DCFCE7',
  surface:    '#FFFFFF',
  text:       '#2D3142',
  textMuted:  '#606672',
  accent:     '#C084FC',
  accentText: '#FFFFFF',
  golden:     '#F59E0B',
  border:     '#BBF7D0',
};

type Phase = 'idle' | 'playing' | 'done';

export default function BuffCatchScreen() {
  const { t }         = useTranslation();
  const { themeName } = useTheme();
  const navigation    = useNavigation<Nav>();
  const insets        = useSafeAreaInsets();

  const P = themeName === 'gamer' ? GAMER_PALETTE : MINT_PALETTE;

  const [phase, setPhase]       = useState<Phase>('idle');
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS / 1000);
  const [buffs, setBuffs]       = useState<Buff[]>([]);

  // ── Refs (mutable game state read inside timer callbacks) ──────────────────
  const areaRef     = useRef({ w: 0, h: 0 });
  const buffsRef    = useRef<Buff[]>([]);
  const buffTimers  = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const spawnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAt     = useRef(0);
  const nextId      = useRef(0);
  const phaseRef    = useRef<Phase>('idle');

  const setPhaseSafe = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  // ── Timer teardown ─────────────────────────────────────────────────────────
  const clearAllTimers = () => {
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    if (roundTimer.current) clearTimeout(roundTimer.current);
    if (tickTimer.current)  clearInterval(tickTimer.current);
    spawnTimer.current = roundTimer.current = null;
    tickTimer.current = null;
    buffTimers.current.forEach(clearTimeout);
    buffTimers.current.clear();
  };

  const removeBuff = (id: number) => {
    const tm = buffTimers.current.get(id);
    if (tm) { clearTimeout(tm); buffTimers.current.delete(id); }
    buffsRef.current = buffsRef.current.filter(b => b.id !== id);
    setBuffs(buffsRef.current);
  };

  const progress = () => clamp01((Date.now() - startAt.current) / ROUND_MS);

  const spawnBuff = () => {
    const { w, h } = areaRef.current;
    if (w < BUFF_SIZE || h < BUFF_SIZE) return;            // not laid out yet
    if (buffsRef.current.length >= MAX_CONCURRENT) return; // screen full

    const id     = nextId.current++;
    const golden = Math.random() < GOLDEN_CHANCE;
    const buff: Buff = {
      id,
      x: Math.random() * (w - BUFF_SIZE),
      y: Math.random() * (h - BUFF_SIZE),
      golden,
    };
    buffsRef.current = [...buffsRef.current, buff];
    setBuffs(buffsRef.current);

    // Auto-despawn after the (acceleration-scaled) visible window.
    const visible = lerp(VISIBLE_MAX_MS, VISIBLE_MIN_MS, progress());
    buffTimers.current.set(id, setTimeout(() => removeBuff(id), visible));
  };

  // Recursive spawn loop — interval tightens as the round progresses.
  const scheduleSpawn = () => {
    const interval = lerp(SPAWN_MAX_MS, SPAWN_MIN_MS, progress());
    spawnTimer.current = setTimeout(() => {
      spawnBuff();
      scheduleSpawn();
    }, interval);
  };

  const endRound = () => {
    clearAllTimers();
    buffsRef.current = [];
    setBuffs([]);
    setTimeLeft(0);
    setPhaseSafe('done');
  };

  const startRound = () => {
    clearAllTimers();
    buffsRef.current = [];
    setBuffs([]);
    setScore(0);
    setTimeLeft(ROUND_MS / 1000);
    startAt.current = Date.now();
    setPhaseSafe('playing');

    scheduleSpawn();
    roundTimer.current = setTimeout(endRound, ROUND_MS);
    tickTimer.current = setInterval(() => {
      const remaining = Math.max(0, ROUND_MS - (Date.now() - startAt.current));
      setTimeLeft(Math.ceil(remaining / 1000));
    }, 200);
  };

  const onCatch = (buff: Buff) => {
    setScore(s => s + (buff.golden ? GOLDEN_POINTS : NORMAL_POINTS));
    removeBuff(buff.id);
  };

  // ── Cleanup on unmount (exit mid-round → no leaked timers, SPEC §9) ─────────
  useEffect(() => clearAllTimers, []);

  // ── Background / screen-off → end the round cleanly (SPEC §9) ──────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active' && phaseRef.current === 'playing') endRound();
    });
    return () => sub.remove();
  }, []);

  const onAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    areaRef.current = { w: width, h: height };
  };

  return (
    <View style={[styles.canvas, { backgroundColor: P.canvas }]}>
      {/* Header — close + (during play) HUD */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconBtn, { backgroundColor: P.surface, borderColor: P.border }]}
          accessibilityRole="button"
          accessibilityLabel={t('buffCatch.close')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={P.textMuted} />
        </TouchableOpacity>

        {phase === 'playing' ? (
          <View style={styles.hud}>
            <Text style={[styles.hudScore, { color: P.accent }]}>{score}</Text>
            <View style={[styles.timerPill, { backgroundColor: P.surface, borderColor: P.border }]}>
              <Ionicons name="time-outline" size={14} color={P.textMuted} />
              <Text style={[styles.timerText, { color: P.text }]}>{timeLeft}s</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.title, { color: P.text }]}>{t('buffCatch.title')}</Text>
        )}

        <View style={styles.iconBtn} />
      </View>

      {/* ── IDLE ───────────────────────────────────────────────────────── */}
      {phase === 'idle' && (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>⚡</Text>
          <Text style={[styles.ready, { color: P.text }]}>{t('buffCatch.ready')}</Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: P.accent }]}
            activeOpacity={0.85}
            onPress={startRound}
            accessibilityRole="button"
            accessibilityLabel={t('buffCatch.start')}
          >
            <Text style={[styles.startText, { color: P.accentText }]}>{t('buffCatch.start')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── PLAYING ─────────────────────────────────────────────────────── */}
      {phase === 'playing' && (
        <View style={styles.playArea} onLayout={onAreaLayout}>
          {buffs.map(b => (
            <BuffSprite key={b.id} buff={b} palette={P} onCatch={onCatch} />
          ))}
        </View>
      )}

      {/* ── DONE (minimal placeholder — full end screen in chunk 3) ──────── */}
      {phase === 'done' && (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={[styles.doneScore, { color: P.accent }]}>{score}</Text>
          <Text style={[styles.ready, { color: P.textMuted }]}>{t('buffCatch.roundScore')}</Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: P.accent }]}
            activeOpacity={0.85}
            onPress={startRound}
            accessibilityRole="button"
            accessibilityLabel={t('buffCatch.playAgain')}
          >
            <Text style={[styles.startText, { color: P.accentText }]}>{t('buffCatch.playAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryText, { color: P.textMuted }]}>{t('buffCatch.done')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Buff sprite — pops in on mount, tappable ────────────────────────────────
function BuffSprite({ buff, palette, onCatch }: {
  buff: Buff;
  palette: CatchPalette;
  onCatch: (b: Buff) => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 120,
    }).start();
  }, [scale]);

  const bg = buff.golden ? palette.golden : palette.accent;

  return (
    <Animated.View
      style={[
        styles.buff,
        { left: buff.x, top: buff.y, backgroundColor: bg, transform: [{ scale }] },
        buff.golden && styles.buffGolden,
      ]}
    >
      <TouchableOpacity
        style={styles.buffHit}
        activeOpacity={0.7}
        onPress={() => onCatch(buff)}
        accessibilityRole="button"
        accessibilityLabel={buff.golden ? 'golden buff' : 'buff'}
      >
        <Text style={styles.buffEmoji}>{buff.golden ? '🌟' : '⚡'}</Text>
      </TouchableOpacity>
    </Animated.View>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },

  hud:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hudScore:  { fontSize: 26, fontWeight: '900' },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  timerText: { fontSize: 14, fontWeight: '800' },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  bigEmoji:  { fontSize: 72, marginBottom: 16 },
  ready:     { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 28, lineHeight: 24 },
  doneScore: { fontSize: 64, fontWeight: '900', marginBottom: 2 },
  startBtn:  { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 28 },
  startText: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  secondaryBtn:  { marginTop: 18, paddingVertical: 8, paddingHorizontal: 20 },
  secondaryText: { fontSize: 15, fontWeight: '700' },

  playArea: { flex: 1, position: 'relative' },
  buff: {
    position: 'absolute',
    width: BUFF_SIZE,
    height: BUFF_SIZE,
    borderRadius: BUFF_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buffGolden: {
    shadowColor: '#FFD54A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  buffHit:   { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  buffEmoji: { fontSize: 32 },
});
