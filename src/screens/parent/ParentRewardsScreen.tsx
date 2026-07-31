/**
 * Parent Rewards — Zen Mode
 * Shows store_rewards per child, selected via the child tab selector.
 * Parents can add new rewards via the "+ Add Reward" modal.
 * Real data from Supabase — no mock data.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { crossAlert } from '../../platform';
import { useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { ParentTabsParamList } from '../../navigation/types';
import { PARENT_THEME as T } from '../../theme';
import PhilosophyTip from '../../components/PhilosophyTip';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { pickI18nColumn, bilingualForDb } from '../../lib/i18nString';
import { usePendingSuggestions, type ChildSuggestion } from '../../hooks/useChildSuggestions';
import { usePendingRedemptions, type RewardRedemption } from '../../hooks/useRewardRedemptions';
import { PendingSuggestions } from '../../components/parent/PendingSuggestions';
import { HeaderActions } from '../../components/parent/HeaderActions';
import { DuplicateToChildModal } from '../../components/parent/DuplicateToChildModal';
import {
  MONEY_CONVERSION_REWARD,
  MONEY_MOTIVATOR_ID,
  calcMoneyRewardCredits,
} from '../onboarding/unified/onboardingData';
import { ONBOARDING_CONFIG } from '../../config/onboardingConfig';
import { getCurrencySymbol } from '../../lib/currency';
import { formatNum } from '../../lib/uiLocale';

interface StoreReward {
  id:             string;
  title:          string;
  title_he?:      string | null;
  emoji:          string;
  size:           string;
  credits_needed: number;
  cash_value?:    number | null;
}

/** Daily-BUFFs fallback when a child has no tasks yet (matches onboarding preview). */
const DEFAULT_DAILY_BUFFS =
  ONBOARDING_CONFIG.DEFAULT_TASKS_COUNT * ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE;

type RewardSize = 'small' | 'medium' | 'large';

const SIZE_OPTIONS: { value: RewardSize; labelKey: string; hintKey: string }[] = [
  { value: 'small',  labelKey: 'parentRewards.size.small',  hintKey: 'parentRewards.sizeHint.small'  },
  { value: 'medium', labelKey: 'parentRewards.size.medium', hintKey: 'parentRewards.sizeHint.medium' },
  { value: 'large',  labelKey: 'parentRewards.size.large',  hintKey: 'parentRewards.sizeHint.large'  },
];

const DEFAULT_CREDITS: Record<RewardSize, number> = {
  small: 100, medium: 300, large: 700,
};

export default function ParentRewardsScreen() {
  const { t, i18n } = useTranslation();
  const { familyId } = useAuth();
  const route = useRoute<RouteProp<ParentTabsParamList, 'ParentRewards'>>();
  const deepLinkChildId = route.params?.childId ?? null;
  const { children, loading: childrenLoading, refetch: refetchChildren } = useChildrenDashboard();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<StoreReward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  // Add-reward modal state
  const [showModal, setShowModal]     = useState(false);
  const [newTitle, setNewTitle]       = useState('');
  const [newEmoji, setNewEmoji]       = useState('🎁');
  const [newCredits, setNewCredits]   = useState('100');
  const [newSize, setNewSize]         = useState<RewardSize>('small');
  const [saving, setSaving]           = useState(false);
  // When editing an existing catalog reward, holds its id (modal becomes an editor).
  const [editingId, setEditingId]     = useState<string | null>(null);
  // Reward being copied to another child (opens the duplicate modal).
  const [dupReward, setDupReward]     = useState<StoreReward | null>(null);
  // When approving a child's suggestion, the add-reward modal is reused as the
  // "Yes" editor; this holds the suggestion id so we can mark it approved.
  const [approvingId, setApprovingId] = useState<string | null>(null);
  // Cash-conversion mode: the modal becomes the "Convert BUFFs to cash" editor.
  const [cashMode, setCashMode]       = useState(false);
  const [newCash, setNewCash]         = useState('');

  // Money-motivation gate + the child's daily-BUFFs earning potential (drives the
  // deliberately-high cash cost). Fetched per selected child.
  const [isMoneyMotivated, setIsMoneyMotivated] = useState(false);
  const [childDailyBuffs, setChildDailyBuffs]   = useState(DEFAULT_DAILY_BUFFS);

  const currencySymbol = getCurrencySymbol();
  const suggestedCashCredits = calcMoneyRewardCredits(childDailyBuffs);

  const {
    suggestions,
    markApproved,
    markDiscussing,
    refetch: refetchSuggestions,
  } = usePendingSuggestions(selectedChildId);

  // Redemption requests (child asked to redeem a reward → parent approves/talks).
  // Fetch FAMILY-WIDE (not per-child) so a request for a non-selected child is
  // still discoverable via a dot on its tab; the cards below are filtered to the
  // selected child.
  const {
    pending: allRedemptions,
    approve: approveRedemption,
    markDiscussing: markRedemptionDiscussing,
    refetch: refetchRedemptions,
  } = usePendingRedemptions();

  const redemptions = useMemo(
    () => allRedemptions.filter(r => r.child_id === selectedChildId),
    [allRedemptions, selectedChildId],
  );
  const pendingChildIds = useMemo(
    () => new Set(allRedemptions.map(r => r.child_id)),
    [allRedemptions],
  );

  // Refetch pending requests whenever the screen regains focus (e.g. tapping a
  // redemption notification, or returning to the tab) — there is no realtime
  // subscription, so without this a request that arrived while the screen was
  // mounted would never appear.
  useFocusEffect(
    useCallback(() => {
      refetchRedemptions();
    }, [refetchRedemptions]),
  );

  // Deep-link from a redemption notification: select the requesting child.
  useEffect(() => {
    if (deepLinkChildId) setSelectedChildId(deepLinkChildId);
  }, [deepLinkChildId]);

  // Auto-select first child once list loads
  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].childId);
    }
  }, [children, selectedChildId]);

  // Fetch rewards for selected child
  const fetchRewards = useCallback(async (childId: string) => {
    setRewardsLoading(true);
    const { data, error } = await supabase
      .from('store_rewards')
      .select('id, title, title_he, emoji, size, credits_needed, cash_value')
      .eq('child_id', childId)
      .eq('is_redeemed', false);
    if (error) console.error('[ParentRewards] fetch error:', error.message);
    setRewards(data ?? []);
    setRewardsLoading(false);
  }, []);

  // Whether the child is money-motivated (gates the cash suggestion) + their daily
  // BUFFs earning potential (sum of active task credits → the cash cost anchor).
  const fetchChildMeta = useCallback(async (childId: string) => {
    const [{ data: profile }, { data: tasks }] = await Promise.all([
      supabase.from('profiles').select('pro_settings').eq('id', childId).maybeSingle(),
      supabase.from('tasks').select('credits').eq('assigned_to', childId),
    ]);

    const motivators =
      (profile as { pro_settings?: { onboarding_data?: { motivators?: string[] } } } | null)
        ?.pro_settings?.onboarding_data?.motivators ?? [];
    setIsMoneyMotivated(motivators.includes(MONEY_MOTIVATOR_ID));

    const dailyBuffs = (tasks ?? []).reduce(
      (sum, row) => sum + ((row as { credits?: number }).credits ?? 0),
      0,
    );
    setChildDailyBuffs(dailyBuffs > 0 ? dailyBuffs : DEFAULT_DAILY_BUFFS);
  }, []);

  useEffect(() => {
    if (!selectedChildId) {
      setRewards([]);
      setIsMoneyMotivated(false);
      setChildDailyBuffs(DEFAULT_DAILY_BUFFS);
      return;
    }
    fetchRewards(selectedChildId);
    fetchChildMeta(selectedChildId);
  }, [selectedChildId, fetchRewards, fetchChildMeta]);

  // Update credits default when size changes
  const handleSizeSelect = (size: RewardSize) => {
    setNewSize(size);
    setNewCredits(String(DEFAULT_CREDITS[size]));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setApprovingId(null);
    setCashMode(false);
  };

  const openModal = () => {
    setApprovingId(null);
    setEditingId(null);
    setCashMode(false);
    setNewCash('');
    setNewTitle('');
    setNewEmoji('🎁');
    setNewSize('small');
    setNewCredits(String(DEFAULT_CREDITS.small));
    setShowModal(true);
  };

  // Tap an existing reward card → edit it (emoji / title / size / credits, or
  // cash amount for a cash reward). The save handler does an UPDATE, not INSERT.
  const handleEditReward = (r: StoreReward) => {
    setApprovingId(null);
    setEditingId(r.id);
    const isCash = r.cash_value != null;
    setCashMode(isCash);
    setNewCash(isCash ? String(r.cash_value) : '');
    setNewTitle(pickI18nColumn(r, i18n.language));
    setNewEmoji(r.emoji?.trim() || '🎁');
    const validSize = (['small', 'medium', 'large'] as const).includes(r.size as RewardSize);
    setNewSize(validSize ? (r.size as RewardSize) : 'small');
    setNewCredits(String(r.credits_needed));
    setShowModal(true);
  };

  const handleDeleteReward = () => {
    if (!editingId || !selectedChildId) return;
    const id = editingId;
    crossAlert(
      t('parentRewards.modal.deleteConfirmTitle'),
      t('parentRewards.modal.deleteConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('parentRewards.modal.delete'),
          style: 'destructive',
          onPress: async () => {
            closeModal();
            const { error } = await supabase.from('store_rewards').delete().eq('id', id);
            if (error) {
              console.error('[ParentRewards] delete error:', error.message);
              crossAlert(t('parentRewards.errorSave'), t('parentRewards.errorSaveMsg'));
              return;
            }
            fetchRewards(selectedChildId);
          },
        },
      ],
    );
  };

  // Cash-conversion suggestion → opens the modal in cash mode. The BUFF cost is
  // pre-set to the deliberately-high 5-day anchor; the parent sets the cash amount.
  const openCashModal = () => {
    setApprovingId(null);
    setEditingId(null);
    setCashMode(true);
    setNewCash('');
    setNewTitle(pickI18nColumn(
      { title: MONEY_CONVERSION_REWARD.title.en, title_he: MONEY_CONVERSION_REWARD.title.he },
      i18n.language,
    ));
    setNewEmoji(MONEY_CONVERSION_REWARD.emoji);
    setNewSize(MONEY_CONVERSION_REWARD.size);
    setNewCredits(String(suggestedCashCredits));
    setShowModal(true);
  };

  // "Yes, let's do it" — reuse the add-reward modal, prefilled with the child's
  // idea. The parent sets size/credits (keeps the economy in the parent's hands).
  const handleApproveSuggestion = (s: ChildSuggestion) => {
    setApprovingId(s.id);
    setEditingId(null);
    setCashMode(false);
    setNewCash('');
    setNewTitle(s.title);
    setNewEmoji(s.emoji?.trim() || '🎁');
    setNewSize('small');
    setNewCredits(String(DEFAULT_CREDITS.small));
    setShowModal(true);
  };

  const handleLetsTalk = async (s: ChildSuggestion) => {
    await markDiscussing(s.id);
  };

  // ── Redemption request handlers ──────────────────────────────────────────
  // "Yes, let's do it" → atomic deduct via RPC. "Let's talk" → keep it open
  // (no decline, no deduction), mirroring the suggestion deal-making moves.
  const handleApproveRedemption = async (r: RewardRedemption) => {
    const result = await approveRedemption(r.id);
    if (!result.ok) {
      if (result.error === 'insufficient_funds') {
        crossAlert(
          t('parentRewards.redemption.insufficientTitle'),
          t('parentRewards.redemption.insufficientMsg', { name: selectedChild?.displayName ?? '' }),
        );
      } else {
        crossAlert('', t('common.errorGeneric', { defaultValue: 'Something went wrong' }));
      }
      return;
    }
    // Balance changed — refresh the balance card.
    refetchChildren();
  };

  const handleRedemptionLetsTalk = async (r: RewardRedemption) => {
    await markRedemptionDiscussing(r.id);
  };

  // Copy this reward to one or more other children (one fresh row each).
  const handleDuplicateReward = async (targetChildIds: string[]) => {
    if (!familyId || !dupReward) return;
    const r = dupReward;
    const rows = targetChildIds.map(cid => ({
      family_id:      familyId,
      child_id:       cid,
      title:          r.title,
      title_he:       r.title_he ?? null,
      emoji:          r.emoji,
      size:           r.size,
      credits_needed: r.credits_needed,
      cash_value:     r.cash_value ?? null,
      is_redeemed:    false,
    }));
    const { error } = await supabase.from('store_rewards').insert(rows as never);
    if (error) {
      console.error('[ParentRewards] duplicate error:', error.message);
      crossAlert(t('parentRewards.errorSave'), t('parentRewards.errorSaveMsg'));
    }
  };

  const handleAddReward = async () => {
    if (!familyId || !selectedChildId) return;
    const title = newTitle.trim();
    if (!title) {
      crossAlert(t('parentRewards.errorMissingTitle'), t('parentRewards.errorMissingTitleMsg'));
      return;
    }
    const credits = parseInt(newCredits, 10);
    if (isNaN(credits) || credits < 1) {
      crossAlert(t('parentRewards.errorInvalidAmount'), t('parentRewards.errorInvalidAmountMsg'));
      return;
    }

    let cashValue: number | null = null;
    if (cashMode) {
      const cash = parseFloat(newCash);
      if (isNaN(cash) || cash <= 0) {
        crossAlert(t('parentRewards.errorInvalidAmount'), t('parentRewards.errorInvalidAmountMsg'));
        return;
      }
      cashValue = cash;
    }

    setSaving(true);

    // Edit mode — update the existing reward in place (no new row).
    if (editingId) {
      const updates: Record<string, unknown> = {
        emoji:          newEmoji.trim() || '🎁',
        credits_needed: credits,
      };
      if (cashMode) {
        updates.cash_value = cashValue;
      } else {
        updates.title    = title;
        // Collapse to the typed value (matches the custom-reward INSERT, which
        // only writes `title`). A Hebrew UI renders `title_he` via
        // pickI18nColumn, so leaving a stale `title_he` on an edited row hid the
        // edit and read as "it didn't save". See i18nString.ts IN-2026-05-27-04.
        updates.title_he = null;
        updates.size     = newSize;
      }
      const { error: updErr } = await supabase
        .from('store_rewards').update(updates as never).eq('id', editingId);
      setSaving(false);
      if (updErr) {
        console.error('[ParentRewards] update error:', updErr.message);
        crossAlert(t('parentRewards.errorSave'), t('parentRewards.errorSaveMsg'));
        return;
      }
      closeModal();
      fetchRewards(selectedChildId);
      return;
    }

    const { data, error } = await supabase.from('store_rewards').insert({
      family_id:         familyId,
      child_id:          selectedChildId,
      // Cash reward is a fixed product concept → store bilingually so the child
      // sees it in their own language. Custom rewards keep the single-column title.
      ...(cashMode
        ? bilingualForDb(MONEY_CONVERSION_REWARD.title)
        : { title }),
      emoji:             newEmoji.trim() || '🎁',
      credits_needed:    credits,
      size:              newSize,
      is_redeemed:       false,
      proposed_by_child: !!approvingId,
      cash_value:        cashValue,
    } as never).select('id').single();

    if (!error && approvingId && data) {
      await markApproved(approvingId, (data as { id: string }).id);
      await refetchSuggestions();
    }
    setSaving(false);

    if (error) {
      console.error('[ParentRewards] insert error:', error.message);
      crossAlert(t('parentRewards.errorSave'), t('parentRewards.errorSaveMsg'));
      return;
    }

    closeModal();
    fetchRewards(selectedChildId);
  };

  const selectedChild = children.find(c => c.childId === selectedChildId);

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.text }]}>{t('parentRewards.title')}</Text>
        <HeaderActions
          onAction={openModal}
          actionDisabled={!selectedChildId}
          actionA11yLabel={t('parentRewards.addBtn')}
        />
      </View>

      {/* Child selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
        {children.map((c) => {
          const selected = c.childId === selectedChildId;
          return (
            <TouchableOpacity
              key={c.childId}
              onPress={() => setSelectedChildId(c.childId)}
              style={[styles.childTab, selected && { backgroundColor: T.accent }]}
            >
              <Text style={styles.childTabEmoji}>{c.avatar}</Text>
              <Text style={[styles.childTabName, { color: selected ? '#fff' : T.textMuted }]}>
                {c.displayName}
              </Text>
              {pendingChildIds.has(c.childId) && (
                <View style={[styles.tabDot, { backgroundColor: selected ? '#fff' : T.accent }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {childrenLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : children.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: T.textMuted }}>{t('parentRewards.noChildren')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>

          <PhilosophyTip tipKey="tips.dopamineBridge" />

          {/* Buff balance for selected child */}
          {selectedChild && (
            <View style={[styles.balanceCard, { backgroundColor: T.accent }]}>
              <Text style={styles.balanceEmoji}>{selectedChild.avatar}</Text>
              <View>
                <Text style={styles.balanceName}>{selectedChild.displayName}</Text>
                <Text style={styles.balanceAmount}>
                  {t('parentRewards.balanceBuffs', { amount: formatNum(selectedChild.totalBalance) })}
                </Text>
              </View>
            </View>
          )}

          {/* Redemption requests — child asked to redeem; parent approves or talks */}
          {redemptions.length > 0 && (
            <View style={styles.redemptionWrap}>
              <Text style={[styles.sectionLabel, { color: T.textMuted }]}>
                {t('parentRewards.redemption.sectionTitle')}
              </Text>
              {redemptions.map((r) => (
                <View
                  key={r.id}
                  style={[styles.redemptionCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}
                >
                  <View style={styles.redemptionTop}>
                    <Text style={[styles.redemptionTitle, { color: T.text }]} numberOfLines={2}>
                      {r.reward_title}
                    </Text>
                    <View style={[styles.costBadge, { backgroundColor: '#F3E8FF' }]}>
                      <Text style={[styles.costText, { color: T.accent }]}>
                        {formatNum(r.credits_spent)} B
                      </Text>
                    </View>
                  </View>
                  <View style={styles.redemptionActions}>
                    <TouchableOpacity
                      style={[styles.approveBtn, { backgroundColor: T.accent }]}
                      onPress={() => handleApproveRedemption(r)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.approveText}>{t('parentRewards.redemption.approve')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.talkBtn, { borderColor: T.cardBorder }]}
                      onPress={() => handleRedemptionLetsTalk(r)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.talkText, { color: T.text }]}>
                        {t('parentRewards.redemption.letsTalk')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Child's reward ideas awaiting a deal */}
          <PendingSuggestions
            suggestions={suggestions}
            kind="reward"
            childName={selectedChild?.displayName ?? ''}
            onApprove={handleApproveSuggestion}
            onLetsTalk={handleLetsTalk}
          />

          {/* Cash-conversion suggestion — money-motivated child, none set up yet */}
          {isMoneyMotivated && !rewards.some(r => r.cash_value != null) && (
            <TouchableOpacity
              style={[styles.cashSuggestCard, { borderColor: T.accent }]}
              onPress={openCashModal}
              activeOpacity={0.85}
            >
              <Text style={[styles.cashSuggestTitle, { color: T.text }]}>
                {t('parentRewards.cashSuggest.title')}
              </Text>
              <Text style={[styles.cashSuggestBody, { color: T.textMuted }]}>
                {t('parentRewards.cashSuggest.body', { name: selectedChild?.displayName ?? '' })}
              </Text>
              <View style={[styles.cashSuggestCta, { backgroundColor: T.accent }]}>
                <Text style={styles.cashSuggestCtaText}>{t('parentRewards.cashSuggest.cta')}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Rewards list */}
          <Text style={[styles.sectionLabel, { color: T.textMuted }]}>{t('parentRewards.catalog')}</Text>

          {rewardsLoading ? (
            <ActivityIndicator color={T.accent} style={{ marginTop: 20 }} />
          ) : rewards.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
              <Text style={[styles.emptyText, { color: T.textMuted }]}>{t('parentRewards.empty')}</Text>
            </View>
          ) : (
            rewards.map((reward) => (
              <TouchableOpacity
                key={reward.id}
                onPress={() => handleEditReward(reward)}
                activeOpacity={0.7}
                style={[styles.rewardCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}
              >
                <Text style={styles.rewardIcon}>{reward.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rewardTitle, { color: T.text }]}>{pickI18nColumn(reward, i18n.language)}</Text>
                  {(() => {
                    const isValidSize = (['small', 'medium', 'large'] as const).includes(reward.size as RewardSize);
                    const goalLabel =
                      reward.cash_value != null
                        ? t('parentRewards.cashBadge', { symbol: currencySymbol, amount: reward.cash_value })
                        : isValidSize
                          ? t('parentRewards.rewardGoal', { size: t(`parentRewards.size.${reward.size as RewardSize}`) })
                          : null; // legacy/catalog rewards may have no size — omit the goal line rather than show a raw key
                    return goalLabel ? (
                      <Text style={[styles.rewardDesc, { color: T.textMuted }]}>{goalLabel}</Text>
                    ) : null;
                  })()}
                </View>
                <View style={[styles.costBadge, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[styles.costText, { color: T.accent }]}>
                    {formatNum(reward.credits_needed)} B
                  </Text>
                </View>
                {children.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setDupReward(reward)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.copyBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t('duplicate.copyReward')}
                  >
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* ── Add Reward Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeModal} />
          <View style={[styles.sheet, { backgroundColor: T.card }]}>
            <Text style={[styles.sheetTitle, { color: T.text }]}>
              {editingId
                ? t('parentRewards.modal.editTitle')
                : cashMode
                  ? t('parentRewards.cashSuggest.title')
                  : t('parentRewards.modal.title')}
            </Text>
            <Text style={[styles.sheetSub, { color: T.textMuted }]}>
              {t('parentRewards.modal.for', { name: selectedChild?.displayName ?? '' })}
            </Text>

            {/* Emoji */}
            <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('parentRewards.modal.emojiLabel')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={newEmoji}
              onChangeText={setNewEmoji}
              maxLength={4}
              placeholder="🎁"
              placeholderTextColor={T.textMuted}
            />

            {/* Title — fixed concept in cash mode (read-only) */}
            <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('parentRewards.modal.titleLabel')}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder },
                cashMode && { opacity: 0.6 },
              ]}
              value={newTitle}
              onChangeText={setNewTitle}
              editable={!cashMode}
              placeholder={t('parentRewards.modal.titlePlaceholder')}
              placeholderTextColor={T.textMuted}
              maxLength={60}
            />

            {/* Size — hidden in cash mode (cost is anchored, not size-driven) */}
            {!cashMode && (
              <>
                <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('parentRewards.modal.sizeLabel')}</Text>
                <View style={styles.sizeRow}>
                  {SIZE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.sizeBtn,
                        { borderColor: T.cardBorder },
                        newSize === opt.value && { backgroundColor: T.accent, borderColor: T.accent },
                      ]}
                      onPress={() => handleSizeSelect(opt.value)}
                    >
                      <Text style={[styles.sizeBtnLabel, newSize === opt.value && { color: '#fff' }]}>
                        {t(opt.labelKey)}
                      </Text>
                      <Text style={[styles.sizeBtnHint, { color: newSize === opt.value ? 'rgba(255,255,255,0.7)' : T.textMuted }]}>
                        {t(opt.hintKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Cash amount — cash mode only */}
            {cashMode && (
              <>
                <Text style={[styles.inputLabel, { color: T.textMuted }]}>
                  {t('parentRewards.modal.cashLabel', { symbol: currencySymbol })}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
                  value={newCash}
                  onChangeText={v => setNewCash(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  maxLength={7}
                  placeholder="50"
                  placeholderTextColor={T.textMuted}
                  selectTextOnFocus
                />
              </>
            )}

            {/* Credits */}
            <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('parentRewards.modal.buffsNeeded')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={newCredits}
              onChangeText={v => setNewCredits(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={5}
              selectTextOnFocus
            />

            {/* Live deal preview in cash mode */}
            {cashMode && newCash.trim() !== '' && (
              <Text style={[styles.cashHint, { color: T.accent }]}>
                {t('parentRewards.modal.cashHint', {
                  credits: formatNum(parseInt(newCredits, 10) || 0),
                  symbol: currencySymbol,
                  amount: newCash,
                })}
              </Text>
            )}

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: T.accent }, saving && { opacity: 0.6 }]}
              onPress={handleAddReward}
              disabled={saving || !newTitle.trim() || (cashMode && newCash.trim() === '')}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmText}>{t('parentRewards.modal.save')}</Text>
              }
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteReward}>
                <Text style={styles.deleteText}>{t('parentRewards.modal.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DuplicateToChildModal
        visible={!!dupReward}
        onClose={() => setDupReward(null)}
        children={children}
        currentChildId={selectedChildId}
        itemType="reward"
        itemTitle={dupReward ? pickI18nColumn(dupReward, i18n.language) : ''}
        onDuplicate={handleDuplicateReward}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  title:         { fontSize: 24, fontWeight: '700' },
  childSelector: { paddingHorizontal: 16, marginBottom: 12, maxHeight: 60 },
  childTab:      { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, backgroundColor: '#F3F4F6', gap: 6 },
  childTabEmoji: { fontSize: 16 },
  childTabName:  { fontSize: 14, fontWeight: '600' },
  tabDot:        { width: 8, height: 8, borderRadius: 4 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:       { padding: 20, paddingTop: 4, paddingBottom: 32 },
  balanceCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, gap: 14 },
  balanceEmoji:  { fontSize: 36 },
  balanceName:   { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 2 },
  balanceAmount: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sectionLabel:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  cashSuggestCard:    { borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', padding: 16, marginBottom: 20 },
  cashSuggestTitle:   { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  cashSuggestBody:    { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  cashSuggestCta:     { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  cashSuggestCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cashHint:           { fontSize: 13, fontWeight: '700', marginTop: -6, marginBottom: 12 },
  redemptionWrap:    { marginBottom: 20 },
  redemptionCard:    { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  redemptionTop:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  redemptionTitle:   { flex: 1, fontSize: 15, fontWeight: '600' },
  redemptionTag:     { fontSize: 12, fontWeight: '600', marginBottom: 10, marginTop: -4 },
  redemptionActions: { flexDirection: 'row', gap: 8 },
  approveBtn:        { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveText:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  talkBtn:           { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  talkText:          { fontSize: 13, fontWeight: '600' },

  emptyCard:     { borderRadius: 14, padding: 20, borderWidth: 1, alignItems: 'center' },
  emptyText:     { fontSize: 14, textAlign: 'center' },
  rewardCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, gap: 12 },
  rewardIcon:    { fontSize: 30 },
  rewardTitle:   { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rewardDesc:    { fontSize: 13 },
  costBadge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  costText:      { fontWeight: '700', fontSize: 13 },

  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle:    { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sheetSub:      { fontSize: 13, marginBottom: 20 },
  inputLabel:    { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input:         { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  sizeRow:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sizeBtn:       { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  sizeBtnLabel:  { fontSize: 13, fontWeight: '700', color: '#374151' },
  sizeBtnHint:   { fontSize: 11, marginTop: 2 },
  confirmBtn:    { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  confirmText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtn:     { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  deleteText:    { color: '#DC2626', fontSize: 14, fontWeight: '600' },
  copyBtn:       { padding: 4 },
  copyIcon:      { fontSize: 18 },
});
