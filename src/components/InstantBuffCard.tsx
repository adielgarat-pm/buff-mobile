/**
 * InstantBuffCard — Low-Power-Mode-only card with a rotating self-care
 * prompt. Tap → +5 BUFFs awarded via useLowPower().awardInstantBuff()
 * and the card dismisses.
 *
 * Once-per-session by design: after a successful award, the card hides
 * for the rest of the mount lifecycle. Tomorrow (or after a fresh load
 * on another low-power day) it returns. Rationale: Pillar 1 — we
 * don't want the kid grinding tap-tap-tap for coins. One micro-reward
 * for one act of self-care.
 *
 * Prompt rotation: picks one of 3 (water/breath/stretch) at mount time.
 * Stable for the lifetime of the card — kid sees the same prompt while
 * the card is up, not a flicker.
 *
 * Self-conditional: renders null when !isLowPower OR after award.
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLowPower } from '../contexts/LowPowerContext';

export interface InstantBuffCardPalette {
  bg:        string;
  border:    string;
  title:     string;
  prompt:    string;
  ctaBg:     string;
  ctaText:   string;
  ctaShadow: string;
}

export interface InstantBuffCardProps {
  palette: InstantBuffCardPalette;
}

const PROMPT_KEYS = [
  'instantBuff.prompt.water',
  'instantBuff.prompt.breath',
  'instantBuff.prompt.stretch',
] as const;

export default function InstantBuffCard({ palette }: InstantBuffCardProps) {
  const { t } = useTranslation();
  const { isLowPower, awardInstantBuff, instantBuffAwarded } = useLowPower();
  const [awarded, setAwarded] = useState(false);

  // Pick a prompt at mount and keep it stable until card unmounts.
  const promptKey = useMemo(
    () => PROMPT_KEYS[Math.floor(Math.random() * PROMPT_KEYS.length)],
    [],
  );

  // Hidden when: not a low day · just tapped (optimistic) · OR already granted
  // today per the server one-shot flag — so a reload can't bring it back to farm
  // (audit M6). The limit is silent by design: the card's absence is the message.
  if (!isLowPower || awarded || instantBuffAwarded) return null;

  const onPress = async () => {
    setAwarded(true);  // optimistic — hides the card immediately
    const { error } = await awardInstantBuff();
    if (error) {
      console.warn('[InstantBuffCard] awardInstantBuff failed:', error);
      setAwarded(false);  // roll back so kid can retry
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.title, { color: palette.title }]}>
        {t('instantBuff.title')}
      </Text>
      <Text style={[styles.prompt, { color: palette.prompt }]}>
        {t(promptKey)}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('instantBuff.cta')}
        style={[
          styles.cta,
          { backgroundColor: palette.ctaBg, shadowColor: palette.ctaShadow },
        ]}
      >
        <Text style={[styles.ctaText, { color: palette.ctaText }]}>
          {t('instantBuff.cta')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  cta: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
