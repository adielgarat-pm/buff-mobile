/**
 * Parent Dashboard — Zen Mode
 *
 * FIX 1  — Insights empty state: shows "unlock after 3 days" when no data yet
 * FIX 2B — Greeting uses first name (display_name || email prefix || 'there')
 * FIX 3  — "+ Add Child" button; always shows paywall (isSubscribed = false)
 * FIX 4  — Bonus modal (amount + note → credit_vault + bonus_log)
 *           Send Sticker → Alert placeholder
 */
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView,
  Share,
} from 'react-native';
import AppModal from '../../components/AppModal';
import { BatteryGlyph } from '../../components/BatteryGlyph';
import DisclaimerFooter from '../../components/DisclaimerFooter';
import { ParentCaptureEntry } from '../../components/parent/ParentCaptureEntry';
import { ParentNotificationBell } from '../../components/parent/ParentNotificationBell';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { PARENT_THEME as T } from '../../theme';
import { BUFF_URLS } from '../../lib/buffConfig';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useParentInsights } from '../../hooks/useParentInsights';
import { useParentRecommendations } from '../../hooks/useParentRecommendations';
import RecommendationCard from '../../components/parent/RecommendationCard';
import type { Recommendation } from '../../utils/recommendationEngine';
import { useSubscription } from '../../hooks/useSubscription';
import { useUnlinkedChildren } from '../../hooks/useUnlinkedChildren';
import { useParentNotifications } from '../../hooks/useParentNotifications';
import { useYesterdayRecap } from '../../hooks/useYesterdayRecap';
import LinkChildModal from '../../components/LinkChildModal';
import PauseBanner from '../../components/PauseBanner';
import YesterdayRecapCard from '../../components/YesterdayRecapCard';
import AnchorRecoveryPromptModal from './AnchorRecoveryPromptModal';
import MedReminderSheet from './MedReminderSheet';
import { useAnchorRecoveryPrompts } from '../../hooks/useAnchorRecoveryPrompts';
import { useAnchorRecoveryDismiss } from '../../hooks/useAnchorRecoveryDismiss';
import { supabase } from '../../integrations/supabase/client';
import { STICKER_CATALOG } from '../../lib/stickerCatalog';
import { formatNum } from '../../lib/uiLocale';
import { useInstallNudgeRegistration } from '../../components/install/InstallNudge';
import { useRateNudgeRegistration } from '../../components/rate/RateNudge';
import { useActiveNudge } from '../../lib/nudges/nudgeManager';
import type { RootStackParamList, ParentTabsParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const QUICK_AMOUNTS = [10, 20, 50, 100];

export default function ParentDashboardScreen() {
  const navigation                         = useNavigation<Nav>();
  const route                              = useRoute<RouteProp<ParentTabsParamList, 'ParentDashboard'>>();
  const { t }                              = useTranslation();
  const { profile, user, familyId, familyShortCode } = useAuth();
  const [codeCopied, setCodeCopied]        = useState(false);
  const { enterChildPreview, isChildPreview } = useMode();
  const { children, loading: childrenLoading, refetch } = useChildrenDashboard();
  const { isSubscribed }                   = useSubscription();
  const { unlinked, linkable, linkChild }  = useUnlinkedChildren();
  // Today's parent_sos signals per child — surfaces an inline message +
  // soft dot on the child's card. Auto-clears at midnight (filter is
  // today-only); no manual mark-as-read in v1.
  const { getSosForChild }                 = useParentNotifications();
  // Anchor Recovery prompts — pkg/anchor-recovery Phase 2. Surfaces a
  // full-screen modal on first dashboard open of the day (OQ-P2-1 a) if
  // any kid has an unread anchor_recovery notification.
  const { prompts: anchorPrompts, resolveAll: resolveAnchorPrompts } = useAnchorRecoveryPrompts();
  const {
    shownToday: anchorShownToday,
    markShown:  markAnchorShown,
    loading:    anchorDismissLoading,
  } = useAnchorRecoveryDismiss(familyId ?? null);
  const [anchorModalVisible, setAnchorModalVisible] = useState(false);
  // Passive nudge slot — install banner (pkg/pwa-install-nudge) or rate banner
  // (pkg/rate-us-port). One slot, one winner via the Nudge Manager: install
  // (priority 20) beats rate (10), and a 7-day global cooldown stops stacking.
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  useInstallNudgeRegistration(() => setNudgeDismissed(true));
  useRateNudgeRegistration(() => setNudgeDismissed(true), { enabled: !isChildPreview });
  const activeNudge = useActiveNudge({ suppressed: isChildPreview || nudgeDismissed });
  // Phase 3 — Med reminder sheet, opened over the anchor modal from its meds
  // CTA. Stacked (anchor modal stays mounted underneath) so cancelling the
  // sheet returns to the recovery options without a re-open race.
  const [medSheetTarget, setMedSheetTarget] = useState<{ childId: string; childName: string } | null>(null);
  // Per-child set of kids who already have a standalone meds task — hides the
  // meds CTA for them (OQ7). Reconciled heuristic: see the query effect below.
  const [medsExistingFor, setMedsExistingFor] = useState<Set<string>>(new Set());
  // Yesterday's task completion per child — read-only section below "Today."
  // Beta-driven (Shani 2026-05-21); SPEC at docs/sessions/yesterday-recap/.
  const {
    recapByChildId:    yesterdayRecaps,
    shouldHide:        yesterdayHidden,
    yesterdayDate,
    loading:           yesterdayLoading,
  } = useYesterdayRecap();
  const [linkTarget, setLinkTarget]        = useState<typeof unlinked[0] | null>(null);
  const autoLinkedRef                      = useRef(false);

  // Today/Yesterday toggle — pkg/dashboard-today-yesterday-toggle (2026-05-23).
  // Defaults to 'today' on every mount per OQ-DTY-2 (no persistence — keeps
  // parent focused on the actionable surface; Yesterday is opt-in review).
  // Effective view falls back to 'today' if yesterday is unavailable
  // (Pause Mode, no kids, no scheduled tasks yesterday) — see OQ-DTY-5.
  const [view, setView] = useState<'today' | 'yesterday'>('today');
  const yesterdayAvailable = !yesterdayLoading && !yesterdayHidden;
  const effectiveView: 'today' | 'yesterday' =
    !yesterdayAvailable ? 'today' : view;
  // Format yesterdayDate ('YYYY-MM-DD') → 'D.M' for the Yesterday pill label.
  // Mirrors the pkg/yesterday-recap §5 (option C) display format.
  const formattedYesterday = yesterdayDate
    ? (() => {
        const parts = yesterdayDate.split('-');
        if (parts.length !== 3) return '';
        return `${parseInt(parts[2], 10)}.${parseInt(parts[1], 10)}`;
      })()
    : '';
  // Today's date in the same D.M format — shown as a subtext under the
  // "היום" pill so both pills carry parallel information (date parity)
  // and balance to identical heights. pkg/dashboard-toggle-redesign §OQ-DTR-3.
  const formattedToday = (() => {
    const now = new Date();
    return `${now.getDate()}.${now.getMonth() + 1}`;
  })();

  // Auto-link when possible; show modal only if no match found
  useEffect(() => {
    if (autoLinkedRef.current || unlinked.length === 0 || linkable.length === 0) return;

    const child = unlinked[0];

    // 1. Exact 1:1 match
    if (linkable.length === 1) {
      autoLinkedRef.current = true;
      linkChild(child, linkable[0].id).then(({ error }) => {
        if (!error) refetch();
        else autoLinkedRef.current = false;
      });
      return;
    }

    // 2. Multiple profiles — try name match (case-insensitive)
    const childName = child.displayName.trim().toLowerCase();
    const nameMatch = linkable.find(p =>
      p.displayName.trim().toLowerCase() === childName
    );

    if (nameMatch) {
      autoLinkedRef.current = true;
      linkChild(child, nameMatch.id).then(({ error }) => {
        if (!error) refetch();
        else autoLinkedRef.current = false;
      });
      return;
    }

    // 3. No match — open modal for parent to choose
    setLinkTarget(child);
  }, [unlinked, linkable, linkChild, refetch]);

  // Anchor Recovery modal auto-show is RETIRED (spec-typed-toucan): the lapse
  // case now surfaces through the calm "Recommended now" card below, not a
  // full-screen interruption. The modal component stays mounted (visible stays
  // false) until card parity is verified on device, then it's removed in a
  // follow-up. The effect is kept (no auto-open) so the dismiss-hook fields
  // remain wired for that transitional period.
  useEffect(() => {
    if (anchorDismissLoading || anchorShownToday) return;
    // intentionally no setAnchorModalVisible(true) — the card owns this now.
  }, [anchorDismissLoading, anchorShownToday]);

  // OQ7 — determine which prompted kids already have a standalone meds task,
  // so the meds CTA is hidden for them. Locked OQ7 = title contains "תרופה"
  // AND NOT "ארוחת"/"בוקר"/"ערב". Reconciliation (flagged to Adi): that rule
  // would mis-classify our OWN two-dose titles ("נטילת תרופת בוקר"/"...ערב")
  // as non-standalone and re-suggest forever — so any is_system_generated meds
  // task also counts as standalone. Parent-created bundles still follow OQ7.
  const promptChildIds = anchorPrompts.map((p) => p.child_id).join(',');
  useEffect(() => {
    if (!promptChildIds) { setMedsExistingFor(new Set()); return; }
    let cancelled = false;
    (async () => {
      const ids = promptChildIds.split(',');
      const { data, error } = await supabase
        .from('tasks')
        .select('assigned_to, title, is_system_generated')
        .in('assigned_to', ids);
      if (cancelled || error || !data) return;
      const has = new Set<string>();
      for (const row of data as { assigned_to: string; title: string | null; is_system_generated: boolean | null }[]) {
        const tl = (row.title ?? '').toLowerCase();
        // Match the stem "תרופ" — covers תרופה / תרופת (construct, as in our own
        // two-dose titles + UGC like "נטילת תרופת ערב") / תרופות. Plain "תרופה"
        // would miss the construct form. (Refines locked OQ7; flagged to Adi.)
        const isMed = tl.includes('תרופ') || tl.includes('medication');
        if (!isMed) continue;
        const standalone =
          !!row.is_system_generated ||
          (!tl.includes('ארוחת') && !tl.includes('בוקר') && !tl.includes('ערב'));
        if (standalone) has.add(row.assigned_to);
      }
      if (!cancelled) setMedsExistingFor(has);
    })();
    return () => { cancelled = true; };
  }, [promptChildIds]);

  // Vibe CTA — still Phase 2 (log only). Phase 4 wires the Vibe Check task.
  const handleAnchorAddVibe = (childId: string, childName: string) => {
    if (__DEV__) console.log('[anchor-recovery] vibe CTA tapped (Phase 4 pending)', { childId, childName });
    void resolveAnchorPrompts();
    void markAnchorShown();
    setAnchorModalVisible(false);
  };
  // Meds CTA — Phase 3: open the smart-default sheet over the anchor modal.
  // Resolution happens only on a successful save (handleMedsSaved), not here,
  // so a parent who cancels the sheet still sees the recovery options.
  const handleAnchorAddMeds = (childId: string, childName: string) => {
    setMedSheetTarget({ childId, childName });
  };
  const handleMedsSaved = (childName: string) => {
    void resolveAnchorPrompts();
    void markAnchorShown();
    void refetch();
    setMedSheetTarget(null);
    setAnchorModalVisible(false);
    setInfoModal({ icon: '💊', message: t('medReminder.toast', { name: childName }) });
  };
  const handleAnchorDismiss = () => {
    void resolveAnchorPrompts();
    void markAnchorShown();
    setAnchorModalVisible(false);
  };

  const firstName = profile?.display_name && !profile.display_name.includes('@')
    ? profile.display_name.split(' ')[0]
    : user?.email?.split('@')[0] ?? 'there';

  // Use first child for insights
  const firstChild    = children[0] ?? null;
  const firstChildId  = firstChild?.childId ?? null;
  const { insights, loading: insightsLoading } = useParentInsights(firstChildId);
  const topInsight = insights[0] ?? null;

  // FIX 1 — detect "not enough data yet" for the insights card
  const daysSinceChildCreated = firstChild?.created_at
    ? (Date.now() - new Date(firstChild.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const showLockedInsights = daysSinceChildCreated < 3;
  const insightsLocked = !insightsLoading && (!topInsight || showLockedInsights);

  // ── "Recommended now" card (spec-typed-toucan) ───────────────────────────
  // The action layer on top of insights: reads the first child's live state
  // (pause / low-vibe / lapse / streak) and surfaces ONE actionable lever. When
  // it returns a recommendation it takes the prime slot; otherwise the legacy
  // insight/locked card renders unchanged. Lapse + standalone-med signals reuse
  // the anchor-recovery prompt set and the OQ7 meds set computed above.
  const firstChildLapsed = firstChildId
    ? anchorPrompts.some(p => p.child_id === firstChildId)
    : false;
  const firstChildHasMed = firstChildId ? medsExistingFor.has(firstChildId) : false;
  const { recommendation } = useParentRecommendations(firstChildId, {
    childName:        firstChild?.displayName ?? '',
    isLapsed:         firstChildLapsed,
    hasStandaloneMed: firstChildHasMed,
    topInsight:       topInsight ? { severity: topInsight.severity } : null,
  });
  const [dismissedRecId, setDismissedRecId] = useState<string | null>(null);
  const activeRec = recommendation && recommendation.id !== dismissedRecId
    ? recommendation
    : null;

  const handleRecCta = (rec: Recommendation) => {
    switch (rec.ctaType) {
      case 'send-sticker': openSticker(rec.childId); break;
      case 'add-med':      setMedSheetTarget({ childId: rec.childId, childName: rec.childName }); break;
      case 'send-bonus':   openBonus(rec.childId); break;
      case 'none':         break;
    }
    // A comeback engagement resolves the lapse signal so the card stops
    // re-appearing. add-med is the exception — it resolves on a successful
    // save (handleMedsSaved), mirroring the old anchor modal, so a cancelled
    // sheet leaves the recommendation in place.
    if (rec.trigger === 'comeback' && rec.ctaType !== 'add-med') {
      void resolveAnchorPrompts();
      void markAnchorShown();
    }
  };

  const handleRecDismiss = (rec: Recommendation) => {
    setDismissedRecId(rec.id);
    if (rec.trigger === 'comeback') {
      void resolveAnchorPrompts();
      void markAnchorShown();
    }
  };

  // ── FIX 3: paywall ──────────────────────────────────────────────────────
  const handleAddChild = () => {
    if (!isSubscribed && children.length >= 1) {
      navigation.navigate('Paywall', {
        childName: children[0]?.displayName ?? undefined,
      });
      return;
    }
    navigation.navigate('UStep1');
  };

  // ── FIX 4: bonus modal ───────────────────────────────────────────────────
  const [bonusChildId,  setBonusChildId]  = useState<string | null>(null);
  const [bonusAmount,   setBonusAmount]   = useState('20');
  const [bonusNote,     setBonusNote]     = useState('');
  const [bonusSending,  setBonusSending]  = useState(false);
  const [infoModal,     setInfoModal]     = useState<{ icon: string; message: string } | null>(null);

  const openBonus = (childId: string) => {
    setBonusChildId(childId);
    setBonusAmount('20');
    setBonusNote('');
  };

  const sendBonus = async () => {
    if (!bonusChildId || !familyId) return;
    const amount = parseInt(bonusAmount, 10);
    if (isNaN(amount) || amount < 1) return;

    setBonusSending(true);
    try {
      // 1. Credit the vault atomically (migration 021) — a concurrent child
      //    task completion can't clobber the bonus.
      const { data: adjustData, error: adjustError } = await supabase.rpc('adjust_credit_vault', {
        p_child_id: bonusChildId,
        p_delta:    amount,
        p_reason:   'parent_bonus',
      });
      const adjustRes = adjustData as { ok: boolean; error?: string } | null;
      if (adjustError || !adjustRes?.ok) {
        console.error('[Dashboard] sendBonus adjust failed:', adjustError ?? adjustRes?.error);
        setInfoModal({ icon: '⚠️', message: t('bonus.error') });
        return;
      }

      // 2. Try bonus_log (non-fatal — table may not exist yet)
      try {
        await supabase.from('bonus_log').insert({
          family_id:  familyId,
          child_id:   bonusChildId,
          amount,
          note:       bonusNote.trim() || null,
          created_at: new Date().toISOString(),
        } as never);
      } catch {
        console.warn('[Dashboard] bonus_log insert skipped — table may not exist yet');
      }

      // 3. Refresh children list so balance updates immediately
      refetch();

      setBonusChildId(null);
      setInfoModal({ icon: '⚡', message: t('dashboard.bonusSent') });
    } catch (err) {
      console.error('[Dashboard] sendBonus error:', err);
    } finally {
      setBonusSending(false);
    }
  };

  // ── Sticker modal — parent→child affirmation via `stickers` table ────────
  const [stickerChildId,  setStickerChildId]  = useState<string | null>(null);
  const [stickerSelected, setStickerSelected] = useState<string>(STICKER_CATALOG[0].key);
  const [stickerNote,     setStickerNote]     = useState('');
  const [stickerSending,  setStickerSending]  = useState(false);

  const openSticker = (childId: string) => {
    setStickerChildId(childId);
    setStickerSelected(STICKER_CATALOG[0].key);
    setStickerNote('');
  };

  const sendSticker = async () => {
    if (!stickerChildId || !familyId || !profile?.id) return;
    setStickerSending(true);
    try {
      const { error } = await supabase.from('stickers').insert({
        family_id:      familyId,
        from_parent_id: profile.id,
        to_child_id:    stickerChildId,
        sticker_type:   stickerSelected,
        message:        stickerNote.trim() || null,
      });
      if (error) throw error;
      setStickerChildId(null);
      setInfoModal({ icon: '🎴', message: t('sticker.sent') });
    } catch (err) {
      console.error('[Dashboard] sendSticker error:', err);
      setInfoModal({ icon: '😕', message: t('sticker.sendError') });
    } finally {
      setStickerSending(false);
    }
  };

  // ── Insights-screen CTA bridge ───────────────────────────────────────────
  // The Parent Insights screen routes a CTA back here (openSheet/sheetChildId)
  // to reuse the sticker/bonus/med sheets instead of duplicating their logic.
  useEffect(() => {
    const { openSheet, sheetChildId } = route.params ?? {};
    if (!openSheet || !sheetChildId) return;
    const child = children.find(c => c.childId === sheetChildId);
    const name  = child?.displayName ?? '';
    if (openSheet === 'sticker')      openSticker(sheetChildId);
    else if (openSheet === 'bonus')   openBonus(sheetChildId);
    else if (openSheet === 'med')     setMedSheetTarget({ childId: sheetChildId, childName: name });
    // Clear so re-focusing the tab doesn't re-open the sheet.
    navigation.setParams({ openSheet: undefined, sheetChildId: undefined } as never);
  }, [route.params, children]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: T.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Pause banner (only renders when paused) ─────────────────────── */}
      <PauseBanner />

      {/* ── Passive nudge slot (install / rate-us) — at most one at a time ── */}
      {activeNudge?.render() ?? null}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: T.textMuted }]}>
            {t('dashboard.goodMorning')}
          </Text>
          {/* FIX 2B */}
          <Text style={[styles.name, { color: T.text }]}>{firstName} 👋</Text>
        </View>
        <ParentNotificationBell />
      </View>

      {/* ── Parent capture entry (gated by FEATURE_PARENT_CAPTURE; null in prod) ── */}
      <ParentCaptureEntry />

      {/* ── Insights & recommendations — Premium (gated). Free users see an upgrade card. ── */}
      {!isSubscribed ? (
        topInsight && !showLockedInsights ? (
          /* FREE TEASER — show ONE real insight (value-first); the depth (trends,
             weekly map, tips, action levers) is gated → tap opens the Paywall.
             A brand-new free user with no data falls through to the upgrade card. */
          <TouchableOpacity
            style={[styles.insightCard, { backgroundColor: T.accent }]}
            onPress={() => navigation.navigate('Paywall', { childName: firstChild?.displayName ?? undefined })}
            activeOpacity={0.85}
          >
            <View style={styles.teaserTagRow}>
              <Text style={styles.insightTag}>
                {topInsight.icon} {t('parent.insights')}{firstChild?.displayName ? ` · ${firstChild.displayName}` : ''}
              </Text>
              <View style={styles.premiumPill}>
                <Text style={styles.premiumPillText}>✨ {t('dashboard.insightsPremiumBadge')}</Text>
              </View>
            </View>
            <Text style={styles.insightStat}>
              {topInsight.completionRate !== undefined ? `${topInsight.completionRate}%` : '—'}
            </Text>
            <Text style={styles.insightLabel}>{t(`insights.${topInsight.i18nKey}.title`)}</Text>
            <Text style={styles.insightDesc}>{t(`insights.${topInsight.i18nKey}.description`)}</Text>
            <Text style={styles.insightTip}>💬 {t(`insights.${topInsight.i18nKey}.suggestion`)}</Text>
            <View style={styles.insightCtaRow}>
              <Text style={styles.insightCtaText}>{t('dashboard.insightsTeaserCta')}</Text>
              <Text style={styles.insightCtaChevron}>›</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.insightCard, styles.insightCardLocked]}
            onPress={() => navigation.navigate('Paywall', { childName: children[0]?.displayName ?? undefined })}
            activeOpacity={0.8}
          >
            <Text style={styles.insightLockedIcon}>📊</Text>
            <Text style={styles.insightLockedTitle}>{t('dashboard.insightsPremiumTitle')}</Text>
            <Text style={styles.insightLockedHint}>{t('dashboard.insightsPremiumHint')}</Text>
            <View style={styles.insightUnlockBtn}>
              <Text style={styles.insightUnlockText}>Unlock with Premium ✨</Text>
            </View>
          </TouchableOpacity>
        )
      ) : activeRec ? (
        <RecommendationCard
          recommendation={activeRec}
          onCta={() => handleRecCta(activeRec)}
          onDismiss={() => handleRecDismiss(activeRec)}
        />
      ) : insightsLoading ? (
        <View style={[styles.insightCard, { backgroundColor: T.accent, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : insightsLocked ? (
        /* Subscriber, not enough data yet — still opens the richer Insights screen */
        <TouchableOpacity
          style={[styles.insightCard, styles.insightCardLocked]}
          onPress={() => navigation.navigate('ParentInsights', { childId: firstChildId ?? undefined })}
          activeOpacity={0.85}
        >
          <Text style={styles.insightLockedIcon}>📊</Text>
          <Text style={styles.insightLockedTitle}>{t('dashboard.insightsLocked')}</Text>
          <Text style={styles.insightLockedHint}>{t('dashboard.insightsLockedHint')}</Text>
          <Text style={[styles.insightLockedCta, { color: T.accent }]}>{t('dashboard.insightsCardCta')} ›</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: T.accent }]}
          onPress={() => navigation.navigate('ParentInsights', { childId: firstChildId ?? undefined })}
          activeOpacity={0.85}
        >
          <Text style={styles.insightTag}>
            {topInsight!.icon} {t('parent.insights')}{firstChild?.displayName ? ` · ${firstChild.displayName}` : ''}
          </Text>
          <Text style={styles.insightStat}>
            {topInsight!.completionRate !== undefined ? `${topInsight!.completionRate}%` : '—'}
          </Text>
          <Text style={styles.insightLabel}>{t(`insights.${topInsight!.i18nKey}.title`)}</Text>
          <Text style={styles.insightDesc}>{t(`insights.${topInsight!.i18nKey}.description`)}</Text>
          <Text style={styles.insightTip}>💬 {t(`insights.${topInsight!.i18nKey}.suggestion`)}</Text>
          <View style={styles.insightCtaRow}>
            <Text style={styles.insightCtaText}>{t('dashboard.insightsCardCta')}</Text>
            <Text style={styles.insightCtaChevron}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Unlinked children banner ───────────────────────────────────── */}
      {/* Only show the "join family" banners when there's actually a profile
          to link against — otherwise the kid is already in the family and
          the banner is a no-op that duplicates the TODAY card below.
          Fix per pkg/dashboard-clarity-cleanup Issue A (2026-05-23). */}
      {linkable.length > 0 && unlinked.map(child => (
        <TouchableOpacity
          key={child.id}
          style={styles.unlinkBanner}
          onPress={() => setLinkTarget(child)}
          activeOpacity={0.85}
        >
          <Text style={styles.unlinkBannerText}>
            {t('dashboard.joinedFamily', { name: child.displayName })}
          </Text>
        </TouchableOpacity>
      ))}

      {/* ── Section header — toggle pills when yesterday data is available,
              otherwise static "TODAY" label.
              pkg/dashboard-toggle-redesign (2026-05-24) — Big Segmented Pills:
              full-width row, equal-width pills, date as subtext under each
              day label, accent-fill active state. */}
      {yesterdayAvailable ? (
        <>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                effectiveView === 'today' ? styles.togglePillActive : styles.togglePillInactive,
              ]}
              onPress={() => setView('today')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.toggle.a11y.today')}
              accessibilityState={{ selected: effectiveView === 'today' }}
            >
              <Text style={[
                styles.togglePillText,
                effectiveView === 'today' ? styles.togglePillTextActive : styles.togglePillTextInactive,
              ]}>
                {t('dashboard.toggle.today')}
              </Text>
              <Text style={[
                styles.togglePillSubtext,
                effectiveView === 'today' ? styles.togglePillSubtextActive : styles.togglePillSubtextInactive,
              ]}>
                {formattedToday}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.togglePill,
                effectiveView === 'yesterday' ? styles.togglePillActive : styles.togglePillInactive,
              ]}
              onPress={() => setView('yesterday')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.toggle.a11y.yesterday')}
              accessibilityState={{ selected: effectiveView === 'yesterday' }}
            >
              <Text style={[
                styles.togglePillText,
                effectiveView === 'yesterday' ? styles.togglePillTextActive : styles.togglePillTextInactive,
              ]}>
                {t('dashboard.toggle.yesterday')}
              </Text>
              <Text style={[
                styles.togglePillSubtext,
                effectiveView === 'yesterday' ? styles.togglePillSubtextActive : styles.togglePillSubtextInactive,
              ]}>
                {formattedYesterday}
              </Text>
            </TouchableOpacity>
          </View>
          {/* + Add Child hidden in Yesterday view (OQ-DTY-4). In Today view it
              gets its own row below the full-width toggle (OQ-DTR-1). */}
          {effectiveView === 'today' && (
            <View style={styles.addChildRow}>
              <TouchableOpacity style={styles.addChildBtn} onPress={handleAddChild}>
                <Text style={[styles.addChildText, { color: T.accent }]}>
                  {t('dashboard.addChild')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: T.textMuted }]}>
            {t('dashboard.today')}
          </Text>
          {/* FIX 3 */}
          <TouchableOpacity style={styles.addChildBtn} onPress={handleAddChild}>
            <Text style={[styles.addChildText, { color: T.accent }]}>
              {t('dashboard.addChild')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Children cards (Today view) ──────────────────────────────────── */}
      {effectiveView === 'today' && (childrenLoading ? (
        <ActivityIndicator color={T.accent} style={{ marginTop: 20 }} />
      ) : children.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
          <Text style={[styles.emptyText, { color: T.textMuted }]}>{t('parent.noChildren')}</Text>
        </View>
      ) : (
        children.map(child => {
          const pct    = child.tasksTotal > 0 ? Math.round((child.tasksCompleted / child.tasksTotal) * 100) : 0;
          const atGoal = pct >= 70;
          const sos    = getSosForChild(child.childId);
          return (
            <View key={child.childId} style={[styles.childCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
              <View style={styles.childHeader}>
                <Text style={styles.childAvatar}>{child.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.childNameRow}>
                    <Text style={[styles.childName, { color: T.text }]}>{child.displayName}</Text>
                    {/* Soft SOS indicator — Pillar 2: a low-charge battery in
                        warm amber (matches kid-side SOS button #F59E0B), not
                        alarming red. Child-initiated only; persists until
                        midnight. */}
                    {sos && (
                      <View
                        accessible
                        accessibilityLabel={t('parentNotifications.sosInline.a11y', { name: child.displayName })}
                      >
                        <BatteryGlyph
                          level={1}
                          maxLevel={5}
                          width={13}
                          height={22}
                          fillColor="#F59E0B"
                          trackColor="#F3F4F6"
                          borderColor={T.cardBorder}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.childSub, { color: T.textMuted }]}>
                    {child.tasksCompleted}/{child.tasksTotal} {t('overview.tasks')} · ⚡ {formatNum(child.totalBalance)} {t('parentSettings.buffPoints')}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: atGoal ? '#ECFDF5' : '#FEF3C7' }]}>
                  <Text style={{ color: atGoal ? T.success : '#D97706', fontSize: 12, fontWeight: '700' }}>
                    {pct}%
                  </Text>
                </View>
              </View>

              {/* SOS inline message — sits between header and progress bar.
                  No tap-to-dismiss in v1 (Adi-locked); rolls off at midnight. */}
              {sos && (
                <Text style={[styles.sosInline, { color: T.textMuted }]}>
                  {t('parentNotifications.sosInline.text', { name: child.displayName })}
                </Text>
              )}

              {/* Progress bar */}
              <View style={[styles.barTrack, { backgroundColor: T.cardBorder }]}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: atGoal ? T.success : T.accentLight }]} />
              </View>
              <View style={styles.goalRow}>
                <Text style={[styles.goalText, { color: T.textMuted }]}>{t('weeklyGoal.goal70')}</Text>
                <View style={styles.goalMark} />
              </View>

              {/* Quick actions */}
              <View style={styles.childActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: T.cardBorder }]}
                  onPress={() => openBonus(child.childId)}
                >
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>{t('dashboard.bonus')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: T.cardBorder }]}
                  onPress={() => openSticker(child.childId)}
                >
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>🎴 {t('sticker.send')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: T.cardBorder }]}
                  onPress={() => enterChildPreview(child.childId, child.displayName)}
                >
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>👁 {t('overview.viewAsChild')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ))}

      {/* ── Invite-a-child card (Today view only) ─────────────────────────
          Surface for the family-level join code. Today the code lives only at
          end-of-onboarding + Settings → Account, and parents couldn't find it
          post-onboarding (Noa/Leia bug, 2026-05-27, see IN-2026-05-27-02).
          Family-scoped, not per-child: one code joins any kid. */}
      {effectiveView === 'today' && familyShortCode && (
        <View style={[styles.inviteCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
          <Text style={[styles.inviteTitle, { color: T.text }]}>{t('inviteCard.title')}</Text>
          <Text style={[styles.inviteMicrocopy, { color: T.textMuted }]}>{t('inviteCard.microcopy')}</Text>

          <Text style={[styles.inviteCodeLabel, { color: T.textMuted }]}>{t('inviteCard.codeLabel')}</Text>
          <View style={[styles.inviteCodeBox, { backgroundColor: T.accent }]}>
            <Text style={styles.inviteCodeText}>{familyShortCode}</Text>
          </View>

          <View style={styles.inviteBtnRow}>
            <TouchableOpacity
              style={[styles.inviteShareBtn, { backgroundColor: T.accent }]}
              onPress={async () => {
                try {
                  await Share.share({
                    message: t('inviteCard.shareMessage', {
                      code: familyShortCode,
                      installUrl: BUFF_URLS.playStoreInstall,
                    }),
                  });
                } catch (err) {
                  console.warn('[InviteCard] Share failed:', err);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.inviteShareBtnText}>{t('inviteCard.shareBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inviteCopyBtn, { borderColor: T.cardBorder }]}
              onPress={async () => {
                const Clipboard = await import('expo-clipboard');
                await Clipboard.setStringAsync(familyShortCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.inviteCopyBtnText, { color: T.accent }]}>
                {codeCopied ? t('inviteCard.copiedBtn') : t('inviteCard.copyBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Children cards (Yesterday view) ──────────────────────────────── */}
      {/* Section header is the Yesterday pill above — no inner header here. */}
      {effectiveView === 'yesterday' && (() => {
        const cards = children
          .map(child => {
            const recap = yesterdayRecaps[child.childId];
            if (!recap || recap.totalScheduled === 0) return null;
            return (
              <YesterdayRecapCard
                key={child.childId}
                childName={child.displayName}
                childAvatar={child.avatar}
                recap={recap}
              />
            );
          })
          .filter(Boolean);
        if (cards.length === 0) return null;
        return <View>{cards}</View>;
      })()}

      <DisclaimerFooter variant="short" />

      {/* ── Anchor Recovery prompt (pkg/anchor-recovery Phase 2/3) ───── */}
      <AnchorRecoveryPromptModal
        visible={anchorModalVisible}
        prompts={anchorPrompts}
        onAddVibe={handleAnchorAddVibe}
        onAddMeds={handleAnchorAddMeds}
        onDismiss={handleAnchorDismiss}
        showMedsFor={(childId) => !medsExistingFor.has(childId)}
      />

      {/* ── Med reminder setup sheet (Phase 3) ───────────────────────── */}
      <MedReminderSheet
        visible={!!medSheetTarget}
        childId={medSheetTarget?.childId ?? null}
        childName={medSheetTarget?.childName ?? ''}
        familyId={familyId ?? null}
        onClose={() => setMedSheetTarget(null)}
        onSaved={handleMedsSaved}
      />

      {/* ── Link child modal ─────────────────────────────────────────── */}
      <LinkChildModal
        unlinkedChild={linkTarget}
        linkable={linkable}
        onLink={async (child, targetId) => {
          const result = await linkChild(child, targetId);
          if (!result.error) refetch();
          return result;
        }}
        onDismiss={() => setLinkTarget(null)}
      />

      {/* ── Info modal (replaces Alert.alert) ────────────────────────── */}
      <AppModal
        visible={!!infoModal}
        icon={infoModal?.icon ?? ''}
        message={infoModal?.message ?? ''}
        onClose={() => setInfoModal(null)}
      />

      {/* ── FIX 4: Bonus modal ────────────────────────────────────────── */}
      <Modal
        visible={!!bonusChildId}
        transparent
        animationType="slide"
        onRequestClose={() => setBonusChildId(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior="padding"
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setBonusChildId(null)}
          />
          <View style={[styles.bonusSheet, { backgroundColor: T.card }]}>
            {/* Header */}
            <Text style={[styles.bonusTitle, { color: T.text }]}>
              {t('dashboard.bonusModalTitle')}
            </Text>
            <Text style={[styles.bonusSub, { color: T.textMuted }]}>
              {t('dashboard.bonusModalSub', {
                name: children.find(c => c.childId === bonusChildId)?.displayName ?? '',
              })}
            </Text>

            {/* Quick-amount chips */}
            <View style={styles.chipRow}>
              {QUICK_AMOUNTS.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.chip,
                    { borderColor: T.cardBorder },
                    bonusAmount === String(amt) && { backgroundColor: T.accent, borderColor: T.accent },
                  ]}
                  onPress={() => setBonusAmount(String(amt))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: T.textMuted },
                    bonusAmount === String(amt) && { color: '#fff' },
                  ]}>
                    ⚡{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom amount input */}
            <Text style={[styles.bonusInputLabel, { color: T.textMuted }]}>
              {t('dashboard.bonusAmount')}
            </Text>
            <TextInput
              style={[styles.bonusInput, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={bonusAmount}
              onChangeText={v => setBonusAmount(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
            />

            {/* Note */}
            <Text style={[styles.bonusInputLabel, { color: T.textMuted }]}>
              {t('dashboard.bonusNote')}
            </Text>
            <TextInput
              style={[styles.bonusInput, styles.bonusNoteInput, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={bonusNote}
              onChangeText={setBonusNote}
              placeholder={t('dashboard.bonusNotePlaceholder')}
              placeholderTextColor={T.textMuted}
              maxLength={120}
              multiline
            />

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.bonusConfirm, { backgroundColor: T.accent }, bonusSending && { opacity: 0.6 }]}
              onPress={sendBonus}
              disabled={bonusSending || !bonusAmount || parseInt(bonusAmount, 10) < 1}
            >
              {bonusSending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.bonusConfirmText}>{t('dashboard.bonusConfirm')}</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Sticker picker modal ──────────────────────────────────────── */}
      <Modal
        visible={!!stickerChildId}
        transparent
        animationType="slide"
        onRequestClose={() => setStickerChildId(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior="padding"
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setStickerChildId(null)}
          />
          <View style={[styles.bonusSheet, { backgroundColor: T.card }]}>
            <Text style={[styles.bonusTitle, { color: T.text }]}>
              {t('sticker.send')}
            </Text>
            <Text style={[styles.bonusSub, { color: T.textMuted }]}>
              {t('sticker.modalSub', {
                name: children.find(c => c.childId === stickerChildId)?.displayName ?? '',
              })}
            </Text>

            {/* Sticker grid */}
            <Text style={[styles.bonusInputLabel, { color: T.textMuted }]}>
              {t('sticker.pickOne')}
            </Text>
            <View style={styles.stickerGrid}>
              {STICKER_CATALOG.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.stickerOption,
                    { borderColor: T.cardBorder },
                    stickerSelected === s.key && { backgroundColor: T.accent, borderColor: T.accent },
                  ]}
                  onPress={() => setStickerSelected(s.key)}
                >
                  <Text style={styles.stickerOptionEmoji}>{s.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional note */}
            <Text style={[styles.bonusInputLabel, { color: T.textMuted }]}>
              {t('dashboard.bonusNote')}
            </Text>
            <TextInput
              style={[styles.bonusInput, styles.bonusNoteInput, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={stickerNote}
              onChangeText={setStickerNote}
              placeholder={t('dashboard.bonusNotePlaceholder')}
              placeholderTextColor={T.textMuted}
              maxLength={120}
              multiline
            />

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.bonusConfirm, { backgroundColor: T.accent }, stickerSending && { opacity: 0.6 }]}
              onPress={sendSticker}
              disabled={stickerSending}
            >
              {stickerSending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.bonusConfirmText}>{t('sticker.send')}</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  content:     { padding: 20, paddingTop: 52, paddingBottom: 32 },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting:     { fontSize: 14 },
  name:         { fontSize: 22, fontWeight: '700' },

  // Insight card
  insightCard:       { borderRadius: 16, padding: 18, marginBottom: 24, minHeight: 80 },
  insightCardLocked: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', paddingVertical: 28 },
  insightLockedIcon:  { fontSize: 32, marginBottom: 8 },
  insightLockedTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 6 },
  insightLockedHint:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  insightUnlockBtn:    { marginTop: 12, backgroundColor: T.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7 },
  insightUnlockText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  insightTag:    { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 },
  insightStat:   { color: '#fff', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  insightLabel:  { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  insightDesc:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 10 },
  insightTip:    { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontStyle: 'italic' },
  insightCtaRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' },
  insightCtaText:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  insightCtaChevron: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: -2 },
  insightLockedCta:  { fontSize: 13, fontWeight: '700', marginTop: 10 },
  teaserTagRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  premiumPill:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  premiumPillText:   { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Unlinked child banner
  unlinkBanner:     { backgroundColor: '#EDE9FE', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: T.accent },
  unlinkBannerText: { color: T.accent, fontSize: 14, lineHeight: 20 },

  // Section row (title + Add Child)
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  addChildBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#EDE9FE' },
  addChildText: { fontSize: 12, fontWeight: '700' },

  // Today/Yesterday toggle pills — pkg/dashboard-today-yesterday-toggle
  // ─── Toggle (pkg/dashboard-toggle-redesign) ─────────────────────────────
  // Big Segmented Pills — full-width row, equal-width pills, accent-fill
  // active state, bordered inactive state. Date renders as a small subtext
  // under each day label so both pills carry parallel information and
  // balance to identical heights.
  toggleRow:                  { flexDirection: 'row', gap: 8, marginTop: 8 },
  togglePill:                 {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  togglePillActive:           {
    backgroundColor: T.accent,
    borderColor: T.accent,
    shadowColor: T.accent,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  togglePillInactive:         {
    backgroundColor: T.card,
    borderColor: T.cardBorder,
  },
  togglePillText:             { fontSize: 16, fontWeight: '700' },
  togglePillTextActive:       { color: '#FFFFFF' },
  togglePillTextInactive:     { color: T.accent },
  togglePillSubtext:          { fontSize: 12, fontWeight: '500', marginTop: 2 },
  togglePillSubtextActive:    { color: 'rgba(255,255,255,0.78)' },
  togglePillSubtextInactive:  { color: T.textMuted },
  addChildRow:                { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },

  // Child cards
  emptyCard:    { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center' },
  emptyText:    { fontSize: 14 },
  childCard:    { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  childHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  childAvatar:  { fontSize: 30, marginRight: 12 },
  childNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  childName:    { fontSize: 17, fontWeight: '700' },
  sosInline:    { fontSize: 13, fontWeight: '500', fontStyle: 'italic', marginTop: 4, marginBottom: 8 },
  childSub:     { fontSize: 13 },
  badge:        { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  barTrack:     { height: 6, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 3 },
  goalRow:      { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 14 },
  goalText:     { fontSize: 11 },
  goalMark:     { width: 2, height: 8, backgroundColor: '#E5E7EB', marginLeft: 4 },
  childActions: { flexDirection: 'row', gap: 10 },
  actionBtn:    { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '600' },

  // Invite-a-child card (family-level)
  inviteCard:        { borderRadius: 16, padding: 18, marginTop: 4, marginBottom: 18, borderWidth: 1 },
  inviteTitle:       { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  inviteMicrocopy:   { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  inviteCodeLabel:   { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  inviteCodeBox:     { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', marginBottom: 14 },
  inviteCodeText:    { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 6 },
  inviteBtnRow:      { flexDirection: 'row', gap: 10 },
  inviteShareBtn:    { flex: 2, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  inviteShareBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
  inviteCopyBtn:     { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  inviteCopyBtnText: { fontSize: 14, fontWeight: '600' },

  // Shared modal overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },

  // Bonus bottom sheet
  bonusSheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  bonusTitle:       { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  bonusSub:         { fontSize: 13, marginBottom: 18 },
  chipRow:          { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip:             { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  chipText:         { fontSize: 13, fontWeight: '700' },
  bonusInputLabel:  { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  bonusInput:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 14 },
  bonusNoteInput:   { height: 72, textAlignVertical: 'top' },
  bonusConfirm:     { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  bonusConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  stickerGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  stickerOption:    { width: 56, height: 56, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stickerOptionEmoji: { fontSize: 28 },
});
