/**
 * LevelPill — friendship-level indicator for the BUFF Gamer aesthetic.
 *
 * Renders "LEVEL N" + 5 dots (N filled lime, 5-N muted). Pure
 * presentational — no i18n, no theme detection.
 */
import type { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BuddyRelationship } from '../../types/buddy';

const COLORS = {
  surface: '#2D2546',
  border:  'rgba(255,255,255,0.10)',
  text:    '#FFFFFF',
  lime:    '#A8E63E',
  faint:   'rgba(255,255,255,0.25)',
} as const;

interface Props {
  level: BuddyRelationship['friendship_level'];
}

export const LevelPill: FC<Props> = ({ level }) => {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>LEVEL {level}</Text>
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View
            key={n}
            style={[styles.dot, { backgroundColor: n <= level ? COLORS.lime : COLORS.faint }]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  COLORS.surface,
    borderRadius:     14,
    paddingVertical:  6,
    paddingHorizontal: 12,
    borderWidth:      1,
    borderColor:      COLORS.border,
    alignSelf:        'flex-start',
  },
  label: {
    color:         COLORS.text,
    fontSize:      12,
    fontWeight:    '700',
    letterSpacing: 1.5,
    marginRight:   10,
  },
  dotsRow: {
    flexDirection: 'row',
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    marginLeft:   4,
  },
});
