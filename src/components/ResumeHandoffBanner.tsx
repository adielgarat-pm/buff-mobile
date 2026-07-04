/**
 * ResumeHandoffBanner — "you set BUFF up but never handed it to your kid" nudge.
 *
 * Rendered at the top of ParentDashboardScreen. Shows when the family has a
 * child who has NEVER activated (zero daily_progress rows, ever) and gives the
 * parent a one-tap way to send the join link to the child's device.
 *
 * This is the in-app loop-closer for the confirmed web-activation leak: web
 * families finish onboarding but the child never gets a working way in, and web
 * has no push to remind them. An in-app banner survives everything (no push, no
 * email deliverability) — the parent sees it on their next open.
 *
 * Source SPEC: docs/sessions/onboarding-redesign/SPEC.md §Failure & Resume (Phase 1).
 *
 * When every child has activated (or there are no children / no family code):
 * renders nothing.
 */
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';
import { BUFF_URLS } from '../lib/buffConfig';
import { supabase } from '../integrations/supabase/client';
import type { ChildSummary } from '../hooks/useChildrenDashboard';

interface Props {
  /** Children already loaded by the dashboard — passed in to avoid a second fetch. */
  familyChildren: ChildSummary[];
  /** Family join code (from useAuth). Null while auth is still resolving. */
  familyShortCode: string | null;
}

export default function ResumeHandoffBanner({ familyChildren, familyShortCode }: Props) {
  const { t } = useTranslation();
  const [unactivated, setUnactivated] = useState<ChildSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function detectUnactivated() {
      const childIds = familyChildren.map((c) => c.childId);
      if (childIds.length === 0) {
        if (!cancelled) setUnactivated([]);
        return;
      }

      // Any daily_progress row (any date) means the child has activated at least
      // once. RLS ("Users can manage their progress") scopes this to the caller's
      // family, so we don't need to pass family_id explicitly.
      const { data, error } = await supabase
        .from('daily_progress')
        .select('child_id')
        .in('child_id', childIds);

      if (cancelled) return;
      if (error) {
        // Fail safe: never show a false nudge on a query error.
        setUnactivated([]);
        return;
      }

      const activated = new Set((data ?? []).map((row) => row.child_id));
      setUnactivated(familyChildren.filter((c) => !activated.has(c.childId)));
    }

    void detectUnactivated();
    return () => {
      cancelled = true;
    };
  }, [familyChildren]);

  // Nothing to nudge, or no code to share yet.
  if (!familyShortCode || unactivated.length === 0) return null;

  // Prompt for one child at a time — a single clear action (ADHD-friendly),
  // never a wall of nudges. The next unactivated child surfaces once this one
  // activates.
  const child = unactivated[0];

  const handleSend = async () => {
    const message = t('resumeHandoff.shareMessage', {
      childName: child.displayName,
      code: familyShortCode,
      installUrl: BUFF_URLS.playStoreInstall,
    });

    try {
      if (Platform.OS === 'web') {
        const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
          | { share?: (data: { text?: string }) => Promise<void> }
          | undefined;
        if (nav?.share) {
          await nav.share({ text: message });
        } else {
          // Desktop / no Web Share API → open WhatsApp with the message prefilled.
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }
      } else {
        await Share.share({ message });
      }
    } catch {
      // User cancelled the share sheet (AbortError) or share is unavailable —
      // non-fatal, the banner stays so they can try again.
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.accent }]}>
      <Text style={[styles.title, { color: T.text }]}>
        {t('resumeHandoff.title', { childName: child.displayName })}
      </Text>
      <Text style={[styles.body, { color: T.textMuted }]}>
        {t('resumeHandoff.body', { childName: child.displayName })}
      </Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: T.accent }]}
        onPress={handleSend}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>{t('resumeHandoff.cta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
