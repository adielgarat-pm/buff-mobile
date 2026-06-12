/**
 * NotificationSettingsScreen — parent control surface for push notifications.
 *
 * Source SPEC: docs/sessions/notifications-hardening/ (Phase 4 — client).
 *
 * Surfaces:
 *   1. OS permission state (granted / denied / unknown / unsupported) with a
 *      recovery action — when denied, the OS dialog will never show again, so we
 *      deep-link to system settings (Linking.openSettings()). When unknown, we
 *      can still trigger the dialog via register().
 *   2. Two family-level preference toggles, persisted to app_settings and
 *      enforced server-side by the push-notification-fanout Edge Function:
 *        - "Alerts to me"        → notif_parent_alerts   (default on)
 *        - "Reminders for my child" → notif_child_reminders (default off)
 *
 * The per-age routing of child reminders (6–12 parent-decides vs 13–18
 * kid-self-opt-in) is Phase 5 and not handled here.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useAppSettings } from '../../hooks/useAppSettings';
import { usePushRegistration } from '../../hooks/usePushRegistration';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { permission, register } = usePushRegistration();
  const {
    notifParentAlerts,
    notifChildReminders,
    setNotifPref,
  } = useAppSettings();

  const granted = permission === 'granted';
  const unsupported = permission === 'unsupported';

  // Recovery action: 'unknown' can still raise the OS dialog; 'denied' cannot,
  // so we send the user to system settings.
  const handleEnable = async () => {
    if (permission === 'denied') {
      await Linking.openSettings();
    } else {
      await register();
    }
  };

  const statusLabel = granted
    ? t('notifSettings.status.on')
    : unsupported
    ? t('notifSettings.status.unsupported')
    : t('notifSettings.status.off');

  return (
    <ScrollView style={[styles.container, { backgroundColor: T.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: T.text }]}>{t('notifSettings.pageTitle')}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* OS permission status */}
      <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
        <View style={styles.statusRow}>
          <Ionicons
            name={granted ? 'notifications' : 'notifications-off-outline'}
            size={22}
            color={granted ? T.success : T.textMuted}
          />
          <Text style={[styles.statusText, { color: T.text }]}>{statusLabel}</Text>
        </View>
        {!granted && !unsupported && (
          <TouchableOpacity style={[styles.enableBtn, { backgroundColor: T.accent }]} onPress={handleEnable} accessibilityRole="button">
            <Text style={styles.enableBtnText}>{t('notifSettings.enableCta')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Preference toggles */}
      <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
        <ToggleRow
          label={t('notifSettings.parentAlerts.label')}
          hint={t('notifSettings.parentAlerts.hint')}
          value={notifParentAlerts}
          onChange={(v) => { void setNotifPref('notif_parent_alerts', v); }}
        />
        <View style={[styles.divider, { backgroundColor: T.cardBorder }]} />
        <ToggleRow
          label={t('notifSettings.childReminders.label')}
          hint={t('notifSettings.childReminders.hint')}
          value={notifChildReminders}
          onChange={(v) => { void setNotifPref('notif_child_reminders', v); }}
        />
      </View>

      <Text style={[styles.footnote, { color: T.textMuted }]}>{t('notifSettings.footnote')}</Text>
    </ScrollView>
  );
}

interface ToggleRowProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, hint, value, onChange }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleTextWrap}>
      <Text style={[styles.toggleLabel, { color: T.text }]}>{label}</Text>
      <Text style={[styles.toggleHint, { color: T.textMuted }]}>{hint}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: T.accentLight, false: T.cardBorder }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 16, fontWeight: '600', flex: 1 },
  enableBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  enableBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleTextWrap: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  toggleHint: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginVertical: 12 },
  footnote: { fontSize: 12, lineHeight: 17, textAlign: 'center', paddingHorizontal: 8 },
});
