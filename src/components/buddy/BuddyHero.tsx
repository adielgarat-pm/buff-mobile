/**
 * BuddyHero — shared visual for the buddy character.
 *
 * Used by:
 *   - GamerDashboardScreen (size='dashboard') — top hero region with × to hide.
 *   - GamerMeAndBuddyScreen / 5A (size='screen') — larger hero on the
 *     dedicated buddy screen.
 *
 * Asset selection per pkg/teen-ui-with-buddy-character SPEC §"Architectural
 * Decision 3": static `require()` map keyed by skin × level. Today the map
 * returns null (BUDDY_ASSETS_READY = false) → component falls back to the
 * per-skin SVG silhouette. When PNGs land, a single 1-line PR flips the
 * registry and BuddyHero starts rendering raster art with zero call-site
 * changes.
 */
import type { FC } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BuddyRelationship } from '../../types/buddy';
import {
  getBuddyAssetForLevel,
  isKnownBuddySkin,
  type BuddySkinId,
} from './buddyAssets';
import { WolfSilhouette } from './WolfSilhouette';
import { CapybaraSilhouette } from './CapybaraSilhouette';

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
