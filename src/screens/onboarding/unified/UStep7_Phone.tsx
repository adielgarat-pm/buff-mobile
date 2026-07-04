/**
 * UStep7_Phone — "Does [name] have their own phone?"
 *
 * Option A: "Yes — invite them now"  → native Share sheet
 * Option B: "Yes — I'll do it later" → saves hasPhone=true, schedules notification reminder
 * Option C: "No — I'll show them on my device" → saves hasPhone=false
 *
 * Option B schedules a local 24h reminder via expo-notifications (reuses the
 * 'default' Android channel set up in notificationHandler.ts at app boot).
 * Best-effort: proceeds even if permission is denied or scheduling fails.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useRTLStyles } from '../../../contexts/LanguageContext';
import { BUFF_URLS, buildJoinDeepLink } from '../../../lib/buffConfig';
import { shareInvite } from '../../../lib/shareInvite';
import { requestNotificationPermission } from '../../../lib/pushTokens';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep7_Phone'>;
type Route = RouteProp<RootStackParamList, 'UStep7_Phone'>;

const STEP = 5; const TOTAL = 6;

export default function UStep7_Phone() {
  const navigation         = useNavigation<Nav>();
  const { params }         = useRoute<Route>();
  const { t }              = useTranslation();
  const { isRTL }          = useRTLStyles();
  const { familyShortCode } = useAuth();

  const progress = (STEP + 1) / (TOTAL + 1);

  const goNext = (hasPhone: boolean) => {
    navigation.navigate('UStep8_Complete', { ...params, hasPhone });
  };

  const inviteNow = async () => {
    const code    = familyShortCode ?? '------';
    const message = t('onboarding.step7.inviteMessage', {
      name: params.childName,
      code,
      installUrl:   BUFF_URLS.playStoreInstall,
      joinDeepLink: buildJoinDeepLink(code),
    });
    // Cross-platform: OS sheet on native, Web Share API / WhatsApp on web.
    // On web the old Share.share() was a silent no-op — the child never got
    // the link. shareInvite never throws, so we always proceed.
    await shareInvite(message);
    goNext(true);
  };

  const inviteLater = async () => {
    // Schedule a local reminder 24h out so the parent doesn't forget to connect
    // the child. Best-effort: if permission is denied or scheduling throws, we
    // still proceed — never trap the parent in onboarding.
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'BUFF',
            body: t('onboarding.step7.reminderBody', { name: params.childName }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 24 * 60 * 60,
            channelId: 'default',
          },
        });
      }
    } catch (err) {
      if (__DEV__) console.warn('[UStep7_Phone] reminder scheduling failed:', err);
    }
    goNext(true);
  };

  const noPhone = async () => {
    // On web, Alert.alert() doesn't work reliably, so show a simple console message and proceed
    if (__DEV__) console.log('[UStep7_Phone] No phone option selected');
    goNext(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* Top bar */}
      <View style={[styles.topBar, isRTL && styles.rowReverse]}>
        <TouchableOpacity
          testID="onb-back"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backChevron}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.flowLabel}>{t('onboarding.flowLabel')}</Text>
          <Text style={styles.stepCount}>{STEP + 1} / {TOTAL + 1}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.heading}>
          {t('onboarding.step7.title', { name: params.childName })}
        </Text>
        <Text style={styles.sub}>{t('onboarding.step7.sub', { name: params.childName })}</Text>

        <TouchableOpacity testID="onb7-invite" style={[styles.option, isRTL && styles.rowReverse, styles.optionPrimary]} onPress={inviteNow} activeOpacity={0.8}>
          <Text style={styles.optionEmoji}>🚀</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, isRTL && styles.textRight]}>{t('onboarding.step7.optA')}</Text>
            <Text style={[styles.optionSub, isRTL && styles.textRight]}>{t('onboarding.step7.optASub')}</Text>
          </View>
          <Text style={styles.optionArrow}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="onb7-later" style={[styles.option, isRTL && styles.rowReverse]} onPress={inviteLater} activeOpacity={0.8}>
          <Text style={styles.optionEmoji}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, isRTL && styles.textRight]}>{t('onboarding.step7.optB')}</Text>
            <Text style={[styles.optionSub, isRTL && styles.textRight]}>{t('onboarding.step7.optBSub')}</Text>
          </View>
          <Text style={styles.optionArrow}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="onb7-none" style={[styles.option, isRTL && styles.rowReverse]} onPress={noPhone} activeOpacity={0.8}>
          <Text style={styles.optionEmoji}>👨‍👩‍👧</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, isRTL && styles.textRight]}>{t('onboarding.step7.optC')}</Text>
            <Text style={[styles.optionSub, isRTL && styles.textRight]}>{t('onboarding.step7.optCSub')}</Text>
          </View>
          <Text style={styles.optionArrow}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: T.bg },
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backChevron:   { color: T.accent, fontSize: 28, lineHeight: 32, width: 36 },
  stepInfo:      { flex: 1, alignItems: 'center' },
  flowLabel:     { color: T.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  stepCount:     { color: T.text, fontSize: 13, fontWeight: '600' },
  barTrack:      { height: 3, backgroundColor: T.cardBorder, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  barFill:       { height: 3, backgroundColor: T.accent, borderRadius: 2 },
  content:       { flex: 1, padding: 24, paddingTop: 32 },
  emoji:         { fontSize: 44, textAlign: 'center', marginBottom: 16 },
  heading:       { color: T.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  sub:           { color: T.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  option:        { backgroundColor: T.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder },
  optionPrimary: { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  optionEmoji:   { fontSize: 24, marginRight: 14, width: 32 },
  optionTitle:   { color: T.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  optionSub:     { color: T.textMuted, fontSize: 13, lineHeight: 18 },
  optionArrow:   { color: T.textMuted, fontSize: 20, marginHorizontal: 8 },
  rowReverse:    { flexDirection: 'row-reverse' },
  textRight:     { textAlign: 'right' },
});
