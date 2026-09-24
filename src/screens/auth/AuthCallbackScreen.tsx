import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { crossAlert } from '../../platform';
import { supabase } from '../../integrations/supabase/client';
import { resolveAcquisition } from '../../lib/acquisitionCapture';
import { logOnboardingEvent } from '../../lib/onboardingFunnel';
import { PASTEL_MODE as T } from '../../theme/modes';
// Web-only native-install CTA. Metro resolves the native stub (renders null) on
// Android/iOS, so this import is inert in the native bundle. This branch is the
// Google role-picker (parent/child not yet chosen) — no child session yet.
import GetTheAppCta from '../../components/install/GetTheAppCta';

/**
 * Shown after Google OAuth completes.
 * If the user has no profile yet (first Google login), they pick parent or child role.
 * If a profile already exists, navigation resolves automatically via AuthContext.
 */
export default function AuthCallbackScreen() {
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'AuthCallback'>>();
  const [creating, setCreating] = useState(false);

  // Show role selection when user exists but profile has no role set.
  const needsRoleSelection = !!user && (!profile || !profile.role);

  useEffect(() => {
    // RootNavigator handles redirect once profile.role is set.
  }, [user, profile]);

  const createProfile = async (role: 'parent' | 'child') => {
    if (!user) return;
    setCreating(true);

    try {
      let familyId: string | null = profile?.family_id ?? null;
      // Acquisition signal for a NEW family only; reused for family_created below.
      let acquisition: Awaited<ReturnType<typeof resolveAcquisition>> | null = null;

      // Duplicate-family guard (IN-2026-05-14-03). The in-memory profile.family_id
      // can be stale/unpropagated — e.g. a web user who already set up a family,
      // then installs the native app and Google-signs-in with the SAME account.
      // Re-read the authoritative family_id from the server before creating a new
      // family, and reuse it if present. Fail-safe: on any error we fall through
      // to the original create path, so a genuinely new parent is unaffected.
      if (role === 'parent' && !familyId) {
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('family_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (freshProfile?.family_id) familyId = (freshProfile as { family_id: string }).family_id;
      }

      if (role === 'parent' && !familyId) {
        const displayName = user.user_metadata?.full_name ?? user.email ?? 'Parent';
        // Seed the family language from the active app locale rather than a hardcoded
        // 'en', so a Hebrew signup doesn't silently default the whole family to English.
        const familyLang = i18n.language?.startsWith('he') ? 'he' : 'en';
        acquisition = await resolveAcquisition();
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            name: `${displayName}'s Family`,
            preferred_language: familyLang,
            platform: Platform.OS,
            acquisition_source: acquisition.source,
            acquisition: acquisition.raw,
            acquisition_country: acquisition.country,
          } as never)
          .select()
          .single();

        if (familyError) {
          crossAlert(t('auth.error.createFamily'));
          return;
        }
        familyId = (newFamily as { id: string }).id;
      }

      if (profile) {
        // Profile exists but role is missing — update it
        const { error } = await supabase
          .from('profiles')
          .update({ role, ...(familyId ? { family_id: familyId } : {}) } as never)
          .eq('user_id', user.id);
        if (error) {
          console.error('[AuthCallback] Error updating profile:', JSON.stringify(error, null, 2));
          crossAlert(t('auth.error.updateProfile'));
          return;
        }
      } else {
        // No profile at all — insert
        const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
        const insertPayload = {
          user_id: user.id,
          family_id: familyId,
          display_name: displayName,
          role,
          marketing_consent: false,
        };
        console.log('[AuthCallback] Upserting profile:', JSON.stringify(insertPayload, null, 2));
        const { error } = await supabase
          .from('profiles')
          .upsert(insertPayload as never, { onConflict: 'user_id', ignoreDuplicates: true });
        if (error) {
          console.error('[AuthCallback] Error creating profile:', JSON.stringify(error, null, 2));
          crossAlert(t('auth.error.createProfile'));
          return;
        }
      }

      if (familyId && role === 'parent') {
        await supabase.from('app_settings').insert({ family_id: familyId } as never);
      }

      // family_created — first funnel event + durable acquisition record, only
      // for a genuinely NEW family (acquisition stays null for a returning parent
      // reusing an existing family_id). Fired after the profile exists so
      // onboarding_events RLS passes. Fire-and-forget.
      if (familyId && role === 'parent' && acquisition) {
        void logOnboardingEvent({
          familyId,
          eventType: 'family_created',
          source: acquisition.source,
          acquisition: {
            ...(acquisition.raw ?? {}),
            source: acquisition.source,
            country: acquisition.country,
          },
        });
      }

      await refreshProfile(user.id);
    } finally {
      setCreating(false);
    }
  };

  if (!needsRoleSelection) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.canvas }}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  // Ways out (UX review 2026-09-24): the picker used to offer only Parent /
  // Teen, so someone who tapped Google with the wrong account — or a kid who
  // meant to use the family code — was stuck until they cleared site data. And
  // "Teen" created a child profile with NO family (no code step): no parent, no
  // tasks, a dead end. It is gone; a child joins through their family code.
  // Both exits are registered in this branch (RootNavigator branch 2).
  const goFamilyCode = () => navigation.navigate('ChildJoin');
  const useDifferentAccount = async () => {
    // Land on RoleSelection first, then drop the Google session: the signed-out
    // navigator re-opens at the current path (see authTransition.ts).
    navigation.navigate('RoleSelection');
    await signOut();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: T.canvas }}>
      <Text style={{ color: T.accent, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 }}>
        {t('auth.googleWhoIsJoining')}
      </Text>

      {/* Native-install CTA (web-only; null on native + non-Android) */}
      <GetTheAppCta placement="post-signup" />

      <TouchableOpacity
        testID="authcb-parent"
        onPress={() => createProfile('parent')}
        disabled={creating}
        style={{
          backgroundColor: T.accent,
          borderRadius: 16,
          paddingVertical: 20,
          alignItems: 'center',
          marginBottom: 16,
          opacity: creating ? 0.7 : 1,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{t('auth.iAmParent')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="authcb-family-code"
        onPress={goFamilyCode}
        disabled={creating}
        style={{
          backgroundColor: T.card,
          borderRadius: 16,
          paddingVertical: 20,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: T.accent,
          opacity: creating ? 0.7 : 1,
        }}
      >
        <Text style={{ color: T.accent, fontSize: 20, fontWeight: '700' }}>{t('auth.iHaveFamilyCode')}</Text>
      </TouchableOpacity>

      {creating && <ActivityIndicator color={T.accent} style={{ marginTop: 24 }} />}

      <TouchableOpacity
        testID="authcb-other-account"
        onPress={useDifferentAccount}
        disabled={creating}
        style={{ marginTop: 32, paddingVertical: 8, alignItems: 'center' }}
        accessibilityRole="button"
      >
        <Text style={{ color: T.textMuted, textAlign: 'center' }}>
          {t('auth.useDifferentAccount', { email: user?.email ?? '' })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
