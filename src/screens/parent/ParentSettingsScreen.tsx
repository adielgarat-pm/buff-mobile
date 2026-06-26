/**
 * Parent Settings — Zen Mode
 * Account, family management, mode switching, preferences.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Modal, Platform, Linking } from 'react-native';
import { useState } from 'react';
import { crossAlert } from '../../platform';
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
import { useAppSettings } from '../../hooks/useAppSettings';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import PauseModeCard from '../../components/PauseModeCard';
import JoinFamilyCard from '../../components/JoinFamilyCard';
import LanguagePickerModal from '../../components/LanguagePickerModal';
import { ParentNotificationBell } from '../../components/parent/ParentNotificationBell';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import ReferralSheet from '../../components/ReferralSheet';
import RateBuffSheet from '../../components/rate/RateBuffSheet';
import { getHighIntentCta } from '../../lib/rateBuff/highIntentDestination';

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
  const { profile, familyShortCode, signOut, deleteAccount } = useAuth();
  const { enterChildPreview, isChildPreview } = useMode();
  const { children } = useChildrenDashboard();
  const { isSubscribed, isLifetimeAccess, isGracePeriod } = useSubscription();
  const [codeCopied, setCodeCopied] = useState(false);
  const { language } = useLanguage();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const { fridayEnabled, setFridayEnabled } = useAppSettings();
  const { mode: installMode, promptInstall } = useInstallPrompt();
  const [installInstructionsOpen, setInstallInstructionsOpen] = useState(false);
  const [referralSheetOpen, setReferralSheetOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [rateInitialPhase, setRateInitialPhase] = useState<'gate' | 'feedback'>('gate');

  // "Rate BUFF" row. On native a Settings button must NOT fire the native
  // In-App Review API (Google: a CTA may hit the opaque quota and show nothing
  // → broken UX) — it deep-links to the store listing instead. The native auto-
  // prompt on the dashboard is what actually drives the OS card. Web/iOS (no
  // Android listing CTA) open the in-app sheet, which writes a first-party review.
  const handleRatePress = () => {
    const cta = getHighIntentCta();
    if (Platform.OS !== 'web' && cta) {
      void Linking.openURL(cta.url);
    } else {
      setRateInitialPhase('gate');
      setRateOpen(true);
    }
  };

  // "Send feedback" row — the always-available private channel (saves to our
  // reviews table + offers a human contact line). Deliberately NOT a sentiment
  // filter in front of the public rating; it stands on its own for everyone.
  const handleFeedbackPress = () => {
    setRateInitialPhase('feedback');
    setRateOpen(true);
  };

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

  // In-app account deletion (Apple Guideline 5.1.1(v)). Two-tap destructive confirm.
  // On success the auth state clears and the navigator returns to the login screen.
  const handleDeleteAccount = () => {
    crossAlert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('settings.deleteAccountCancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccountConfirm'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              crossAlert(
                t('settings.deleteAccountErrorTitle'),
                t('settings.deleteAccountErrorMessage'),
              );
            }
          },
        },
      ],
    );
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
        { label: t('settings.rowActivities'),     onPress: () => navigation.navigate('Activities') },
        {
          label: t('settings.rowInviteFriend'),
          icon:  'gift-outline' as const,
          onPress: () => setReferralSheetOpen(true),
        },
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
        {
          label:   t('settings.rowNotifications'),
          icon:    'notifications-outline' as const,
          onPress: () => navigation.navigate('NotificationSettings'),
        },
        ...(installMode !== 'hidden' ? [{
          label:   t('settings.rowAddToHomeScreen'),
          icon:    'download-outline' as const,
          onPress: installMode === 'install'
            ? () => { void promptInstall(); }
            : () => setInstallInstructionsOpen(true),
        }] : []),
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
          label:   t('rate.settingsRow'),
          icon:    'star-outline' as const,
          onPress: handleRatePress,
        },
        {
          label:   t('rate.feedbackRow'),
          icon:    'chatbubble-ellipses-outline' as const,
          onPress: handleFeedbackPress,
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
        { label: t('settings.rowDeleteAccount'), onPress: handleDeleteAccount, danger: true },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: T.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: T.text }]}>{t('settings.pageTitle')}</Text>
        <ParentNotificationBell />
      </View>

      {/* Avatar */}
      <View style={[styles.profileCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: T.accent }]}>
          <Text style={styles.avatarText}>
            {(profile?.display_name?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.profileName, { color: T.text }]}>{profile?.display_name}</Text>
          <Text style={[styles.profileRole, { color: T.textMuted }]}>{t('settings.profileRole')}</Text>
        </View>
      </View>

      {/* Pause Mode — parent control */}
      <PauseModeCard />

      {/* School week — is Friday a school day for this family? Drives which
          days school tasks + the School phase appear (pkg/school-free-day-parity). */}
      <View style={[styles.devCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.fridayLabel, { color: T.text }]}>{t('settings.fridaySchoolLabel')}</Text>
          <Text style={[styles.devLabel, { color: T.textMuted }]}>{t('settings.fridaySchoolHint')}</Text>
        </View>
        <Switch
          value={fridayEnabled}
          onValueChange={(v) => { void setFridayEnabled(v); }}
          trackColor={{ false: '#D1D5DB', true: T.accent }}
          thumbColor="#fff"
        />
      </View>

      {/* Join an existing family — second parent / partner (co-parent-join) */}
      <JoinFamilyCard />

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

      <ReferralSheet
        visible={referralSheetOpen}
        onClose={() => setReferralSheetOpen(false)}
      />

      <RateBuffSheet
        visible={rateOpen}
        initialPhase={rateInitialPhase}
        onClose={() => setRateOpen(false)}
      />

      {/* iOS install instructions — shown when installMode is ios-safari or ios-other */}
      <Modal
        visible={installInstructionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInstallInstructionsOpen(false)}
      >
        <TouchableOpacity
          style={installStyles.overlay}
          activeOpacity={1}
          onPress={() => setInstallInstructionsOpen(false)}
        >
          <View style={[installStyles.card, { backgroundColor: T.card }]}>
            <Text style={[installStyles.title, { color: T.text }]}>
              {t('install.instructionsTitle')}
            </Text>
            {installMode === 'ios-other' ? (
              <Text style={[installStyles.body, { color: T.text }]}>
                {t('install.iosOtherText')}
              </Text>
            ) : (
              <>
                <Text style={[installStyles.step, { color: T.text }]}>{t('install.iosStep1')}</Text>
                <Text style={[installStyles.step, { color: T.text }]}>{t('install.iosStep2')}</Text>
                <Text style={[installStyles.step, { color: T.text }]}>{t('install.iosStep3')}</Text>
              </>
            )}
            <TouchableOpacity
              style={[installStyles.btn, { backgroundColor: T.accent }]}
              onPress={() => setInstallInstructionsOpen(false)}
            >
              <Text style={installStyles.btnText}>{t('install.iosGotIt')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { padding: 20, paddingTop: 52, paddingBottom: 40 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle:    { fontSize: 28, fontWeight: '700' },
  profileCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, gap: 14 },
  avatar:       { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileName:  { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  profileRole:  { fontSize: 13 },
  devCard:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1 },
  devLabel:     { fontSize: 13 },
  fridayLabel:  { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sectionCard:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowLabel:     { flex: 1, fontSize: 15 },
  rowValue:     { fontSize: 14, maxWidth: 180, textAlign: 'right', marginRight: 6 },
  chevron:      { fontSize: 20 },
});

const installStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card:     { borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 },
  title:    { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  body:     { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  step:     { fontSize: 14, lineHeight: 22, marginBottom: 6 },
  btn:      { marginTop: 16, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});
