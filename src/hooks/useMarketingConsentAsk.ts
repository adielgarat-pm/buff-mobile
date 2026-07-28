/**
 * useMarketingConsentAsk — the one-time "may we email you?" ask.
 *
 * Why this exists: Google-OAuth signups never see the signup checkbox, so
 * `AuthCallbackScreen` hardcodes `marketing_consent: false` for them. As of
 * 2026-07-27 that left 37 of 43 reachable parents permanently unmailable and
 * capped the legitimate audience at 6 people. This hook asks them once —
 * explicitly, in their own language — and never asks again.
 *
 * Hard rules (SPEC § "OAuth consent gap", Adi 2026-07-17):
 *   - NEVER default an existing user to true. Only an explicit yes counts.
 *   - Ask ONCE, ever. Declining is a final answer, not a "maybe later".
 *   - Parent surface only; a child session must never see this.
 *
 * "Already asked" is stored in `profiles.pro_settings.marketing_consent_asked_at`
 * rather than a dedicated column — same jsonb the onboarding flags already live
 * in, so no migration and no schema-change gate. The trade-off is that it is
 * awkward to query analytically; at this volume that costs nothing.
 *
 * The flag is written for BOTH answers. A parent who says no is not asked again.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

const ASKED_KEY = 'marketing_consent_asked_at';

interface UseMarketingConsentAsk {
  /** True only when this parent has never been asked and has not consented. */
  shouldAsk: boolean;
  /** Persist the answer, close the sheet, and never ask again. */
  answer: (consented: boolean) => Promise<void>;
  /** In flight — keeps the sheet's buttons from double-firing. */
  saving: boolean;
}

export function useMarketingConsentAsk(): UseMarketingConsentAsk {
  const { user, profile, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset the local guard when the signed-in parent changes, so a second
  // account on the same device still gets its own ask.
  useEffect(() => { setDismissed(false); }, [user?.id]);

  const alreadyAsked =
    profile?.pro_settings != null &&
    (profile.pro_settings as Record<string, unknown>)[ASKED_KEY] != null;

  const shouldAsk =
    !!user &&
    profile?.role === 'parent' &&
    profile?.marketing_consent !== true &&
    !alreadyAsked &&
    !dismissed;

  const answer = useCallback(async (consented: boolean) => {
    if (!user || saving) return;
    setSaving(true);
    // Close immediately. A storage failure must not trap the parent behind a
    // sheet they already answered — the worst case is being asked once more.
    setDismissed(true);
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('pro_settings')
        .eq('user_id', user.id)
        .single();

      const prev =
        ((existing as { pro_settings: Record<string, unknown> | null } | null)?.pro_settings) ?? {};

      const { error } = await supabase
        .from('profiles')
        .update({
          marketing_consent: consented,
          pro_settings: { ...prev, [ASKED_KEY]: new Date().toISOString() },
        } as never)
        .eq('user_id', user.id);

      if (error) {
        console.warn('[marketing-consent] save failed (non-fatal):', error.message);
        return;
      }
      await refreshProfile(user.id);
    } catch (err) {
      console.warn('[marketing-consent] save threw (non-fatal):', err);
    } finally {
      setSaving(false);
    }
  }, [user, saving, refreshProfile]);

  return { shouldAsk, answer, saving };
}
