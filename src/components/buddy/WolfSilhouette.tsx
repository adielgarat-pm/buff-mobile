/**
 * WolfSilhouette — abstract SVG fallback for Wolf STORMY.
 *
 * Used by `BuddyHero` only when no wolf PNG can be resolved for any
 * friendship level (e.g. all wolf slots in `buddyAssets.ts` are null).
 * Today wolf L1/L2/L5 PNGs are wired, with L3/L4 falling back to the
 * nearest PNG — so in practice this silhouette is the day-1 path for
 * non-wolf skins that share the heroic geometry (and the safety net).
 * Renders a stylized wolf-head
 * silhouette in the Gamer aesthetic (charcoal-violet fill + neon-lime
 * edge highlights — BUFF_BRAND.md §7.5).
 *
 * The edge stroke and inner-ear glow opacity scale with friendship
 * level (L1 = faint, L5 = bright) to give a quiet sense of arc without
 * changing the wolf's expression — Pillar 2 (never sad, never angry).
 *
 * Pure presentational component — no state, no data access.
 */
import type { FC } from 'react';
import Svg, { Circle, Polygon } from 'react-native-svg';
import type { BuddyRelationship } from '../../types/buddy';

interface Props {
  /** Friendship level — drives edge-glow intensity. */
  level?: BuddyRelationship['friendship_level'];
  /** Rendered side length in px. Defaults to 96 (5A hero size). */
  size?: number;
}

const FILL_BODY = '#2D2546';   // GamerDashboardScreen.surface
const FILL_INNER = '#1a1636';  // GamerDashboardScreen.canvas (deeper, for nose/snout depth)
const STROKE = '#A8E63E';      // BUFF lime (BUFF_BRAND.md §7.5)

/** Linear scale from L1 → L5: 0.35 → 1.00 */
function edgeOpacityForLevel(level: BuddyRelationship['friendship_level']): number {
  return 0.35 + ((level - 1) * 0.1625);
}

export const WolfSilhouette: FC<Props> = ({ level = 3, size = 96 }) => {
  const edge = edgeOpacityForLevel(level);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Ears — drawn first so the head overlaps cleanly */}
      <Polygon
        points="22,18 18,3 38,22"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeOpacity={edge}
      />
      <Polygon
        points="78,18 82,3 62,22"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={1.5}
        strokeOpacity={edge}
      />
      {/* Inner-ear highlights — pick up the lime, faint */}
      <Polygon points="25,16 22,9 33,20" fill={STROKE} fillOpacity={edge * 0.35} />
      <Polygon points="75,16 78,9 67,20" fill={STROKE} fillOpacity={edge * 0.35} />

      {/* Head outline — 10-point polygon, alert-but-calm wolf head */}
      <Polygon
        points="35,20 22,30 18,52 28,72 50,85 72,72 82,52 78,30 65,20 50,18"
        fill={FILL_BODY}
        stroke={STROKE}
        strokeWidth={2}
        strokeOpacity={edge}
      />

      {/* Eyes — alert, forward-facing */}
      <Circle cx="38" cy="48" r="3.2" fill={STROKE} fillOpacity={edge} />
      <Circle cx="62" cy="48" r="3.2" fill={STROKE} fillOpacity={edge} />

      {/* Snout — narrower wedge for the wolf */}
      <Polygon
        points="42,62 50,80 58,62"
        fill={FILL_INNER}
        stroke={STROKE}
        strokeWidth={1.2}
        strokeOpacity={edge * 0.75}
      />

      {/* Nose tip */}
      <Circle cx="50" cy="68" r="2" fill={STROKE} fillOpacity={edge * 0.85} />
    </Svg>
  );
};
