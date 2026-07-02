import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { crossAlert } from '../../platform';
import { supabase } from '../../integrations/supabase/client';
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
  const { user, profile, refreshProfile } = useAuth();
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
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({ name: `${displayName}'s Family`, preferred_language: familyLang, platform: Platform.OS } as never)
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

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: T.canvas }}>
      <Text style={{ color: T.accent, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
        {t('auth.iAm')}
      </Text>
      <Text style={{ color: T.textMuted, textAlign: 'center', marginBottom: 40 }}>
        {t('auth.googleRoleSelection')}
      </Text>

      {/* Native-install CTA (web-only; null on native + non-Android) */}
      <GetTheAppCta placement="post-signup" />

      <TouchableOpacity
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
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{t('auth.parent')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => createProfile('child')}
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
        <Text style={{ color: T.accent, fontSize: 20, fontWeight: '700' }}>{t('auth.teen')}</Text>
      </TouchableOpacity>

      {creating && <ActivityIndicator color={T.accent} style={{ marginTop: 24 }} />}
    </View>
  );
}
