import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';

/**
 * DayScheduleToggles — a row of 7 weekday chips (Sun…Sat = 0…6) that drive a
 * task's `schedule_days`. Ported from the Lovable web app's polished version.
 *
 * Rules (mirrored from Lovable):
 *   - A selected day is highlighted; tapping toggles it.
 *   - The last remaining day can't be deselected (a task always runs on ≥1 day),
 *     otherwise it would silently never appear and read as "broken".
 *
 * In Hebrew (RTL) the row flips automatically, so Sunday lands on the right —
 * matching how the days read on screen.
 */
interface DayScheduleTogglesProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

export function DayScheduleToggles({ selectedDays, onChange }: DayScheduleTogglesProps) {
  const { t } = useTranslation();

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      // Don't allow deselecting the last day.
      if (selectedDays.length > 1) {
        onChange(selectedDays.filter(d => d !== day));
      }
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <View style={styles.row}>
      {DAY_INDICES.map(day => {
        const isSelected = selectedDays.includes(day);
        const label = t(`parentTasks.day.${day}`);
        return (
          <TouchableOpacity
            key={day}
            onPress={() => toggleDay(day)}
            style={[
              styles.dayBtn,
              {
                backgroundColor: isSelected ? T.accent : T.bg,
                borderColor:     isSelected ? T.accent : T.cardBorder,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={label}
          >
            <Text style={[styles.dayText, { color: isSelected ? '#fff' : T.textMuted }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dayBtn:  { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '600' },
});
