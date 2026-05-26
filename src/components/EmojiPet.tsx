/**
 * EmojiPet — lightweight floating pet emoji.
 *
 * Used by the parent dashboard to display the child's pet.
 * Not interactive; just shows the pet with a name + stage badge.
 *
 * For the full interactive child HQ widget use PetDisplay.
 */
import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PET_SKINS, STAGE_VISUALS, EvolutionStage } from '../types/pet';
import { useTheme, useChildTheme } from '../contexts/ThemeContext';

interface Props {
  /** Skin id from PET_SKINS, e.g. 'puppy' | 'epic_dragon' */
  skinId?:        string;
  petName?:       string;
  evolutionStage?: EvolutionStage;
  isResting?:     boolean;
  size?:          'sm' | 'md' | 'lg';
}

const FONT_SIZE: Record<'sm' | 'md' | 'lg', number> = { sm: 32, md: 52, lg: 72 };

export function EmojiPet({
  skinId        = 'puppy',
  petName       = 'Buddy',
  evolutionStage = 'hatchling',
  isResting     = false,
  size          = 'md',
}: Props) {
  const { t }       = useTranslation();
  const { themeName } = useTheme();
  const T           = useChildTheme();

  const skin  = PET_SKINS[skinId] ?? PET_SKINS.puppy;
  const stage = STAGE_VISUALS[themeName][evolutionStage];
  // Egg stage removed per IN-2026-05-16-01 — always show the skin emoji.
  const emoji = isResting ? '😴' : skin.emoji;

  // ── Floating bob animation ───────────────────────────────────────────────
  const floatY  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const amplitude = isResting ? 3 : 6;
    const duration  = isResting ? 3000 : 2000;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -amplitude, duration, useNativeDriver: true, easing: t => Math.sin(t * Math.PI) }),
        Animated.timing(floatY, { toValue: 0,          duration, useNativeDriver: true, easing: t => Math.sin(t * Math.PI) }),
      ])
    );
    loop.start();

    Animated.timing(opacity, {
      toValue:         isResting ? 0.6 : 1,
      duration:        300,
      useNativeDriver: true,
    }).start();

    return () => loop.stop();
  }, [isResting]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.petEmoji,
          { fontSize: FONT_SIZE[size] },
          { transform: [{ translateY: floatY }], opacity },
        ]}
      >
        {emoji}
      </Animated.Text>

      {/* Name + stage badge */}
      <View style={styles.nameRow}>
        <Text style={[styles.petName, { color: T.foreground }]}>{petName}</Text>
        <View style={[styles.stageBadge, { backgroundColor: T.muted }]}>
          <Text style={styles.stageBadgeText}>
            {stage.badgeEmoji} {t(stage.labelKey)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { alignItems: 'center', gap: 8 },
  petEmoji:        { lineHeight: undefined },
  nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  petName:         { fontSize: 14, fontWeight: '700' },
  stageBadge:      { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  stageBadgeText:  { fontSize: 11, fontWeight: '600' },
});
