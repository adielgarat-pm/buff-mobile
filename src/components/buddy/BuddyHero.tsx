/**
 * BuddyHero — shared visual for the buddy character.
 *
 * Used by:
 *   - GamerDashboardScreen (size='dashboard') — top hero region with × to hide.
 *   - GamerMeAndBuddyScreen / 5A (size='screen') — larger hero on the
 *     dedicated buddy screen.
 *
 * Render priority:
 *   1. PNG asset from buddyAssets (when BUDDY_ASSETS_READY === true)
 *   2. Emoji from PET_SKINS (any heroic/sweet skin the child picked via
 *      PetSkinPicker — tiger, shark, dragon, puppy, cat, etc.) — keeps the
 *      Gamer dashboard hero in sync with the child's actual selection
 *      instead of forcing a wolf silhouette
 *   3. SVG silhouette (wolf/capybara) — legacy fallback only when skinId
 *      is null/unknown
 */
import type { FC } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BuddyRelationship } from '../../types/buddy';
import {
  getBuddyAssetForLevel,
  isKnownBuddySkin,
  type BuddySkinId,
} from './buddyAssets';
import { WolfSilhouette } from './WolfSilhouette';
import { CapybaraSilhouette } from './CapybaraSilhouette';
import { PET_SKINS } from '../../types/pet';

const COLORS = {
  surface:    '#2D2546',
  border:     'rgba(255,255,255,0.10)',
  closeBg:    'rgba(26,22,54,0.75)',
  closeIcon:  '#A78BFA',
} as const;

const SIZE_PX: Record<'dashboard' | 'screen', number> = {
  dashboard: 112,
  screen:    192,
};

interface Props {
  size: 'dashboard' | 'screen';
  skinId: string | null | undefined;
  level: BuddyRelationship['friendship_level'];
  /** When provided, taps anywhere on the hero (excluding the × button) trigger it. */
  onPress?: () => void;
  /** When provided, a small × button appears top-right and invokes this. */
  onClose?: () => void;
}

export const BuddyHero: FC<Props> = ({ size, skinId, level, onPress, onClose }) => {
  const px = SIZE_PX[size];
  const closeBtnSize = size === 'dashboard' ? 28 : 36;

  const character = renderCharacter(skinId, level, px);

  const inner = (
    <View
      style={[
        styles.container,
        { width: px + 16, height: px + 16 },
      ]}
      testID="buddy-hero-container"
    >
      {character}

      {onClose && (
        <TouchableOpacity
          onPress={(e) => {
            // Guard for the test harness (fireEvent.press passes no event)
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            onClose();
          }}
          style={[
            styles.closeBtn,
            { width: closeBtnSize, height: closeBtnSize, borderRadius: closeBtnSize / 2 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="hide-buddy"
          testID="buddy-hero-close"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={size === 'dashboard' ? 16 : 20} color={COLORS.closeIcon} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="open-buddy-screen"
        testID="buddy-hero-press"
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
};

function renderCharacter(
  skinId: string | null | undefined,
  level: BuddyRelationship['friendship_level'],
  px: number,
) {
  const asset = getBuddyAssetForLevel(skinId, level);
  if (asset) {
    return (
      <Image
        source={asset}
        style={{ width: px, height: px }}
        accessibilityRole="image"
        accessibilityLabel="buddy"
      />
    );
  }

  // Emoji path — honors the kid's PetSkinPicker selection (wolf, tiger,
  // shark, dragon, puppy, cat, etc.) so the Gamer hero matches what they
  // see in the Pet area / Mint dashboard.
  const skinDef = skinId ? PET_SKINS[skinId] : undefined;
  if (skinDef) {
    return (
      <Text
        style={{ fontSize: px * 0.7, lineHeight: px }}
        accessibilityRole="image"
        accessibilityLabel="buddy"
        testID="buddy-hero-emoji"
      >
        {skinDef.emoji}
      </Text>
    );
  }

  // Legacy silhouette fallback — only when skinId is null or unrecognized.
  const resolvedSkin: BuddySkinId = isKnownBuddySkin(skinId) ? skinId : 'wolf';
  if (resolvedSkin === 'capybara') {
    return <CapybaraSilhouette level={level} size={px} />;
  }
  return <WolfSilhouette level={level} size={px} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderColor:     COLORS.border,
    borderWidth:     1,
    borderRadius:    16,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  closeBtn: {
    position:        'absolute',
    top:             6,
    right:           6,
    backgroundColor: COLORS.closeBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
