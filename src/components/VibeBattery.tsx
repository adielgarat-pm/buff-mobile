/**
 * VibeBattery — Gamer-mode input for the Daily Vibe Check.
 *
 * 5 recharging-battery cells, single-tap to select, lime fill + charging
 * bolt on the selected level. Replaces the earlier energy-bars selector
 * (pkg/vibe-check-battery) while keeping the discrete-tap-target model
 * from SPEC § Decisions OQ7 (no slider — discrete targets for kid accuracy).
 *
 * Values note (Pillar 2): the selected cell glows the SAME lime at every
 * level — there is no red-low/green-high danger gradient. A low charge is
 * a valid self-report ("no wrong answer"), not a failure. The battery is
 * the kid's own charge, never a creature to keep alive.
 *
 * Pure presentational — takes colors as props for preview / testing.
 * Props mirror the old VibeBars contract: { selectedLevel, onSelect, palette }.
 */
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BatteryGlyph } from './BatteryGlyph';
import type { VibeLevel } from '../utils/vibeUtils';

const LEVELS: { level: VibeLevel; a11yKey: string }[] = [
  { level: 1, a11yKey: 'vibeCheck.a11y.level1' },
  { level: 2, a11yKey: 'vibeCheck.a11y.level2' },
  { level: 3, a11yKey: 'vibeCheck.a11y.level3' },
  { level: 4, a11yKey: 'vibeCheck.a11y.level4' },
  { level: 5, a11yKey: 'vibeCheck.a11y.level5' },
];

export interface VibeBatteryPalette {
  trackBg:        string;  // battery interior behind the fill
  border:         string;  // unselected body outline
  unselectedFill: string;  // muted fill showing the level on unselected cells
  selectedFill:   string;  // lime fill on the selected cell
  selectedGlow:   string;  // lime glow on the selected cell
  boltColor:      string;  // charging bolt drawn on the selected cell
  labelColor:     string;  // numeric "1..5" beneath
}

export interface VibeBatteryProps {
  selectedLevel: VibeLevel | null;
  onSelect:      (level: VibeLevel) => void;
  palette:       VibeBatteryPalette;
}

export function VibeBattery({ selectedLevel, onSelect, palette }: VibeBatteryProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {LEVELS.map(({ level, a11yKey }) => {
        const selected = level === selectedLevel;
        return (
          <TouchableOpacity
            key={level}
            onPress={() => onSelect(level)}
            accessibilityRole="button"
            accessibilityLabel={t(a11yKey)}
            accessibilityState={{ selected }}
            style={styles.cell}
            activeOpacity={0.7}
          >
            <BatteryGlyph
              level={level}
              maxLevel={5}
              width={34}
              height={64}
              fillColor={selected ? palette.selectedFill : palette.unselectedFill}
              trackColor={palette.trackBg}
              borderColor={selected ? palette.selectedFill : palette.border}
              showBolt={selected}
              boltColor={palette.boltColor}
              glow={selected}
              glowColor={palette.selectedGlow}
            />
            <Text style={[styles.label, { color: palette.labelColor }]}>{level}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    gap:            10,
    paddingTop:     12,
  },
  cell: {
    flex:       1,
    alignItems: 'center',
    gap:        8,
  },
  label: {
    fontSize:      11,
    fontWeight:    '800',
    letterSpacing: 1,
  },
});
