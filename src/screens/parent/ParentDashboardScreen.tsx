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
  Platform, Share,
} from 'react-native';
import AppModal from '../../components/AppModal';
import { BatteryGlyph } from '../../components/BatteryGlyph';
import DisclaimerFooter from '../../components/DisclaimerFooter';
import PhilosophyTip from '../../components/PhilosophyTip';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { PARENT_THEME as T } from '../../theme';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useParentInsights } from '../../hooks/useParentInsights';
import { useSubscription } from '../../hooks/useSubscription';
import { useUnlinkedChildren } from '../../hooks/useUnlinkedChildren';
import { useParentNotifications } from '../../hooks/useParentNotifications';
import { useYesterdayRecap } from '../../hooks/useYesterdayRecap';
import LinkChildModal from '../../components/LinkChildModal';
import PauseBanner from '../../components/PauseBanner';
import YesterdayRecapCard from '../../components/YesterdayRecapCard';
import AnchorRecoveryPromptModal from './AnchorRecoveryPromptModal';
import { useAnchorRecoveryPrompts } from '../../hooks/useAnchorRecoveryPrompts';
import { useAnchorRecoveryDismiss } from '../../hooks/useAnchorRecoveryDismiss';
import { supabase } from '../../integrations/supabase/client';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const QUICK_AMOUNTS = [10, 20, 50, 100];

export default function ParentDashboardScreen() {
  const navigation                         = useNavigation<Nav>();
  const { t }                              = useTranslation();
  const { profile, user, familyId, familyShortCode } = useAuth();
  const [codeCopied, setCodeCopied]        = useState(false);
  const { enterChildPreview }              = useMode();
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

  // Anchor Recovery: show modal on first dashboard open of the day if any
  // kid has an unread anchor_recovery notification (OQ-P2-1 = a). Gate on
  // dismiss-hook loading so the storage check completes before we decide.
  useEffect(() => {
    if (anchorDismissLoading) return;
    if (anchorShownToday) return;
    if (anchorPrompts.length === 0) return;
    if (anchorModalVisible) return;
    setAnchorModalVisible(true);
  }, [anchorDismissLoading, anchorShownToday, anchorPrompts.length, anchorModalVisible]);

  // Phase 2 wiring: CTAs LOG ONLY. Phase 3 will replace these with actual
  // task creation (Vibe Check task / standalone meds task). All three
  // handlers resolve the prompt (mark notifications as read) + mark
  // shown-today (so it doesn't re-fire) + close the modal.
  const handleAnchorAddVibe = (childId: string, childName: string) => {
    if (__DEV__) console.log('[anchor-recovery] Phase 2: vibe CTA tapped', { childId, childName });
    void resolveAnchorPrompts();
    void markAnchorShown();
    setAnchorModalVisible(false);
  };
  const handleAnchorAddMeds = (childId: string, childName: string) => {
    if (__DEV__) console.log('[anchor-recovery] Phase 2: meds CTA tapped', { childId, childName });
    void resolveAnchorPrompts();
    void markAnchorShown();
    setAnchorModalVisible(false);
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
      const child = children.find(c => c.childId === bonusChildId);
      const currentBalance = child?.totalBalance ?? 0;
      const newBalance = currentBalance + amount;

      // 1. Update credit_vault (upsert pattern)
      const { data: existing } = await supabase
        .from('credit_vault')
        .select('id')
        .eq('family_id', familyId)
        .eq('child_id', bonusChildId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('credit_vault')
          .update({ total_balance: newBalance })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('credit_vault')
          .insert({ family_id: familyId, child_id: bonusChildId, total_balance: newBalance });
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

  // ── FIX 4: sticker placeholder ───────────────────────────────────────────
  const handleSticker = (childName: string) => {
    setInfoModal({ icon: '🎴', message: t('dashboard.stickerNotReady', { name: childName }) });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: T.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Pause banner (only renders when paused) ─────────────────────── */}
      <PauseBanner />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: T.textMuted }]}>
            {t('dashboard.goodMorning')}
          </Text>
          {/* FIX 2B */}
          <Text style={[styles.name, { color: T.text }]}>{firstName} 👋</Text>
        </View>
        <View style={styles.previewBtn} />
      </View>

      {/* ── Insight card ───────────────────────────────────────────────── */}
      {insightsLoading ? (
        <View style={[styles.insightCard, { backgroundColor: T.accent, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : insightsLocked ? (
        /* FIX 1 — empty / locked state */
        <TouchableOpacity
          style={[styles.insightCard, styles.insightCardLocked]}
          onPress={() => !isSubscribed
            ? navigation.navigate('Paywall', { childName: children[0]?.displayName ?? undefined })
            : undefined
          }
          activeOpacity={isSubscribed ? 1 : 0.8}
        >
          <Text style={styles.insightLockedIcon}>📊</Text>
          <Text style={styles.insightLockedTitle}>{t('dashboard.insightsLocked')}</Text>
          <Text style={styles.insightLockedHint}>{t('dashboard.insightsLockedHint')}</Text>
          {!isSubscribed && (
            <View style={styles.insightUnlockBtn}>
              <Text style={styles.insightUnlockText}>Unlock with Premium ✨</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.insightCard, { backgroundColor: T.accent }]}>
          <Text style={styles.insightTag}>{topInsight!.icon} {t('parent.insights')}</Text>
          <Text style={styles.insightStat}>
            {topInsight!.completionRate !== undefined ? `${topInsight!.completionRate}%` : '—'}
          </Text>
          <Text style={styles.insightLabel}>{topInsight!.title}</Text>
          <Text style={styles.insightDesc}>{topInsight!.description}</Text>
          <Text style={styles.insightTip}>💬 {topInsight!.suggestion}</Text>
        </View>
      )}

      <DisclaimerFooter variant="short" />

      {(children?.some(c => ((c?.tasksTotal ?? 0) - (c?.tasksCompleted ?? 0)) >= 3) ?? false) && (
        <PhilosophyTip tipKey="tips.breakItDown" dismissible />
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
                    {child.tasksCompleted}/{child.tasksTotal} {t('overview.tasks')} · ⚡ {child.totalBalance.toLocaleString()} {t('parentSettings.buffPoints')}
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
                  onPress={() => handleSticker(child.displayName)}
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
                    message: t('inviteCard.shareMessage', { code: familyShortCode }),
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

      {/* ── Anchor Recovery prompt (pkg/anchor-recovery Phase 2) ─────── */}
      <AnchorRecoveryPromptModal
        visible={anchorModalVisible}
        prompts={anchorPrompts}
        onAddVibe={handleAnchorAddVibe}
        onAddMeds={handleAnchorAddMeds}
        onDismiss={handleAnchorDismiss}
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
  previewBtn:   { backgroundColor: '#F3E8FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  previewBtnText: { color: '#6D28D9', fontSize: 13, fontWeight: '600' },

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
});
