/**
 * Parent Settings — Zen Mode
 * Account, family management, mode switching, preferences.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useSubscription } from '../../hooks/useSubscription';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import PauseModeCard from '../../components/PauseModeCard';
import LanguagePickerModal from '../../components/LanguagePickerModal';
import { useLanguage } from '../../contexts/LanguageContext';

interface SettingsRow {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  copyable?: boolean;
  copied?: boolean;
}

export default function ParentSettingsScreen() {
  const { t }        = useTranslation();
  const navigation   = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { profile, familyShortCode, signOut } = useAuth();
  const { enterChildPreview, isChildPreview } = useMode();
  const { children } = useChildrenDashboard();
  const { isSubscribed, isLifetimeAccess, isGracePeriod, simulateSubscribed, setSimulateSubscribed } = useSubscription();
  const [codeCopied, setCodeCopied] = useState(false);
  const { language } = useLanguage();
  const [langModalOpen, setLangModalOpen] = useState(false);

  // Real version of the *installed build*, not app.json — so a tester always
  // knows exactly which build they're on (native APIs are null on web/dev,
  // where we fall back to the manifest values). versionCode is the precise
  // build id (V24, V25, …) that tells you whether a given feature is present.
  const versionName = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '—';
  const buildCode   = Application.nativeBuildVersion ?? String(Constants.expoConfig?.android?.versionCode ?? '');
  const versionLabel = buildCode ? `${versionName} (${buildCode})` : versionName;

  // "View as Child" must preview a REAL child profile — passing the parent's own
  // id used to set previewChildId to the parent, so every child screen queried
  // the parent's (empty) data and showed nothing. With one child we preview it
  // directly; with several we send the parent to the dashboard, which has a
  // working per-child preview button (avoids guessing which child).
  const handleViewAsChild = () => {
    if (children.length === 1) {
      enterChildPreview(children[0].childId);
    } else if (children.length > 1) {
      navigation.navigate('ParentDashboard' as never);
    }
  };

  const SECTIONS: { title: string; rows: SettingsRow[] }[] = [
    {
      title: t('settings.sectionAccount'),
      rows: [
        { label: t('settings.rowDisplayName'), value: profile?.display_name ?? '—' },
        { label: t('settings.rowRole'),         value: t('settings.rowRoleValue') },
        {
          label: t('settings.rowFamilyCode'),
          value: familyShortCode ?? '—',
          onPress: familyShortCode ? async () => {
            const Clipboard = await import('expo-clipboard');
            await Clipboard.setStringAsync(familyShortCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
          } : undefined,
          copyable: true,
          copied: codeCopied,
        },
      ],
    },
    {
      title: t('settings.sectionFamily'),
      rows: [
        { label: t('settings.rowAddChild'),       onPress: () => navigation.navigate('UStep1') },
        { label: t('settings.rowManageChildren'), onPress: () => navigation.navigate('ManageChildren') },
      ],
    },
    ...(children.length > 0
      ? [{
          title: t('settings.sectionPreview'),
          rows: [
            { label: t('settings.rowViewAsChild'), onPress: handleViewAsChild },
          ],
        }]
      : []),
    {
      title: t('settings.sectionSubscription'),
      rows: [
        {
          label: t('settings.rowStatus'),
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
      title: t('settings.sectionGeneral'),
      rows: [
        {
          label:   t('settings.rowLanguage'),
          value:   language === 'he' ? 'עברית' : 'English',
          icon:    'globe-outline' as const,
          onPress: () => setLangModalOpen(true),
        },
      ],
    },
    {
      title: t('settings.sectionAbout'),
      rows: [
        {
          label:   t('settings.rowPhilosophy'),
          icon:    'information-circle-outline' as const,
          onPress: () => navigation.navigate('Philosophy'),
        },
        {
          label: t('settings.rowVersion'),
          value: versionLabel,
          icon:  'phone-portrait-outline' as const,
        },
      ],
    },
    {
      title: t('settings.sectionDangerZone'),
      rows: [
        { label: t('settings.rowSignOut'), onPress: signOut, danger: true },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: T.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.pageTitle, { color: T.text }]}>{t('settings.pageTitle')}</Text>

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

      {/* Pause Mode — parent control */}
      <PauseModeCard />

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
                {row.icon && (
                  <Ionicons
                    name={row.icon}
                    size={20}
                    color={T.accent}
                    style={{ marginRight: 10 }}
                  />
                )}
                <Text style={[styles.rowLabel, { color: row.danger ? '#EF4444' : T.text }]}>
                  {row.label}
                </Text>
                {row.value && (
                  <Text style={[styles.rowValue, { color: T.textMuted }]} numberOfLines={1}>
                    {row.value}
                  </Text>
                )}
                {row.copyable && (
                  <Ionicons
                    name={row.copied ? 'checkmark' : 'copy-outline'}
                    size={18}
                    color={row.copied ? '#10B981' : T.textMuted}
                    style={{ marginLeft: 6 }}
                  />
                )}
                {row.onPress && !row.danger && !row.copyable && (
                  <Text style={[styles.chevron, { color: T.textMuted }]}>›</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <LanguagePickerModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
      />
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
