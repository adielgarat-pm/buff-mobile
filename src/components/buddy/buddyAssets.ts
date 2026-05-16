/**
 * Buddy asset registry — Wolf STORMY + Capybara LUNA (and future buddies).
 *
 * Phase 1 of pkg/teen-ui-with-buddy-character ships this file with
 * `BUDDY_ASSETS_READY = false` and a static null-filled map. The SVG
 * silhouette components (WolfSilhouette, CapybaraSilhouette) render
 * as the visible fallback until the Midjourney PNGs land.
 *
 * When Adi delivers the assets (`assets/buddies/wolf-stormy-L{1..5}.png`
 * and `assets/buddies/capybara-luna-L{1..5}.png`), this file flips
 * `BUDDY_ASSETS_READY` to `true` and uncomments the static `require()`
 * map. That's a 1-line PR — Expo Metro requires the paths to be static
 * literals, so the map is hand-written rather than computed.
 *
 * Skins not in this registry (puppy, tiger, panda, unicorn, …) fall
 * back to the silhouette path; their proper assets are out of scope
 * for this package.
 */
import type { ImageSourcePropType } from 'react-native';
import type { BuddyRelationship } from '../../types/buddy';

/** Skins for which proper buddy artwork exists (or will, once assets ship). */
export type BuddySkinId = 'wolf' | 'capybara';

export const KNOWN_BUDDY_SKINS: readonly BuddySkinId[] = ['wolf', 'capybara'];

export function isKnownBuddySkin(skinId: string | null | undefined): skinId is BuddySkinId {
  return skinId === 'wolf' || skinId === 'capybara';
}

/**
 * Phase 1 ships with this flag `false` — silhouette renders instead.
 * Flip to `true` in the same commit that uncomments the `require()`s below.
 */
export const BUDDY_ASSETS_READY = false;

type LevelMap = Record<BuddyRelationship['friendship_level'], ImageSourcePropType | null>;

const ASSETS: Record<BuddySkinId, LevelMap> = {
  wolf: {
    1: null, // require('../../../assets/buddies/wolf-stormy-L1.png'),
    2: null, // require('../../../assets/buddies/wolf-stormy-L2.png'),
    3: null, // require('../../../assets/buddies/wolf-stormy-L3.png'),
    4: null, // require('../../../assets/buddies/wolf-stormy-L4.png'),
    5: null, // require('../../../assets/buddies/wolf-stormy-L5.png'),
  },
  capybara: {
    1: null, // require('../../../assets/buddies/capybara-luna-L1.png'),
    2: null, // require('../../../assets/buddies/capybara-luna-L2.png'),
    3: null, // require('../../../assets/buddies/capybara-luna-L3.png'),
    4: null, // require('../../../assets/buddies/capybara-luna-L4.png'),
    5: null, // require('../../../assets/buddies/capybara-luna-L5.png'),
  },
};

/**
 * Returns the buddy image for a given skin + friendship level, or `null`
 * if assets are not yet ready or the skin is unknown. Callers fall back
 * to the SVG silhouette in either case.
 */
export function getBuddyAssetForLevel(
  skinId: string | null | undefined,
  level: BuddyRelationship['friendship_level']
): ImageSourcePropType | null {
  if (!BUDDY_ASSETS_READY) return null;
  if (!isKnownBuddySkin(skinId)) return null;
  return ASSETS[skinId][level];
}

/**
 * Default name per buddy skin. Used by `BuddyHero` and the name-edit
 * modal when `buddy_relationships.buddy_name` is `NULL`. The child can
 * override at first launch and via Settings (Phase 2 feature).
 */
export const BUDDY_DEFAULT_NAMES: Record<BuddySkinId, string> = {
  wolf:     'STORMY',
  capybara: 'LUNA',
};

export function getBuddyDefaultName(skinId: string | null | undefined): string | null {
  if (!isKnownBuddySkin(skinId)) return null;
  return BUDDY_DEFAULT_NAMES[skinId];
}
