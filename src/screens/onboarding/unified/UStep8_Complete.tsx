/**
 * UStep8_Complete — "[name] is all set!"
 *
 * Child profile + tasks + rewards were already saved in UStep5_Preview.
 * This screen only:
 *  1. Sets onboarding_complete = true on the parent profile
 *  2. Calls refreshProfile so RootNavigator re-evaluates isOnboarded
 *  3. Shows a "Go to Dashboard" button once saved — works for both
 *     first-time onboarding and add-child flows.
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
import { supabase } from '../../../integrations/supabase/client';
import DisclaimerFooter from '../../../components/DisclaimerFooter';
import { captureRefFromUrl, getRefCode, clearRefCode, saveRefCode } from '../../../lib/referralCapture';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep8_Complete'>;
type Route = RouteProp<RootStackParamList, 'UStep8_Complete'>;

export default function UStep8_Complete() {
  const navigation                                       = useNavigation<Nav>();
  const { params }                                       = useRoute<Route>();
  const { t }                                            = useTranslation();
  const { user, familyShortCode, refreshProfile } = useAuth();

  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveErr,     setSaveErr]     = useState<string | null>(null);
  const [refCode,     setRefCode]     = useState('');
  const [refRedeemed, setRefRedeemed] = useState(false);
  const hasSaved = useRef(false);

  // On web: capture ref from URL immediately; on Android: user types manually
  useEffect(() => {
    void captureRefFromUrl().then(async () => {
      const stored = await getRefCode();
      if (stored) setRefCode(stored);
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

      // Redeem referral code if one was entered or captured from URL
      const codeToRedeem = refCode.trim().toUpperCase() || await getRefCode();
      if (codeToRedeem) {
        const { data: redeemData } = await supabase.rpc('redeem_referral', { p_code: codeToRedeem });
        if (redeemData?.success) {
          setRefRedeemed(true);
          await clearRefCode();
          await refreshProfile(user.id); // pick up new premium_until
        } else {
          console.log('[UStep8_Complete] referral redeem skipped:', redeemData?.error);
          await clearRefCode(); // clear invalid/used code
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

        {/* Family code card */}
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

        {/* Referral code entry */}
        {!saved && (
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>{t('referral.onboardingLabel')}</Text>
            <TextInput
              style={styles.refInput}
              value={refCode}
              onChangeText={v => { setRefCode(v.toUpperCase()); void saveRefCode(v); }}
              placeholder={t('referral.onboardingPlaceholder')}
              placeholderTextColor={T.textMuted}
              autoCapitalize="characters"
              maxLength={6}
            />
          </View>
        )}

        {/* Referral success banner */}
        {refRedeemed && (
          <View style={styles.refSuccess}>
            <Text style={styles.refSuccessText}>{t('referral.onboardingSuccess')}</Text>
          </View>
        )}

        {/* Save error + retry */}
        {saveErr && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{saveErr}</Text>
            <TouchableOpacity onPress={saveAll} style={styles.retryBtn}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Go to Dashboard — shown after save completes, works for both flows */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 24, paddingTop: 48, paddingBottom: 40, alignItems: 'center' },

  // Animated checkmark circle
  checkCircle:  {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#ECFDF5', borderWidth: 3, borderColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  checkMark:    { fontSize: 48, color: '#10B981', lineHeight: 56 },

  heading:      { color: T.accent, fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  sub:          { color: T.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },

  codeCard:     { width: '100%', backgroundColor: T.accent, borderRadius: 16, padding: 22, alignItems: 'center', marginBottom: 16 },
  codeLabel:    { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  code:         { color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: 8, marginBottom: 6 },
  codeHint:     { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  tipCard:      { width: '100%', backgroundColor: T.card, borderRadius: 14, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: T.cardBorder },
  tipTitle:     { color: T.text, fontWeight: '700', fontSize: 15, marginBottom: 10 },
  tipText:      { color: T.textMuted, fontSize: 14, lineHeight: 21 },

  refCard:         { width: '100%', marginBottom: 16 },
  refLabel:        { color: T.textMuted, fontSize: 12, marginBottom: 6, textAlign: 'center' },
  refInput:        {
    borderWidth: 1, borderColor: T.cardBorder, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    color: T.text, fontSize: 18, fontWeight: '700',
    textAlign: 'center', letterSpacing: 4, backgroundColor: T.card,
  },
  refSuccess:      { width: '100%', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#6EE7B7', alignItems: 'center' },
  refSuccessText:  { color: '#065F46', fontWeight: '600', fontSize: 14 },

  errorCard:    { width: '100%', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  errorText:    { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  retryBtn:     { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText:    { color: '#fff', fontWeight: '600', fontSize: 13 },

  dashboardBtn:     { width: '100%', backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  dashboardBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
