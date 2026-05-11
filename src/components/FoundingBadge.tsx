/**
 * FoundingBadge — visual badge for Founding 100 members.
 *
 * Renders the user's founding_member_number (1..100) with a small visual flair.
 * Use sparingly — profile header, dashboard corner, settings screen.
 *
 * Source SPEC: docs/sessions/founding-100-payment/SPEC.md §Phases / Phase 3
 */
import { View, Text, StyleSheet } from 'react-native';

interface FoundingBadgeProps {
  /** The user's founding member number (1..100). If null/undefined, the badge renders nothing. */
  memberNumber?: number | null;
  /** Visual variant. Default 'inline'. */
  variant?: 'inline' | 'large';
}

export function FoundingBadge({ memberNumber, variant = 'inline' }: FoundingBadgeProps) {
  if (!memberNumber) return null;

  const isLarge = variant === 'large';

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <Text style={[styles.label, isLarge && styles.labelLarge]}>
        FOUNDING MEMBER
      </Text>
      <Text style={[styles.number, isLarge && styles.numberLarge]}>
        #{memberNumber}
      </Text>
      <Text style={[styles.suffix, isLarge && styles.suffixLarge]}>
        of 100
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#1a1636',
    borderWidth: 1,
    borderColor: '#A8E63E',
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  label: {
    color: '#A8E63E',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginRight: 6,
  },
  labelLarge: {
    fontSize: 11,
    marginRight: 10,
  },
  number: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  numberLarge: {
    fontSize: 18,
  },
  suffix: {
    color: '#A78BFA',
    fontSize: 10,
    marginLeft: 4,
  },
  suffixLarge: {
    fontSize: 12,
    marginLeft: 6,
  },
});
