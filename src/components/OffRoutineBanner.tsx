/**
 * OffRoutineBanner — gentle child-facing banner shown on the dashboard when the
 * child's off-routine day is active. Body-double voice (no pressure, no counts).
 * Rendered only when off-routine is active AND pause is not (pause short-circuits
 * the screen before this).
 */
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function OffRoutineBanner() {
  const { language } = useLanguage();
  const text = language === 'he'
    ? 'יום חופשי — תוכנית קלה, בקצב שלך ✨'
    : 'Free day — a lighter plan, at your pace ✨';
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#8b5cf6',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
