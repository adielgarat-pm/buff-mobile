/**
 * PetDisplay — full interactive pet widget for the child HQ (Dashboard).
 *
 * Features ported from the web app:
 *  - 4 evolution stages: egg → hatchling → scout → guardian
 *  - Theme-aware stage visuals (mint = cute/pastel, gamer = heroic/neon)
 *  - Floating bob animation (continuous); bigger bounce on happy/tap
 *  - Tap to greet — random greeting bubble with child's name
 *  - Resting state (😴) after session time-limit; resting message card
 *  - Energy glow + celebration bubble when justCompletedTask fires
 *  - Evolution progress bar (days-based, no raw numbers shown to child)
 *  - Pet name + stage badge
 *
 * Not yet ported (no assets/libs on mobile yet):
 *  - Lottie celebration overlay
 *  - Credit ding audio
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PET_SKINS, STAGE_VISUALS, getDefaultSkin } from '../types/pet';
import { usePetState } from '../hooks/usePetState';
import { useTheme, useChildTheme } from '../contexts/ThemeContext';

// ─── Greeting pool (mirrors web GREETING_KEYS) ───────────────────────────────

const GREETING_KEYS = [
  'pet.greeting.ready',
  'pet.greeting.awesome',
  'pet.greeting.mission',
  'pet.greeting.believe',
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  childName?:           string;
  justCompletedTask?:   boolean;
  onTaskCompletionAck?: () => void;
  /** Tasks done today — drives egg-crack progression */
  completedToday?:      number;
  totalToday?:          number;
}

// ─── Egg crack helpers ───────────────────────────────────────────────────────

const EGG_CRACK_KEYS = [
  'pet.eggCrack1',
  'pet.eggCrack2',
  'pet.eggCrack3',
  'pet.hatching',
] as const;

function getEggCrackStage(done: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  const pct = done / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.6) return 2;
  if (pct >= 0.3) return 1;
  return 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PetDisplay({
  childName,
  justCompletedTask,
  onTaskCompletionAck,
  completedToday = 0,
  totalToday     = 0,
}: Props) {
  const { t }         = useTranslation();
  const { themeName } = useTheme();
  const T             = useChildTheme();

  const defaultSkin = getDefaultSkin(themeName);
  const { petState, isResting, loading, onTaskCompleted, recordInteraction, evolutionProgress } =
    usePetState(defaultSkin);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [greetingText,    setGreetingText]    = useState('');
  const [showGreeting,    setShowGreeting]    = useState(false);
  const [showEnergyGlow,  setShowEnergyGlow]  = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [crackMessage,    setCrackMessage]    = useState('');
  const prevCrackRef = useRef(0);

  // ── Skin + stage ─────────────────────────────────────────────────────────
  const skin  = PET_SKINS[petState.current_skin] ?? PET_SKINS[defaultSkin] ?? PET_SKINS.puppy;
  const stage = STAGE_VISUALS[themeName][petState.evolution_stage];

  const crackStage = petState.evolution_stage === 'egg'
    ? getEggCrackStage(completedToday, totalToday)
    : 0;

  const showEgg       = petState.evolution_stage === 'egg' && crackStage < 3;
  const isHighEnergy  = petState.energy_level >= 70;
  const petName       = 'Buddy'; // TODO: read from profile / proSettings

  // ── Animations ───────────────────────────────────────────────────────────
  const floatY        = useRef(new Animated.Value(0)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const petOpacity    = useRef(new Animated.Value(1)).current;
  const glowOpacity   = useRef(new Animated.Value(0)).current;
  const greetOpacity  = useRef(new Animated.Value(0)).current;
  const celebOpacity  = useRef(new Animated.Value(0)).current;
  const restOpacity   = useRef(new Animated.Value(0)).current;
  const floopRef      = useRef<Animated.CompositeAnimation | undefined>(undefined);

  // Continuous float — restart whenever state changes
  useEffect(() => {
    floopRef.current?.stop();
    const amplitude = isResting ? 3 : isHighEnergy ? 10 : 6;
    const dur       = isResting ? 3500 : isHighEnergy ? 1800 : 2500;

    floopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -amplitude, duration: dur, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,          duration: dur, useNativeDriver: true }),
      ])
    );
    floopRef.current.start();

    Animated.timing(petOpacity, {
      toValue: isResting ? 0.65 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    return () => floopRef.current?.stop();
  }, [isResting, isHighEnergy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resting card fade
  useEffect(() => {
    Animated.timing(restOpacity, {
      toValue: isResting ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isResting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Happy / task-complete glow
  useEffect(() => {
    if (!justCompletedTask) return;
    setShowEnergyGlow(true);
    setShowCelebration(true);

    Animated.sequence([
      Animated.timing(glowOpacity,  { toValue: 0.5, duration: 300, useNativeDriver: true }),
      Animated.timing(celebOpacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(glowOpacity,  { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(celebOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setShowEnergyGlow(false);
      setShowCelebration(false);
      onTaskCompletionAck?.();
    });

    // Trigger a bounce
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.0,  useNativeDriver: true }),
    ]).start();
  }, [justCompletedTask]); // eslint-disable-line react-hooks/exhaustive-deps

  // Egg crack message
  useEffect(() => {
    if (petState.evolution_stage !== 'egg') return;
    if (crackStage > prevCrackRef.current && crackStage > 0) {
      setCrackMessage(t(EGG_CRACK_KEYS[crackStage - 1]));
      setTimeout(() => setCrackMessage(''), 3000);
    }
    prevCrackRef.current = crackStage;
  }, [crackStage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tap handler ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (isResting) return;
    recordInteraction();

    const key  = GREETING_KEYS[Math.floor(Math.random() * GREETING_KEYS.length)];
    const name = childName ?? t('celebration.champ');
    setGreetingText(t(key).replace('{name}', name));
    setShowGreeting(true);

    // Bounce
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.0,  useNativeDriver: true }),
    ]).start();

    // Greeting bubble
    Animated.sequence([
      Animated.timing(greetOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(greetOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowGreeting(false));
  }, [isResting, recordInteraction, childName, t]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return null;

  // Determine what the main pet body shows
  const petEmoji = isResting
    ? '😴'
    : showEgg
    ? EGG_CRACK_EMOJIS[crackStage]
    : skin.emoji;

  return (
    <View style={styles.root}>

      {/* Energy glow ring (behind pet) */}
      <Animated.View
        style={[
          styles.glowRing,
          { backgroundColor: T.primary + '44', opacity: glowOpacity },
        ]}
        pointerEvents="none"
      />

      {/* ── Pet body ─────────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={handleTap}
        disabled={isResting}
        activeOpacity={0.85}
        style={styles.petTouchable}
      >
        <Animated.Text
          style={[
            styles.petEmoji,
            {
              transform: [
                { translateY: floatY },
                { scale: scaleAnim },
              ],
              opacity: petOpacity,
            },
          ]}
        >
          {petEmoji}
        </Animated.Text>

        {/* Energy dot */}
        {!isResting && (
          <View
            style={[
              styles.energyDot,
              {
                backgroundColor: isHighEnergy
                  ? '#4ADE80'
                  : petState.energy_level >= 30
                  ? '#FACC15'
                  : T.mutedForeground,
              },
            ]}
          />
        )}
      </TouchableOpacity>

      {/* Egg crack sparkles overlay */}
      {petState.evolution_stage === 'egg' && crackStage > 0 && !isResting && (
        <View style={styles.crackOverlay} pointerEvents="none">
          {crackStage >= 1 && <Text style={[styles.crackSparkle, styles.crackSp1]}>✨</Text>}
          {crackStage >= 2 && <Text style={[styles.crackSparkle, styles.crackSp2]}>💫</Text>}
          {crackStage >= 3 && <Text style={[styles.crackSparkle, styles.crackSp3]}>🌟</Text>}
        </View>
      )}

      {/* ── Egg crack message ─────────────────────────────────────────────── */}
      {!!crackMessage && (
        <View style={[styles.bubble, { backgroundColor: T.primary + '22', borderColor: T.primary + '44' }]}>
          <Text style={[styles.bubbleText, { color: T.primary }]}>{crackMessage}</Text>
        </View>
      )}

      {/* ── Name + stage badge ────────────────────────────────────────────── */}
      <View style={styles.nameRow}>
        <Text style={[styles.petName, { color: T.foreground }]}>{petName}</Text>
        <View style={[styles.stageBadge, { backgroundColor: T.muted }]}>
          <Text style={[styles.stageBadgeText, { color: T.foreground }]}>
            {stage.badgeEmoji} {t(stage.labelKey)}
          </Text>
        </View>
      </View>

      {/* Coach subtitle */}
      <Text style={[styles.coachSub, { color: T.mutedForeground }]}>
        {t('pet.coachSubtitle')}
      </Text>

      {/* ── Evolution progress bar ────────────────────────────────────────── */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: T.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                width:           `${evolutionProgress}%`,
                backgroundColor: stage.ringColor,
              },
            ]}
          />
        </View>
      </View>

      {/* ── Greeting bubble ───────────────────────────────────────────────── */}
      {showGreeting && (
        <Animated.View
          style={[
            styles.bubble,
            { opacity: greetOpacity, backgroundColor: T.card, borderColor: T.border },
          ]}
        >
          <Text style={[styles.bubbleText, { color: T.foreground }]}>{greetingText}</Text>
        </Animated.View>
      )}

      {/* ── Task completion celebration ───────────────────────────────────── */}
      {showCelebration && (
        <Animated.View
          style={[
            styles.bubble,
            { opacity: celebOpacity, backgroundColor: T.primary + '22', borderColor: T.primary + '44' },
          ]}
        >
          <Text style={[styles.bubbleText, { color: T.primary }]}>
            {t('pet.celebrationCoach')}
          </Text>
        </Animated.View>
      )}

      {/* ── Resting message ───────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.restCard,
          { opacity: restOpacity, backgroundColor: T.muted, borderColor: T.border },
        ]}
        pointerEvents={isResting ? 'auto' : 'none'}
      >
        <Text style={[styles.restTitle, { color: T.mutedForeground }]}>
          🌙 {t('pet.restingTitle')}
        </Text>
        <Text style={[styles.restBody, { color: T.mutedForeground }]}>
          {t('pet.restMessage')}
        </Text>
      </Animated.View>

    </View>
  );
}

// ─── Egg emoji stages (maps crackStage 0–3) ───────────────────────────────────
const EGG_CRACK_EMOJIS = ['🥚', '🥚', '🥚', '🐣'];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:            { alignItems: 'center', paddingVertical: 16, gap: 8 },

  glowRing:        { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: 0 },

  petTouchable:    { alignItems: 'center' },
  petEmoji:        { fontSize: 72 },
  energyDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 4 },

  crackOverlay:    { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  crackSparkle:    { position: 'absolute', fontSize: 22 },
  crackSp1:        { top: 8,  right: 8,  transform: [{ rotate: '-12deg' }] },
  crackSp2:        { bottom: 8, left: 8,  transform: [{ rotate: '12deg' }] },
  crackSp3:        { bottom: 0, fontSize: 16 },

  nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petName:         { fontSize: 15, fontWeight: '700' },
  stageBadge:      { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  stageBadgeText:  { fontSize: 11, fontWeight: '600' },

  coachSub:        { fontSize: 11, fontStyle: 'italic', marginTop: -4 },

  progressWrap:    { width: 180, marginTop: 4 },
  progressTrack:   { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 4 },

  bubble: {
    borderRadius:   16,
    borderWidth:    1,
    paddingHorizontal: 16,
    paddingVertical:   10,
    maxWidth:       240,
  },
  bubbleText:      { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  restCard:        { borderRadius: 16, borderWidth: 1, padding: 14, maxWidth: 240, gap: 4 },
  restTitle:       { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  restBody:        { fontSize: 11, textAlign: 'center' },
});
