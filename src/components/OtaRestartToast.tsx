/**
 * OtaRestartToast — Layer 3 UI. A gentle, non-blocking toast pinned near the
 * bottom of a safe parent surface offering to apply a downloaded OTA. Self-
 * contained: drives itself off useOtaRestartToast() and renders null when there
 * is nothing to show. Mount ONCE at the app root (App.tsx, beside AlertHost).
 *
 * Non-blocking: the container is pointer-transparent (box-none) so only the card
 * catches touches; the rest of the screen stays fully usable. Reload happens
 * only on an explicit "Refresh now" tap (never auto) — see useOtaRestartToast.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';
import { useOtaRestartToast } from '../hooks/useOtaRestartToast';

export function OtaRestartToast() {
  const { visible, refresh, dismiss } = useOtaRestartToast();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 12 }]}
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <Text style={styles.message}>{t('ota.restartToast.message')}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.laterBtn}
            onPress={dismiss}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.laterText}>{t('ota.restartToast.later')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refresh}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.refreshText}>{t('ota.restartToast.refresh')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  card: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: { flex: 1, fontSize: 14, fontWeight: '600', color: T.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  laterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  laterText: { fontSize: 14, fontWeight: '600', color: T.textMuted },
  refreshBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: T.accent },
  refreshText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
