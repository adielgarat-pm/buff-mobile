/**
 * OffRoutineBanner — gentle child-facing banner shown on the dashboard when the
 * child's off-routine day is active. Body-double voice (no pressure, no counts).
 * Rendered only when off-routine is active AND pause is not (pause short-circuits
 * the screen before this).
 */
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function OffRoutineBanner() {
  // Strings come from i18next (NOT useLanguage) so the banner follows the
  // active interface language — including the previewed child's language in
  // View-as-Child, which useLanguage() deliberately does not track.
  const { t } = useTranslation();
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.text}>{t('offRoutine.banner')}</Text>
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
