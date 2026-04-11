/**
 * Parent Settings — Zen Mode
 * Account, family management, mode switching, preferences.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useSubscription } from '../../hooks/useSubscription';
import { PARENT_THEME as T } from '../../theme';

interface SettingsRow {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export default function ParentSettingsScreen() {
  const { profile, familyShortCode, signOut } = useAuth();
  const { enterChildPreview, isChildPreview } = useMode();
  const { isSubscribed, isLifetimeAccess, isGracePeriod, simulateSubscribed, setSimulateSubscribed } = useSubscription();

  const SECTIONS: { title: string; rows: SettingsRow[] }[] = [
    {
      title: 'Account',
      rows: [
        { label: 'Display name', value: profile?.display_name ?? '—' },
        { label: 'Role',         value: 'Parent' },
        { label: 'Family code',  value: familyShortCode ?? '—' },
      ],
    },
    {
      title: 'Family',
      rows: [
        { label: 'Add a child', onPress: () => { /* navigates to PO flow */ } },
        { label: 'Manage children' },
      ],
    },
    {
      title: 'Preview',
      rows: [
        { label: 'View as Child (Gamer Mode)', onPress: enterChildPreview },
      ],
    },
    {
      title: 'Subscription',
      rows: [
        {
          label: 'Status',
          value: isLifetimeAccess
            ? '✅ Lifetime access'
            : isGracePeriod
            ? '✅ Beta (free until May 2026)'
            : isSubscribed
            ? '✅ Family plan'
            : 'Free (1 child)',
        },
      ],
    },
    {
      title: 'Danger zone',
      rows: [
        { label: 'Sign out', onPress: signOut, danger: true },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: T.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.pageTitle, { color: T.text }]}>Settings</Text>

      {/* Avatar */}
      <View style={[styles.profileCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: T.accent }]}>
          <Text style={styles.avatarText}>
            {(profile?.display_name?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.profileName, { color: T.text }]}>{profile?.display_name}</Text>
          <Text style={[styles.profileRole, { color: T.textMuted }]}>Parent · BUFF Coach</Text>
        </View>
      </View>

      {/* Dev: simulate subscribed */}
      <View style={[styles.devCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
        <Text style={[styles.devLabel, { color: T.textMuted }]}>🛠 Dev: Simulate Subscribed</Text>
        <Switch
          value={simulateSubscribed}
          onValueChange={setSimulateSubscribed}
          trackColor={{ false: '#D1D5DB', true: T.accent }}
          thumbColor="#fff"
        />
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.textMuted }]}>{section.title}</Text>
          <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
            {section.rows.map((row, i) => (
              <TouchableOpacity
                key={row.label}
                style={[
                  styles.row,
                  i < section.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.cardBorder },
                ]}
                onPress={row.onPress}
                disabled={!row.onPress}
              >
                <Text style={[styles.rowLabel, { color: row.danger ? '#EF4444' : T.text }]}>
                  {row.label}
                </Text>
                {row.value && (
                  <Text style={[styles.rowValue, { color: T.textMuted }]} numberOfLines={1}>
                    {row.value}
                  </Text>
                )}
                {row.onPress && !row.danger && (
                  <Text style={[styles.chevron, { color: T.textMuted }]}>›</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { padding: 20, paddingTop: 52, paddingBottom: 40 },
  pageTitle:    { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  profileCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, gap: 14 },
  avatar:       { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileName:  { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  profileRole:  { fontSize: 13 },
  devCard:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1 },
  devLabel:     { fontSize: 13 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sectionCard:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowLabel:     { flex: 1, fontSize: 15 },
  rowValue:     { fontSize: 14, maxWidth: 180, textAlign: 'right', marginRight: 6 },
  chevron:      { fontSize: 20 },
});
