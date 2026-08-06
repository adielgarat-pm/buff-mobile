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
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';
import { BUFF_URLS, buildJoinUrl } from '../lib/buffConfig';
import { shareInvite } from '../lib/shareInvite';
import { logOnboardingEvent } from '../lib/onboardingFunnel';
import { useAuth } from '../contexts/AuthContext';
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
  const { familyId } = useAuth();
  const [unactivated, setUnactivated] = useState<ChildSummary[]>([]);
  const shownForRef = useRef<string | null>(null);

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

  // Funnel: the resume-handoff nudge became visible for a never-activated child
  // (once per child). This is the in-app "invite shown" surface outside onboarding.
  useEffect(() => {
    const first = unactivated[0];
    if (first && shownForRef.current !== first.childId) {
      shownForRef.current = first.childId;
      void logOnboardingEvent({ familyId, eventType: 'invite_shown', childId: first.childId });
    }
  }, [unactivated, familyId]);

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
      joinUrl: buildJoinUrl(familyShortCode),
      installUrl: BUFF_URLS.playStoreInstall,
    });
    // Cross-platform share (OS sheet on native, Web Share API / WhatsApp on web).
    // Never throws — the banner stays if the user dismisses, so they can retry.
    await shareInvite(message);
    void logOnboardingEvent({
      familyId,
      eventType: 'invite_sent',
      method: 'share',
      childId: child.childId,
    });
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
