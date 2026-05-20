/**
 * VibeFaces — Pastel-mode input for the Daily Vibe Check.
 *
 * 5 emoji buttons in a horizontal row, single-tap to select. System
 * emoji per SPEC § Decisions OQ6 (no custom illustrations for MVP).
 *
 * Pure presentational — takes colors as props so it can be previewed
 * outside a ThemeContext and theme-tested in isolation.
 */
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { VibeLevel } from '../utils/vibeUtils';

const FACES: { level: VibeLevel; emoji: string; a11yKey: string }[] = [
  { level: 1, emoji: '😴', a11yKey: 'vibeCheck.a11y.level1' },
  { level: 2, emoji: '😔', a11yKey: 'vibeCheck.a11y.level2' },
  { level: 3, emoji: '😐', a11yKey: 'vibeCheck.a11y.level3' },
  { level: 4, emoji: '🙂', a11yKey: 'vibeCheck.a11y.level4' },
  { level: 5, emoji: '⚡', a11yKey: 'vibeCheck.a11y.level5' },
];

export interface VibeFacesPalette {
  cardBg:        string;
  cardBorder:    string;
  cardShadow:    string;
  selectedFill:  string;  // background of the selected face
  selectedBorder: string;
}

export interface VibeFacesProps {
  selectedLevel: VibeLevel | null;
  onSelect:      (level: VibeLevel) => void;
  palette:       VibeFacesPalette;
}

export function VibeFaces({ selectedLevel, onSelect, palette }: VibeFacesProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {FACES.map(({ level, emoji, a11yKey }) => {
        const selected = level === selectedLevel;
        return (
          <TouchableOpacity
            key={level}
            onPress={() => onSelect(level)}
            accessibilityRole="button"
            accessibilityLabel={t(a11yKey)}
            accessibilityState={{ selected }}
            style={[
              styles.faceBtn,
              {
                backgroundColor: selected ? palette.selectedFill : palette.cardBg,
                borderColor:     selected ? palette.selectedBorder : palette.cardBorder,
                shadowColor:     palette.cardShadow,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{emoji}</Text>
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
    gap: 8,
  },
  faceBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  emoji: { fontSize: 32 },
});
