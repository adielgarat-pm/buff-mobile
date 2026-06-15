/**
 * BoostersCarousel — horizontal scroll of buddy gift cards.
 *
 * Three card states: Available (lime glow, tappable), Used (faded with
 * "Used Day X" caption), Locked (🔒 overlay for L4/L5 boosters not yet
 * earned). The carousel renders state — actual booster USE mechanics
 * live in a future package; tapping Available calls onPress(gift) and
 * the screen handles the "coming soon" alert.
 */
import type { FC } from 'react';
import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { BuddyGift, BuddyGiftType, BuddyRelationship } from '../../types/buddy';

const COLORS = {
  surface: '#2D2546',
  border:  'rgba(255,255,255,0.10)',
  text:    '#FFFFFF',
  muted:   '#A78BFA',
  faint:   'rgba(255,255,255,0.50)',
  lime:    '#A8E63E',
  canvas:  '#1a1636',
} as const;

const GIFT_ICONS: Record<BuddyGiftType, keyof typeof Ionicons.glyphMap> = {
  theme_color:     'color-palette',
  double_buffs:    'flash',
  mood_pack:       'happy',
  skip_token:      'play-skip-forward',
  reward_discount: 'gift',
  skin:            'paw',
};

// pkg/buddy-gift-loop: every level-up gift is the cosmetic theme_color.
// Locked cards preview the L4/L5 unlocks the child hasn't reached yet.
const LOCKED_PLACEHOLDERS: Array<{ gift_type: BuddyGiftType; given_at_level: 4 | 5 }> = [
  { gift_type: 'theme_color', given_at_level: 4 },
  { gift_type: 'theme_color', given_at_level: 5 },
];

interface Props {
  gifts: BuddyGift[];
  currentLevel: BuddyRelationship['friendship_level'];
  onPress?: (gift: BuddyGift) => void;
}

export const BoostersCarousel: FC<Props> = ({ gifts, currentLevel, onPress }) => {
  const { t } = useTranslation();

  const lockedCards = useMemo(() => {
    // All gifts share gift_type 'theme_color' now, so a level is "still locked"
    // when the child hasn't yet received the gift for that level.
    return LOCKED_PLACEHOLDERS.filter((p) =>
      p.given_at_level > currentLevel && !gifts.some((g) => g.given_at_level === p.given_at_level)
    );
  }, [gifts, currentLevel]);

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('buddy.boosters.sectionTitle')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {gifts.map((gift) => (
          <GiftCard key={gift.id} gift={gift} t={t} onPress={onPress} />
        ))}

        {lockedCards.map((placeholder) => (
          <LockedCard
            key={`locked-${placeholder.given_at_level}`}
            giftType={placeholder.gift_type}
            level={placeholder.given_at_level}
            t={t}
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface GiftCardProps {
  gift: BuddyGift;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onPress?: (gift: BuddyGift) => void;
}

function GiftCard({ gift, t, onPress }: GiftCardProps) {
  const isUsed = gift.is_used;
  const iconName = GIFT_ICONS[gift.gift_type];
  const labelKey = `buddy.boosters.giftType.${gift.gift_type}`;

  if (isUsed) {
    return (
      <View style={[styles.card, styles.cardUsed]}>
        <Ionicons name={iconName} size={28} color={COLORS.faint} />
        <Text style={styles.cardLabel}>{t(labelKey)}</Text>
        <Text style={styles.cardCaption}>{t('buddy.boosters.used')}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, styles.cardAvailable]}
      onPress={() => onPress?.(gift)}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Ionicons name={iconName} size={28} color={COLORS.lime} />
      <Text style={styles.cardLabel}>{t(labelKey)}</Text>
      <Text style={styles.cardCaptionAvailable}>{t('buddy.boosters.available')}</Text>
    </TouchableOpacity>
  );
}

interface LockedCardProps {
  giftType: BuddyGiftType;
  level: 4 | 5;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function LockedCard({ giftType, level, t }: LockedCardProps) {
  const iconName = GIFT_ICONS[giftType];
  const labelKey = `buddy.boosters.giftType.${giftType}`;

  return (
    <View style={[styles.card, styles.cardLocked]}>
      <View style={styles.lockOverlay}>
        <Ionicons name="lock-closed" size={14} color={COLORS.faint} />
      </View>
      <Ionicons name={iconName} size={28} color={COLORS.faint} />
      <Text style={styles.cardLabel}>{t(labelKey)}</Text>
      <Text style={styles.cardCaption}>
        {t('buddy.boosters.unlockAtLevel', { level })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color:         COLORS.text,
    fontSize:      14,
    fontWeight:    '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  12,
  },
  row: {
    paddingRight: 20,
  },
  card: {
    width:           140,
    height:          120,
    borderRadius:    14,
    padding:         12,
    marginRight:     12,
    backgroundColor: COLORS.surface,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  cardAvailable: {
    borderWidth:    2,
    borderColor:    COLORS.lime,
    shadowColor:    COLORS.lime,
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.5,
    shadowRadius:   8,
    elevation:      4,
  },
  cardUsed: {
    opacity: 0.4,
  },
  cardLocked: {
    opacity: 0.45,
  },
  lockOverlay: {
    position: 'absolute',
    top:      8,
    right:    8,
  },
  cardLabel: {
    color:      COLORS.text,
    fontSize:   13,
    fontWeight: '700',
    marginTop:  8,
  },
  cardCaption: {
    color:    COLORS.faint,
    fontSize: 11,
    marginTop: 4,
  },
  cardCaptionAvailable: {
    color:      COLORS.lime,
    fontSize:   11,
    fontWeight: '600',
    marginTop:  4,
  },
});
