/**
 * BatteryGlyph — pure-View battery shape (terminal nub + body + bottom-up fill).
 *
 * Dependency-free except for the optional charging bolt, which uses the
 * already-bundled @expo/vector-icons Ionicons (no new dependency).
 *
 * Shared by:
 *   - VibeBattery (Gamer-mode Daily Vibe Check selector — 5 interactive cells)
 *   - ParentDashboardScreen (single static low-charge SOS indicator)
 *
 * Fill rises from the bottom (height ∝ level/maxLevel) so it reads as a
 * charge gauge. Vertical fill is RTL-immune; the row direction is the
 * caller's concern.
 */
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface BatteryGlyphProps {
  /** Charge amount, 0..maxLevel. */
  level:      number;
  /** Denominator for the fill proportion. Default 5. */
  maxLevel?:  number;
  /** Body width in px. Default 30. */
  width?:     number;
  /** Total height incl. terminal nub, in px. Default 60. */
  height?:    number;
  /** Filled-portion color. */
  fillColor:  string;
  /** Interior color behind the fill (the "empty" track). */
  trackColor: string;
  /** Body outline + terminal color. */
  borderColor: string;
  /** Show a centered charging bolt (selected state). */
  showBolt?:  boolean;
  /** Bolt color — defaults to deep violet for contrast on lime. */
  boltColor?: string;
  /** Apply a colored glow around the body (selected state). */
  glow?:      boolean;
  glowColor?: string;
}

export function BatteryGlyph({
  level,
  maxLevel = 5,
  width = 30,
  height = 60,
  fillColor,
  trackColor,
  borderColor,
  showBolt = false,
  boltColor = '#1a1636',
  glow = false,
  glowColor,
}: BatteryGlyphProps) {
  const terminalH = Math.max(3, Math.round(height * 0.07));
  const gap       = 2;
  const bodyH     = height - terminalH - gap;
  const pct       = Math.max(0, Math.min(1, level / maxLevel));
  const boltSize  = Math.round(width * 0.72);

  return (
    <View style={[styles.root, { width, height }]}>
      <View
        style={[
          styles.terminal,
          { width: Math.round(width * 0.36), height: terminalH, backgroundColor: borderColor },
        ]}
      />
      <View
        style={[
          styles.body,
          { width, height: bodyH, borderColor, backgroundColor: trackColor },
          glow && glowColor
            ? {
                shadowColor:   glowColor,
                shadowOpacity: 0.7,
                shadowRadius:  12,
                shadowOffset:  { width: 0, height: 0 },
                elevation:     6,
              }
            : null,
        ]}
      >
        <View style={[styles.fill, { height: `${pct * 100}%`, backgroundColor: fillColor }]} />
        {showBolt && (
          <View style={styles.boltWrap} pointerEvents="none">
            <Ionicons name="flash" size={boltSize} color={boltColor} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { alignItems: 'center', justifyContent: 'flex-start' },
  terminal: { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  body: {
    borderWidth:    2,
    borderRadius:   6,
    overflow:       'hidden',
    justifyContent: 'flex-end',
    marginTop:      2,
  },
  fill: { width: '100%' },
  boltWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
