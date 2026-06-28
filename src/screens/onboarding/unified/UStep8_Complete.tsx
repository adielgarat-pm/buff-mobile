/**
 * UStep8_Complete — "[name] is all set!"
 *
 * Child profile + tasks + rewards were already saved in UStep5_Preview.
 * This screen only:
 *  1. Sets onboarding_complete = true on the parent profile
 *  2. Calls refreshProfile so RootNavigator re-evaluates isOnboarded
 *  3. Shows a "Go to Dashboard" button once saved — works for both
 *     first-time onboarding and add-child flows.
 *
 * Referral paths:
 *  AUTO  — code captured from ?ref= URL (web) or stored (Android) → redeemed silently in saveAll
 *  MANUAL — no stored code → dashed input shown below CTA, user types 6-char code
 */
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  ScrollView, Animated, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useRTLStyles } from '../../../contexts/LanguageContext';
import { supabase } from '../../../integrations/supabase/client';
import DisclaimerFooter from '../../../components/DisclaimerFooter';
import { captureRefFromUrl, getRefCode, clearRefCode } from '../../../lib/referralCapture';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep8_Complete'>;
type Route = RouteProp<RootStackParamList, 'UStep8_Complete'>;

type RefState =
  | 'idle'
  | 'auto_pending'     // stored code found; will redeem inside saveAll
  | 'auto_success'     // auto-redeemed OK
  | 'already_premium'  // auto-redeem returned already_redeemed
  | 'no_code'          // no stored code (or auto failed) → show manual input
  | 'manual_loading'   // user tapped apply; RPC in flight
  | 'manual_success';  // manually redeemed OK

export default function UStep8_Complete() {
  const navigation              = useNavigation<Nav>();
  const { params }              = useRoute<Route>();
  const { t }                   = useTranslation();
  const { isRTL }               = useRTLStyles();
  const { user, familyShortCode, refreshProfile } = useAuth();

  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveErr,     setSaveErr]     = useState<string | null>(null);
  const [refState,    setRefState]    = useState<RefState>('idle');
  const [manualCode,  setManualCode]  = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const hasSaved = useRef(false);

  // On web: capture ref from URL into sessionStorage; then check storage for either path
  useEffect(() => {
    void captureRefFromUrl().then(async () => {
      const stored = await getRefCode();
      setRefState(stored ? 'auto_pending' : 'no_code');
    });
  }, []);

  // Animated checkmark — springs in when saved = true
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  // ── Save on first mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    saveAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Play checkmark animation when save completes ──────────────────────────
  useEffect(() => {
    if (!saved) return;
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 120,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [saved, checkScale, checkOpacity]);

  const saveAll = async () => {
    if (!user) {
      setSaveErr(t('onboarding.complete.saveError'));
      return;
    }
    setSaving(true);
    setSaveErr(null);

    try {
      // Child profile + tasks + rewards already saved in UStep5_Preview.
      // Only update parent profile to mark onboarding complete.
      console.log('[UStep8_Complete] Marking parent profile as onboarding_complete...');

      // Read current pro_settings first so the merge below doesn't clobber keys
      // the parent already has. Matters for the Add-Child flow (ParentSettings →
      // UStep1 → … → UStep8) where the parent is already onboarded. Read failure
      // is non-fatal — fall back to {} so onboarding completion stays unblocked.
      const { data: existing, error: readErr } = await supabase
        .from('profiles')
        .select('pro_settings')
        .eq('user_id', user.id)
        .single();

      if (readErr) {
        console.warn('[UStep8_Complete] pre-save pro_settings read error (non-fatal):', readErr.message);
      }

      const prevSettings =
        ((existing as { pro_settings: Record<string, unknown> | null } | null)?.pro_settings) ?? {};

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          pro_settings: {
            ...prevSettings,
            onboarding_complete:   true,
            onboarding_child_name: params.childName,
            onboarding_child_id:   params.childProfileId,
          },
        } as never)
        .eq('user_id', user.id);

      if (updateErr) {
        console.warn('[UStep8_Complete] Parent profile update error (non-fatal):', updateErr.message);
      } else {
        console.log('[UStep8_Complete] Parent profile updated ✓');
      }

      // Refresh auth context so RootNavigator re-evaluates isOnboarded.
      console.log('[UStep8_Complete] Calling refreshProfile...');
      await refreshProfile(user.id);
      console.log('[UStep8_Complete] refreshProfile done');

      // Auto-redeem referral code captured from URL (web) or stored (Android manual)
      // refState is read via closure — capture its value at call time
      const storedCode = await getRefCode();
      if (storedCode) {
        const { data: redeemData } = await supabase.rpc('redeem_referral', { p_code: storedCode });
        await clearRefCode();
        if (redeemData?.success) {
          setRefState('auto_success');
          await refreshProfile(user.id);
        } else if (redeemData?.error === 'already_redeemed') {
          setRefState('already_premium');
        } else {
          console.log('[UStep8_Complete] auto referral redeem skipped:', redeemData?.error);
          setRefState('no_code'); // degrade to manual so user can try a different code
        }
      }

      setSaved(true);
      // Navigation is handled by the "Go to Dashboard" button below.
    } catch (err) {
      console.error('[UStep8_Complete] saveAll error:', err);
      setSaveErr(err instanceof Error ? err.message : t('onboarding.complete.saveError'));
      hasSaved.current = false; // allow retry
    } finally {
      setSaving(false);
    }
  };

  const handleManualRedeem = async () => {
    const code = manualCode.trim().toUpperCase();
    if (code.length < 6 || !user) return;
    setRefState('manual_loading');
    setManualError(null);
    const { data } = await supabase.rpc('redeem_referral', { p_code: code });
    if (data?.success) {
      await clearRefCode();
      await refreshProfile(user.id);
      setRefState('manual_success');
    } else {
      setRefState('no_code');
      switch (data?.error) {
        case 'already_redeemed':
          setManualError(t('referral.onboardingAlreadyPremium')); break;
        case 'invalid_or_used_code':
          setManualError(t('referral.onboardingErrorInvalid')); break;
        case 'self_referral':
          setManualError(t('referral.onboardingErrorSelf')); break;
        default:
          setManualError(t('referral.onboardingErrorGeneric')); break;
      }
    }
  };

  const showSuccessBanner  = saved && (refState === 'auto_success' || refState === 'manual_success');
  const showAlreadyBanner  = saved && refState === 'already_premium';
  const showManualInput    = saved && (refState === 'no_code' || refState === 'manual_loading');

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated checkmark — visible after save completes */}
        <Animated.View
          style={[
            styles.checkCircle,
            { opacity: checkOpacity, transform: [{ scale: checkScale }] },
          ]}
        >
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>

        {/* Loading spinner while saving */}
        {saving && !saved && (
          <ActivityIndicator
            color={T.accent}
            size="large"
            style={{ marginBottom: 24 }}
          />
        )}

        <Text style={styles.heading}>
          {t('onboarding.complete.title', { name: params.childName })}
        </Text>
        <Text style={styles.sub}>{t('onboarding.complete.sub')}</Text>

        {/* Family code card — purple, prominent, always shown */}
        {familyShortCode && (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>{t('onboarding.complete.familyCode')}</Text>
            <Text style={styles.code}>{familyShortCode}</Text>
            <Text style={styles.codeHint}>
              {t('onboarding.complete.codeHint', { name: params.childName })}
            </Text>
          </View>
        )}

        {/* Coach tip card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>{t('onboarding.complete.coachTitle')}</Text>
          <Text style={styles.tipText}>
            {t('onboarding.complete.coachTip', { name: params.childName })}
          </Text>
          <Text style={[styles.tipText, { marginTop: 10, fontStyle: 'italic' }]}>
            {t('onboarding.complete.coachRole')}
          </Text>
        </View>

        {/* Save error + retry */}
        {saveErr && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{saveErr}</Text>
            <TouchableOpacity onPress={saveAll} style={styles.retryBtn}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Go to Dashboard — shown after save completes */}
        {saved && (
          <>
            <DisclaimerFooter variant="short" />
            <TouchableOpacity
              style={styles.dashboardBtn}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ParentApp' }] })}
              activeOpacity={0.85}
            >
              <Text style={styles.dashboardBtnText}>{t('onboarding.complete.cta')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Referral success banner — purple tones, shown after auto or manual redemption */}
        {showSuccessBanner && (
          <View style={styles.refBanner}>
            <Text style={styles.refBannerText}>{t('referral.onboardingSuccess')}</Text>
          </View>
        )}

        {/* Already premium banner — same purple tones */}
        {showAlreadyBanner && (
          <View style={styles.refBanner}>
            <Text style={styles.refBannerText}>{t('referral.onboardingAlreadyPremium')}</Text>
          </View>
        )}

        {/* Manual referral input — dashed border, visually distinct from family code card */}
        {showManualInput && (
          <View style={styles.refManualCard}>
            <Text style={[styles.refManualLabel, isRTL && styles.textRight]}>{t('referral.onboardingLabel')}</Text>
            <View style={[styles.refManualRow, isRTL && styles.rowReverse]}>
              <TextInput
                style={styles.refManualInput}
                value={manualCode}
                onChangeText={v => setManualCode(v.toUpperCase())}
                placeholder={t('referral.onboardingPlaceholder')}
                placeholderTextColor={T.textMuted}
                autoCapitalize="characters"
                maxLength={6}
                editable={refState !== 'manual_loading'}
              />
              <TouchableOpacity
                style={[
                  styles.refManualBtn,
                  (manualCode.length < 6 || refState === 'manual_loading') && styles.refManualBtnDisabled,
                ]}
                onPress={handleManualRedeem}
                disabled={manualCode.length < 6 || refState === 'manual_loading'}
                activeOpacity={0.85}
              >
                <Text style={styles.refManualBtnText}>{t('referral.onboardingCta')}</Text>
              </TouchableOpacity>
            </View>
            {manualError && <Text style={styles.refManualError}>{manualError}</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 24, paddingTop: 48, paddingBottom: 40, alignItems: 'center' },

  // Animated checkmark circle
  checkCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#ECFDF5', borderWidth: 3, borderColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  checkMark: { fontSize: 48, color: '#10B981', lineHeight: 56 },

  heading: { color: T.accent, fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  sub:     { color: T.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },

  // Family code card — purple, prominent
  codeCard:  { width: '100%', backgroundColor: T.accent, borderRadius: 16, padding: 22, alignItems: 'center', marginBottom: 16 },
  codeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  code:      { color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: 8, marginBottom: 6 },
  codeHint:  { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  tipCard:  { width: '100%', backgroundColor: T.card, borderRadius: 14, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: T.cardBorder },
  tipTitle: { color: T.text, fontWeight: '700', fontSize: 15, marginBottom: 10 },
  tipText:  { color: T.textMuted, fontSize: 14, lineHeight: 21 },

  errorCard: { width: '100%', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  retryBtn:  { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  dashboardBtn:     { width: '100%', backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  dashboardBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Referral banners — BUFF purple tones (auto_success, manual_success, already_premium)
  refBanner:     { width: '100%', backgroundColor: '#EEEDFE', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#AFA9EC', alignItems: 'center' },
  refBannerText: { color: '#3C3489', fontWeight: '600', fontSize: 14, textAlign: 'center' },

  // Manual referral input — dashed border, clearly secondary vs family code card
  refManualCard:    { width: '100%', backgroundColor: '#FAFAFE', borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C8C5F0', padding: 12, marginTop: 16 },
  refManualLabel:   { color: T.accent, fontSize: 12, fontWeight: '500', marginBottom: 8 },
  refManualRow:     { flexDirection: 'row', gap: 8 },
  refManualInput:   {
    flex: 1, borderWidth: 1, borderColor: '#C8C5F0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    color: T.accent, fontSize: 16, fontWeight: '700',
    textAlign: 'center', letterSpacing: 4, backgroundColor: '#fff',
  },
  refManualBtn:         { backgroundColor: T.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
  refManualBtnDisabled: { opacity: 0.4 },
  refManualBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  refManualError:       { color: '#DC2626', fontSize: 12, marginTop: 6, textAlign: 'center' },
  rowReverse:           { flexDirection: 'row-reverse' },
  textRight:            { textAlign: 'right' },
});
