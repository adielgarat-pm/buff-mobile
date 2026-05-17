/**
 * FoxSilhouette — abstract SVG fallback for Fox ECHO.
 *
 * Parallel to WolfSilhouette + CapybaraSilhouette. Same level →
 * edge-opacity scaling. Different geometry: taller and more
 * pointed ears, narrower face, sharper snout — reads quick and
 * sleek. Different color identity per D-2026-05-16-?? (locked
 * 2026-05-16): silver-charcoal body with blue-lavender edges
 * and eye glow, vs the wolf's lime.
 *
 * Pure presentational component.
 */
import type { FC } from 'react';
import Svg, { Circle, Polygon } from 'react-native-svg';
import type { BuddyRelationship } from '../../types/buddy';

interface Props {
  level?: BuddyRelationship['friendship_level'];
  size?: number;
}

const FILL_BODY = '#2D2546';
const FILL_INNER = '#1a1636';
/** Fox identity color — blue-lavender. Distinct from wolf's lime. */
const STROKE = '#9CA0FF';

function edgeOpacityForLevel(level: BuddyRelationship['friendship_level']): number {
  return 0.35 + ((level - 1) * 0.1625);
}

export const FoxSilhouette: FC<Props> = ({ level = 3, size = 96 }) => {
  const edge = edgeOpacityForLevel(level);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Ears — taller + more pointed than the wolf */}
      <Polygon
        points="28,20 24,2 40,22"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeOpacity={edge}
      />
      <Polygon
        points="72,20 76,2 60,22"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeOpacity={edge}
      />
      {/* Inner-ear highlights */}
      <Polygon points="30,18 27,8 36,20" fill={STROKE} fillOpacity={edge * 0.35} />
      <Polygon points="70,18 73,8 64,20" fill={STROKE} fillOpacity={edge * 0.35} />

      {/* Head outline — narrower than wolf, more tapered */}
      <Polygon
        points="38,22 24,32 20,54 28,72 50,86 72,72 80,54 76,32 62,22 50,20"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={2}
        strokeOpacity={edge}
      />

      {/* Eyes — slightly smaller than wolf, almond-ish */}
      <Circle cx="38" cy="50" r="2.8" fill={STROKE} fillOpacity={edge} />
      <Circle cx="62" cy="50" r="2.8" fill={STROKE} fillOpacity={edge} />

      {/* Snout — narrower wedge, sharper than wolf */}
      <Polygon
        points="44,62 50,82 56,62"
        fill={FILL_INNER}
        stroke={STROKE}
        strokeWidth={1.2}
        strokeOpacity={edge * 0.75}
      />

      {/* Nose tip — small, more forward than wolf */}
      <Circle cx="50" cy="70" r="1.7" fill={STROKE} fillOpacity={edge * 0.85} />
    </Svg>
  );
};
