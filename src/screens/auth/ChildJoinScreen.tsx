import { useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { stableChildCreds, legacyChildCreds } from '../../utils/childAuth';
import { PASTEL_MODE } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';

type Nav   = StackNavigationProp<RootStackParamList, 'ChildJoin'>;
type Route = RouteProp<RootStackParamList, 'ChildJoin'>;

// Locked decision (color-consolidation): ChildJoin goes LIGHT for everyone — at
// join time the kid's age is unknown, so we default to the Pastel home base.
const BG         = PASTEL_MODE.canvas;     // #F4F0FA
const CARD_BG    = PASTEL_MODE.card;       // #FFFFFF
const BORDER     = PASTEL_MODE.cardBorder; // #E2DAF2
const ACCENT     = PASTEL_MODE.accent;     // #7C3AED
const TEXT_LIGHT = PASTEL_MODE.text;       // #1a1636 (body text on light)
const TEXT_MUTED = PASTEL_MODE.textMuted;  // #6B5B8A

interface ChildCard {
  id:           string;
  display_name: string;
  avatar:       string | null;
  linked:       boolean;
}

export default function ChildJoinScreen() {
  const { t }                      = useTranslation();
  const { signIn, refreshProfile } = useAuth();
  const navigation                 = useNavigation<Nav>();
  const { params }                 = useRoute<Route>();

  // Pre-fill from buff://join/:code deep link. React Navigation makes params
  // available synchronously at mount when arriving via a deep link.
  const initialCode = params?.code ? params.code.toUpperCase().slice(0, 6) : '';

  const [step, setStep]             = useState<'code' | 'pick'>('code');
  const [familyCode, setFamilyCode] = useState(initialCode);
  const [children, setChildren]     = useState<ChildCard[]>([]);
  const [loading, setLoading]       = useState(false);

  // Step 1 → fetch the family's children, then move to the pick step. The child
  // resolves to a specific profile by tapping their card — their typed name
  // never derives credentials, so a name variant can no longer mint a new account.
  const handleFindFamily = async () => {
    const code = familyCode.trim().toUpperCase();
    if (!code || code.length < 6) {
      Alert.alert(t('auth.invalidCode'));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('list_family_children', {
      p_family_code: code,
    });
    setLoading(false);

    const result = data as
      | { found: boolean; reason?: string; children?: ChildCard[] }
      | null;

    if (error || !result?.found) {
      Alert.alert(t('auth.codeNotFound'));
      return;
    }
    if (!result.children || result.children.length === 0) {
      Alert.alert(t('auth.childJoinNoChildren'));
      return;
    }

    setChildren(result.children);
    setStep('pick');
  };

  // Step 2 → resolve the picked profile to its auth account.
  const handlePickChild = async (child: ChildCard) => {
    const code   = familyCode.trim().toUpperCase();
    const stable = stableChildCreds(child.id);

    setLoading(true);

    // 1. Returning child already on the stable scheme — works on any device.
    const { error: stableErr } = await signIn(stable.email, stable.password);
    if (!stableErr) {
      // Observability (Phase 2): no rows created on this path.
      console.log('[ChildEntry] resolved via stable sign-in (no new rows)', { profileId: child.id });
      setLoading(false);
      return; // RootNavigator routes to ChildApp
    }

    // 2. Orphan / never-linked: create the single stable auth user and link the
    //    picked profile to it. Idempotent on every later entry.
    if (!child.linked) {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email:    stable.email,
        password: stable.password,
      });

      if (!signUpErr && signUpData.user) {
        const { data: linkData } = await supabase.rpc('link_child_profile', {
          p_profile_id:  child.id,
          p_family_code: code,
        });
        if ((linkData as { linked?: boolean } | null)?.linked) {
          // Observability (Phase 2): this is the ONLY path that creates an
          // auth.users row, and it LINKS the picked profile — it never inserts
          // a new profile. Warned so recurrence is visible in Logcat / Sentry.
          console.warn('[ChildEntry] created stable auth user + linked orphan profile', { profileId: child.id });
          await refreshProfile(signUpData.user.id);
          setLoading(false);
          return;
        }
      }

      // Unexpected — don't leave a profile-less session behind.
      console.error('[ChildEntry] orphan link failed; rolling back session', { profileId: child.id });
      await supabase.auth.signOut();
      setLoading(false);
      Alert.alert(t('auth.childEntryFailed'));
      return;
    }

    // 3. Already-linked legacy child: sign into the existing account using creds
    //    reconstructed from the DB display_name + code (Option A, no re-key).
    const legacy = legacyChildCreds(child.display_name, code);
    const { error: legacyErr } = await signIn(legacy.email, legacy.password);
    setLoading(false);
    if (!legacyErr) {
      console.log('[ChildEntry] resolved via legacy fallback (no new rows)', { profileId: child.id });
      return;
    }

    console.error('[ChildEntry] could not resolve linked child (legacy sign-in failed)', { profileId: child.id });
    Alert.alert(t('auth.childEntryFailed'));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* Back link */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => (step === 'pick' ? setStep('code') : navigation.navigate('RoleSelection'))}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backText}>{t('auth.back')}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap as object}>
            <Image
              source={require('../../../assets/BUFF_LOGO_LAVENDER.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoWordmark}>BUFF</Text>
          </View>

          {step === 'code' ? (
            <>
              <Text style={styles.helpText}>{t('auth.childJoinSub')}</Text>

              <Text style={styles.familyCodeLabel}>{t('auth.familyCodeLabel')}</Text>
              <TextInput
                style={styles.familyCodeInput}
                placeholder={t('auth.familyCodePlaceholder')}
                placeholderTextColor={TEXT_MUTED}
                value={familyCode}
                onChangeText={(v) => setFamilyCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleFindFamily}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>{t('auth.continue')}</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.pickHeader}>{t('auth.childPickHelp')}</Text>

              {loading && <ActivityIndicator color={ACCENT} style={{ marginBottom: 16 }} />}

              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childCard, loading && styles.btnDisabled]}
                  activeOpacity={0.75}
                  onPress={() => handlePickChild(child)}
                  disabled={loading}
                >
                  <Text style={styles.childAvatar}>{child.avatar || '🙂'}</Text>
                  <Text style={styles.childName} numberOfLines={1}>{child.display_name}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  backBtn: {
    paddingHorizontal: 20,
    paddingVertical:   12,
    alignSelf:         'flex-start',
  },
  backText: { color: TEXT_MUTED, fontSize: 14 },

  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: 28,
    paddingBottom:     48,
  },

  logoWrap: {
    alignItems:   'center',
    marginBottom: 20,
    direction:    'ltr',
  },
  logoImage:    { width: 64, height: 64 },
  logoWordmark: { color: ACCENT, fontSize: 22, fontWeight: '900', letterSpacing: 7, marginTop: 8 },

  helpText: {
    color:        TEXT_MUTED,
    fontSize:     15,
    textAlign:    'center',
    marginBottom: 28,
    lineHeight:   22,
  },

  familyCodeLabel: {
    color:        ACCENT,
    fontSize:     14,
    fontWeight:   '700',
    textAlign:    'center',
    marginBottom: 10,
    marginTop:    8,
  },
  familyCodeInput: {
    backgroundColor:   CARD_BG,
    color:             TEXT_LIGHT,
    borderRadius:      14,
    borderWidth:       2,
    borderColor:       ACCENT,
    paddingVertical:   22,
    paddingHorizontal: 20,
    marginBottom:      28,
    fontSize:          28,
    fontWeight:        '800',
    textAlign:         'center',
    letterSpacing:     6,
  },

  pickHeader: {
    color:        TEXT_LIGHT,
    fontSize:     22,
    fontWeight:   '900',
    textAlign:    'center',
    marginBottom: 24,
  },
  childCard: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   CARD_BG,
    borderRadius:      14,
    borderWidth:       1.5,
    borderColor:       BORDER,
    paddingVertical:   16,
    paddingHorizontal: 20,
    marginBottom:      14,
  },
  childAvatar: { fontSize: 36, marginRight: 16 },
  childName:   { color: TEXT_LIGHT, fontSize: 20, fontWeight: '800', flex: 1 },

  btn:         { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 17, fontWeight: '800' },
});
