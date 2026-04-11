import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PhaseConfig } from '../types/phase';
import { useChildTheme } from '../contexts/ThemeContext';

interface Props {
  phase: PhaseConfig;
  completed: number;
  total: number;
  earnedCredits: number;
  totalCredits: number;
}

const SIZE         = 120;
const STROKE_WIDTH = 8;
const RADIUS       = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = RADIUS * 2 * Math.PI;

export function PhaseProgressCircle({ phase, completed, total, earnedCredits, totalCredits }: Props) {
  const T          = useChildTheme();
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && total > 0;
  const offset     = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  return (
    <View style={styles.container}>
      <View>
        {/* SVG ring — rotated so progress starts at the top */}
        <Svg width={SIZE} height={SIZE} style={styles.rotated}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={T.muted}
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress arc */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={isComplete ? T.success : T.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={offset}
          />
        </Svg>

        {/* Center label */}
        <View style={styles.center}>
          <Text style={styles.icon}>{phase.icon}</Text>
          <Text style={[styles.fraction, { color: isComplete ? T.primary : T.foreground }]}>
            {completed}/{total}
          </Text>
        </View>
      </View>

      <Text style={[styles.label, { color: T.foreground }]}>{phase.label}</Text>
      <Text style={[styles.credits, { color: T.mutedForeground }]}>
        {earnedCredits} / {totalCredits} Buffs
      </Text>

      {isComplete && (
        <View style={[styles.badge, { backgroundColor: T.primary + '33' }]}>
          <Text style={[styles.badgeText, { color: T.primary }]}>✓ Phase Complete!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  rotated:   { transform: [{ rotate: '-90deg' }] },
  center: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon:      { fontSize: 28, marginBottom: 2 },
  fraction:  { fontSize: 20, fontWeight: '700' },
  label:     { fontSize: 18, fontWeight: '600', marginTop: 12 },
  credits:   { fontSize: 13, marginTop: 2 },
  badge:     { marginTop: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
