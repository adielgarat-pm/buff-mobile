/**
 * VibeBars — Gamer-mode input for the Daily Vibe Check.
 *
 * 5 horizontal energy bars, single-tap to select, lime fill for the
 * selected level per SPEC § Decisions OQ7 (no slider, no battery
 * meter — discrete tap targets for kid accuracy).
 *
 * Pure presentational — takes colors as props for preview / testing.
 */
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { VibeLevel } from '../utils/vibeUtils';

const LEVELS: { level: VibeLevel; a11yKey: string }[] = [
  { level: 1, a11yKey: 'vibeCheck.a11y.level1' },
  { level: 2, a11yKey: 'vibeCheck.a11y.level2' },
  { level: 3, a11yKey: 'vibeCheck.a11y.level3' },
  { level: 4, a11yKey: 'vibeCheck.a11y.level4' },
  { level: 5, a11yKey: 'vibeCheck.a11y.level5' },
];

export interface VibeBarsPalette {
  barBg:         string;  // unselected fill
  barBorder:     string;  // unselected border
  selectedFill:  string;  // selected lime fill
  selectedGlow:  string;  // selected glow / shadow color
  labelColor:    string;  // numeric "1..5" beneath
}

export interface VibeBarsProps {
  selectedLevel: VibeLevel | null;
  onSelect:      (level: VibeLevel) => void;
  palette:       VibeBarsPalette;
}

export function VibeBars({ selectedLevel, onSelect, palette }: VibeBarsProps) {
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
            style={styles.barCol}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.bar,
                {
                  // Taller bars for higher levels — visual energy ramp.
                  height: 28 + (level - 1) * 14,
                  backgroundColor: selected ? palette.selectedFill : palette.barBg,
                  borderColor:     selected ? palette.selectedFill : palette.barBorder,
                  shadowColor:     palette.selectedGlow,
                  shadowOpacity:   selected ? 0.6 : 0,
                },
              ]}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 12,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
