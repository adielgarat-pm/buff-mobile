/**
 * CapybaraSilhouette — abstract SVG fallback for Capybara LUNA.
 *
 * Parallel to WolfSilhouette + FoxSilhouette. Same level →
 * edge-opacity scaling. Different geometry: rounder head, side-set
 * small ears, wide flat nose, slightly closer-set eyes — reads as
 * calm and unhurried (Pillar 2 — never sad, never goofy, never
 * anxious). Different color identity per D-2026-05-16-?? (locked
 * 2026-05-16): warm amber-honey edges and eye glow, vs the wolf's
 * lime and the fox's lavender.
 *
 * Pure presentational component.
 */
import type { FC } from 'react';
import Svg, { Circle, Polygon, Path } from 'react-native-svg';
import type { BuddyRelationship } from '../../types/buddy';

interface Props {
  level?: BuddyRelationship['friendship_level'];
  size?: number;
}

const FILL_BODY = '#2D2546';
const FILL_INNER = '#1a1636';
/** Capybara identity color — warm amber-honey. Distinct from wolf's lime + fox's lavender. */
const STROKE = '#F0B868';

function edgeOpacityForLevel(level: BuddyRelationship['friendship_level']): number {
  return 0.35 + ((level - 1) * 0.1625);
}

export const CapybaraSilhouette: FC<Props> = ({ level = 3, size = 96 }) => {
  const edge = edgeOpacityForLevel(level);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Side-set ears — small, low on the head (capybara, not wolf) */}
      <Polygon
        points="18,38 13,33 17,46"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={1.3}
        strokeOpacity={edge}
      />
      <Polygon
        points="82,38 87,33 83,46"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={1.3}
        strokeOpacity={edge}
      />

      {/* Head outline — broader, rounder than wolf, no peak */}
      <Polygon
        points="30,22 22,30 18,52 22,72 35,86 65,86 78,72 82,52 78,30 70,22 50,20"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={2}
        strokeOpacity={edge}
      />

      {/* Eyes — calmer (smaller, slightly closer set than wolf) */}
      <Circle cx="40" cy="48" r="2.8" fill={STROKE} fillOpacity={edge} />
      <Circle cx="60" cy="48" r="2.8" fill={STROKE} fillOpacity={edge} />

      {/* Wide nose / muzzle — broad rounded shape, not a wedge */}
      <Path
        d="M 36,66 Q 50,74 64,66 Q 62,72 50,73 Q 38,72 36,66 Z"
        fill={FILL_INNER}
        stroke={STROKE}
        strokeWidth={1.2}
        strokeOpacity={edge * 0.75}
      />

      {/* Nostrils */}
      <Circle cx="46" cy="69" r="1.2" fill={STROKE} fillOpacity={edge * 0.8} />
      <Circle cx="54" cy="69" r="1.2" fill={STROKE} fillOpacity={edge * 0.8} />
    </Svg>
  );
};
