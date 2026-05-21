/**
 * Buddy asset registry — Wolf STORMY + Capybara LUNA (and future buddies).
 *
 * Phase 1 of pkg/teen-ui-with-buddy-character originally shipped this file
 * with `BUDDY_ASSETS_READY = false` and a static null-filled map. The SVG
 * silhouette components (WolfSilhouette, CapybaraSilhouette) render as the
 * visible fallback whenever a skin×level slot is `null`.
 *
 * 2026-05-21 — wolf STORMY PNGs partially landed: L1, L2, L5 are wired
 * here; L3 and L4 still resolve to `null` (silhouette gap). To avoid the
 * jarring "PNG → silhouette → PNG" stepping as a child levels up,
 * `getBuddyAssetForLevelWithFallback` returns the nearest-level PNG for
 * the same skin when the exact level is missing. Capybara LUNA stays
 * silhouette-only — no capybara PNGs delivered yet.
 *
 * When the remaining PNGs land, just replace the matching `null`s with
 * `require()` calls and the fallback helper becomes a no-op naturally.
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
 * Master switch for the buddy asset registry. Flipped from `false` →
 * `true` on 2026-05-21 when the first wolf PNGs landed. Individual
 * skin×level slots can still be `null` (= silhouette / nearest-level
 * fallback).
 */
export const BUDDY_ASSETS_READY = true;

type LevelMap = Record<BuddyRelationship['friendship_level'], ImageSourcePropType | null>;

const ASSETS: Record<BuddySkinId, LevelMap> = {
  wolf: {
    1: require('../../../assets/buddies/wolf-stormy-L1.png'),
    2: require('../../../assets/buddies/wolf-stormy-L2.png'),
    3: null, // TODO PNG — falls back to L2 via nearest-level resolver
    4: null, // TODO PNG — falls back to L5 via nearest-level resolver
    5: require('../../../assets/buddies/wolf-stormy-L5.png'),
  },
  capybara: {
    1: null, // TODO PNG — silhouette renders until capybara assets land
    2: null,
    3: null,
    4: null,
    5: null,
  },
};

/**
 * Returns the buddy image for an EXACT skin × level slot, or `null` if
 * not yet wired (or the skin is unknown / `BUDDY_ASSETS_READY` is off).
 *
 * Most callers want `getBuddyAssetForLevelWithFallback` — this raw
 * lookup is kept for callers that want to know "is there a real asset
 * for THIS level" (e.g. tests).
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
 * Returns the buddy image for a given skin × level. If the exact level
 * has no PNG yet, returns the nearest available level for the same skin
 * (so the child never sees the silhouette wireframe mid-progression once
 * any PNG for their skin exists). Falls back to `null` only when the
 * skin has no PNGs at all (e.g. capybara today) — callsite renders the
 * silhouette in that case.
 */
export function getBuddyAssetForLevelWithFallback(
  skinId: string | null | undefined,
  level: BuddyRelationship['friendship_level']
): ImageSourcePropType | null {
  if (!BUDDY_ASSETS_READY) return null;
  if (!isKnownBuddySkin(skinId)) return null;

  const map = ASSETS[skinId];
  const exact = map[level];
  if (exact) return exact;

  // Nearest-level fallback: sort {1..5} by |candidate - level|, take
  // the first one with a non-null asset. Tie-break favors lower level
  // (Array.sort is stable, and we iterate in 1→5 order).
  const candidates: BuddyRelationship['friendship_level'][] = [1, 2, 3, 4, 5];
  const sorted = candidates
    .filter((l) => map[l] !== null)
    .sort((a, b) => Math.abs(a - level) - Math.abs(b - level));

  return sorted.length > 0 ? map[sorted[0]] : null;
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
