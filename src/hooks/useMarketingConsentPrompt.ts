/**
 * useMarketingConsentPrompt — one-time email-consent ask for OAuth parents.
 *
 * pkg/lifecycle-emails Phase 2 (SPEC: docs/sessions/lifecycle-emails/SPEC.md).
 *
 * Google/Apple signups never see the signup checkbox — AuthCallbackScreen
 * hardcodes marketing_consent=false — so ~half our parents were never ASKED.
 * This hook shows the same consent question once, on the parent's next visit
 * to the parent tabs (existing users included), and records the answer.
 *
 * Rules (Adi, 2026-07-17):
 *  - Asked at most once, ever: any resolution (yes / no / dismiss) stamps
 *    `marketing_consent_asked_at` into profiles.onboarding_data.
 *  - Never defaults to true — consent only on an explicit "yes".
 *  - Email/password signups are excluded (they answered at signup).
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { crossAlert } from '../platform/crossAlert';

const ASKED_KEY = 'marketing_consent_asked_at';
// Small delay so the question doesn't slam the user at the exact moment the
// dashboard appears (ADHD-household reality: they're mid-something).
const PROMPT_DELAY_MS = 2500;

export function useMarketingConsentPrompt(): void {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const promptedThisSession = useRef(false);

  useEffect(() => {
    if (promptedThisSession.current || !user || !profile) return;
    if (profile.role !== 'parent') return;

    const provider = user.app_metadata?.provider;
    if (provider !== 'google' && provider !== 'apple') return;
    if (profile.marketing_consent) return;
    if (profile.onboarding_data?.[ASKED_KEY]) return;

    promptedThisSession.current = true;

    const record = async (consent: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          marketing_consent: consent,
          onboarding_data: {
            ...(profile.onboarding_data ?? {}),
            [ASKED_KEY]: new Date().toISOString(),
          },
        })
        .eq('id', profile.id);

      if (error) {
        // Fail open for the NEXT session: nothing was stamped, so the user is
        // simply asked again later. Consent itself never turns on by accident.
        console.warn('[consent-prompt] failed to record answer:', error.message);
        return;
      }
      refreshProfile(user.id);
    };

    const timer = setTimeout(() => {
      crossAlert(
        t('auth.consentPromptTitle'),
        t('auth.consentPromptBody'),
        [
          { text: t('auth.consentPromptNo'), style: 'cancel', onPress: () => record(false) },
          { text: t('auth.consentPromptYes'), onPress: () => record(true) },
        ],
        // Android back/outside-tap dismiss counts as "asked, no answer" —
        // consent stays false and we never nag again (SPEC: shown once).
        { cancelable: true, onDismiss: () => record(false) },
      );
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [user, profile, refreshProfile, t]);
}
