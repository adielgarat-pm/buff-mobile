/**
 * ChildAccessStep — "How will {name} use BUFF?" (replaces UStep7_Phone)
 *
 * Why this screen exists: the old "Does {name} have their own phone?" framing
 * made parents whose child has no phone conclude BUFF wasn't for them and churn
 * (real case: Keren / איתן). This reframes to three EQUAL access paths, ordered
 * and emphasised by signup platform so an overwhelmed parent gets a sensible
 * default without any path being forced:
 *   - own_phone     → share the invite now, or "send tonight" (day-1 cohort)
 *   - home_device   → open on a home computer/tablet with the family code
 *   - shared_device → the child taps on the parent's device (View-as-Child)
 *
 * Chunk 2 scope: the screen, platform ordering, share + copy-code, the
 * access_mode write, and the abandon event. shared_device launches straight into
 * View-as-Child in Chunk 3; the day-1 evening reminder is Chunk 4. The old 24h
 * local reminder (UStep7_Phone.inviteLater) is deliberately gone — a single
 * reminder owner keeps the "cap 1-2" honest.
 */
import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useRTLStyles } from '../../../contexts/LanguageContext';
import { supabase } from '../../../integrations/supabase/client';
import { BUFF_URLS, buildJoinDeepLink } from '../../../lib/buffConfig';
import { shareInvite } from '../../../lib/shareInvite';
import { logOnboardingEvent, type AccessMode } from '../../../lib/onboardingFunnel';
import { crossAlert } from '../../../platform/crossAlert';

type Nav   = StackNavigationProp<RootStackParamList, 'ChildAccessStep'>;
type Route = RouteProp<RootStackParamList, 'ChildAccessStep'>;

const STEP = 5; const TOTAL = 6;

/** Hebrew child-string gender suffix: boy/other → masculine, girl → feminine. */
function genderSuffix(gender?: string): '_m' | '_f' {
  return gender === 'girl' ? '_f' : '_m';
}

type CardKey = AccessMode;

export default function ChildAccessStep() {
  const navigation         = useNavigation<Nav>();
  const { params }         = useRoute<Route>();
  const { t }              = useTranslation();
  const { isRTL }          = useRTLStyles();
  const { familyShortCode, familyId } = useAuth();

  const progress = (STEP + 1) / (TOTAL + 1);
  const g = genderSuffix(params.gender);

  // Abandon detection (Keren's signature: reached this screen, chose nothing).
  // Set true the moment a path is chosen; on unmount without a choice we log the
  // abandon so the family enters the day-1 reminder cohort. Navigating FORWARD
  // keeps this screen mounted in the stack, so the cleanup only fires on a real
  // pop/back or a stack reset — never as a false positive on goNext().
  const choiceMade = useRef(false);
  useEffect(() => {
    return () => {
      if (!choiceMade.current) {
        void logOnboardingEvent({
          familyId,
          eventType: 'access_step_abandoned',
          childId: params.childProfileId,
        });
      }
    };
    // familyId/params are stable for this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist the chosen mode on the child profile + log it, then advance. */
  const choose = async (mode: AccessMode) => {
    choiceMade.current = true;
    // Best-effort: never block the flow on a write failure (family-scoped RLS).
    try {
      await supabase
        .from('profiles')
        .update({ access_mode: mode } as never)
        .eq('id', params.childProfileId);
    } catch { /* non-fatal — the event below still records the choice */ }
    void logOnboardingEvent({
      familyId,
      eventType: 'access_mode_selected',
      method: mode,
      childId: params.childProfileId,
    });
    navigation.navigate('UStep8_Complete', { ...params, accessMode: mode });
  };

  // ── own_phone ──────────────────────────────────────────────────────────────
  const shareNow = async () => {
    const code    = familyShortCode ?? '------';
    const message = t('onboarding.access.inviteMessage', {
      name: params.childName,
      code,
      installUrl:   BUFF_URLS.playStoreInstall,
      joinDeepLink: buildJoinDeepLink(code),
    });
    await shareInvite(message);   // never throws; OS sheet completion isn't reliably reported
    void logOnboardingEvent({
      familyId, eventType: 'invite_sent', method: 'share', childId: params.childProfileId,
    });
    // Honest confirmation: the link is READY to send, not verified as sent.
    crossAlert(t('onboarding.access.shareReady'), '', [{ text: 'OK' }]);
    void choose('own_phone');
  };

  // "I'll send it tonight" — feeds the day-1 reminder cohort (scheduled in Chunk 4).
  const sendTonight = () => { void choose('own_phone'); };

  // ── home_device ──────────────────────────────────────────────────────────────
  const openOnHomeDevice = async () => {
    const code = familyShortCode ?? '------';
    try { await Clipboard.setStringAsync(code); } catch { /* non-fatal */ }
    crossAlert(t('onboarding.access.card2Title'), code, [{ text: 'OK' }]);
    void choose('home_device');
  };

  // ── shared_device ────────────────────────────────────────────────────────────
  // Chunk 2: record + advance. Chunk 3 replaces this with an immediate
  // View-as-Child launch (the tap becomes the handoff ritual itself).
  const useMyDevice = () => { void choose('shared_device'); };

  // Card definitions, keyed by access mode.
  const cards: Record<CardKey, { emoji: string; title: string; sub: string; onPress: () => void; secondary?: { label: string; onPress: () => void } }> = {
    own_phone: {
      emoji: '📱',
      title: t(`onboarding.access.card1Title${g}`),
      sub:   t('onboarding.access.card1Sub'),
      onPress: () => { void shareNow(); },
      secondary: { label: t('onboarding.access.card1Secondary'), onPress: sendTonight },
    },
    home_device: {
      emoji: '💻',
      title: t('onboarding.access.card2Title'),
      sub:   t('onboarding.access.card2Sub'),
      onPress: () => { void openOnHomeDevice(); },
    },
    shared_device: {
      emoji: '👨‍👩‍👧',
      title: t('onboarding.access.card3Title'),
      sub:   t(`onboarding.access.card3Sub${g}`),
      onPress: useMyDevice,
    },
  };

  // Platform ordering: native leads with shared_device (zero-friction, available
  // now); web leads with home_device (the browser the parent already signed up
  // on). All three stay visible — emphasis, not exclusion.
  const order: CardKey[] = Platform.OS === 'web'
    ? ['home_device', 'own_phone', 'shared_device']
    : ['shared_device', 'own_phone', 'home_device'];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
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

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.heading}>
          {t('onboarding.access.title', { name: params.childName })}
        </Text>

        {order.map((key, idx) => {
          const c = cards[key];
          const primary = idx === 0;   // platform-emphasised default
          return (
            <View key={key}>
              <TouchableOpacity
                testID={`onb-access-${key}`}
                style={[styles.option, isRTL && styles.rowReverse, primary && styles.optionPrimary]}
                onPress={c.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, isRTL && styles.textRight]}>{c.title}</Text>
                  <Text style={[styles.optionSub, isRTL && styles.textRight]}>{c.sub}</Text>
                </View>
                <Text style={styles.optionArrow}>{isRTL ? '‹' : '›'}</Text>
              </TouchableOpacity>
              {c.secondary && (
                <TouchableOpacity
                  testID={`onb-access-${key}-secondary`}
                  style={styles.secondaryBtn}
                  onPress={c.secondary.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryText, isRTL && styles.textRight]}>{c.secondary.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
  heading:       { color: T.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 28 },
  option:        { backgroundColor: T.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder },
  optionPrimary: { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  optionEmoji:   { fontSize: 24, marginRight: 14, width: 32 },
  optionTitle:   { color: T.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  optionSub:     { color: T.textMuted, fontSize: 13, lineHeight: 18 },
  optionArrow:   { color: T.textMuted, fontSize: 20, marginHorizontal: 8 },
  secondaryBtn:  { paddingVertical: 8, paddingHorizontal: 16, marginTop: -4, marginBottom: 12, alignItems: 'center' },
  secondaryText: { color: T.accent, fontSize: 14, fontWeight: '600' },
  rowReverse:    { flexDirection: 'row-reverse' },
  textRight:     { textAlign: 'right' },
});
