/**
 * Child Rewards (Shop) — top-level theme router.
 *
 *   themeName === 'gamer' → GamerRewardsScreen (Stitch design 06, BUFF re-skin)
 *   themeName === 'mint'  → PastelChildRewards (existing implementation)
 *
 * The mint implementation lives below as PastelChildRewards and is preserved
 * verbatim from the pre-Teen-UI version of this file.
 *
 * Fetches store_rewards for the current child from Supabase.
 * Not gated behind subscription: the rewards shop is core to Pillar 1
 * (Intrinsic Motivation) and is not a paid feature per BUFF_PRD.md §5.1.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { crossAlert } from '../../platform';
import { useTranslation } from 'react-i18next';
import { useChildTheme, useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { useAppSettings } from '../../hooks/useAppSettings';
import PauseEmptyState from '../../components/PauseEmptyState';
import { useChildSuggestions } from '../../hooks/useChildSuggestions';
import { useRewardRedemptions } from '../../hooks/useRewardRedemptions';
import { SuggestModal, SuggestionStatusList, type SuggestPalette } from '../../components/child/ChildSuggest';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../integrations/supabase/client';
import GamerRewardsScreen from './GamerRewardsScreen';
import { pickI18nColumn } from '../../lib/i18nString';
import { formatNum } from '../../lib/uiLocale';

// Pending-request footer actions render ~16pt of text; this hitSlop lifts the
// effective touch target to ≥44pt each way (16 + 14 + 14) per safe-zone rule.
const PENDING_ACTION_HITSLOP = { top: 14, bottom: 14, left: 16, right: 16 };

interface StoreReward {
  id:             string;
  title:          string;
  title_he?:      string | null;
  emoji:          string;
  size:           string;
  credits_needed: number;
  is_redeemed:    boolean;
  cash_value?:    number | null;
}

// ─── Top-level router ────────────────────────────────────────────────────────

export default function ChildRewardsScreen() {
  const { themeName } = useTheme();
  if (themeName === 'gamer') {
    return <GamerRewardsScreen />;
  }
  return <PastelChildRewards />;
}

// ─── Pastel (mint theme) implementation ──────────────────────────────────────

function PastelChildRewards() {
  const { t, i18n } = useTranslation();
  const T = useChildTheme();
  const { profile } = useAuth();
  const { previewChildId } = useMode();

  const childId = previewChildId ?? profile?.id ?? null;
  const { totalBalance, refetch: refetchBalance } = useChildData(childId);
  const { isPauseActive } = useAppSettings();

  const { suggestions, submit, withdraw } = useChildSuggestions(childId);
  const {
    openForReward,
    request: requestRedemption,
    withdraw: withdrawRedemption,
    acknowledge: acknowledgeRedemption,
    refetch: refetchRedemptions,
  } = useRewardRedemptions(childId);
  const [suggestOpen, setSuggestOpen] = useState(false);

  // Tab screens stay mounted, so this screen's useChildData/useRewardRedemptions
  // instances go stale after a parent approves a redemption: the dashboard
  // refetches on focus and shows the deducted balance, while this screen kept
  // the old balance and the "pending" badge. Refetch both on every focus.
  useFocusEffect(useCallback(() => {
    refetchBalance();
    refetchRedemptions();
  }, [refetchBalance, refetchRedemptions]));

  const suggestPalette: SuggestPalette = {
    overlay:    'rgba(0,0,0,0.45)',
    surface:    T.card,
    text:       T.foreground,
    textMuted:  T.mutedForeground,
    accent:     T.primary,
    accentText: T.primaryForeground,
    inputBg:    T.background,
    border:     T.border,
  };

  const [rewards, setRewards]       = useState<StoreReward[]>([]);
  const [loading, setLoading]       = useState(true);
  // Fetch errors must NOT masquerade as the empty state ("Ask your parent to
  // add some!") — on flaky networks (e.g. ERR_CONNECTION_RESET to Supabase)
  // the kid would nag the parent while rewards actually exist. Track the
  // error separately and render a distinct, retryable state instead.
  const [fetchError, setFetchError] = useState(false);

  const fetchRewards = useCallback(() => {
    if (!childId) {
      setRewards([]);
      setFetchError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(false);
    supabase
      .from('store_rewards')
      .select('id, title, title_he, emoji, size, credits_needed, is_redeemed, cash_value')
      .eq('child_id', childId)
      .eq('is_redeemed', false)
      .then(({ data, error }) => {
        if (error) {
          console.error('[ChildRewards] fetch error:', error.message);
          setFetchError(true);
          setLoading(false);
          return;
        }
        setRewards(data ?? []);
        setLoading(false);
      });
  }, [childId]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // "Always close to a win" (Pillar 1): unlocked rewards float to the top so
  // the child's next actionable win is the first thing they see — mirrors
  // GamerRewardsScreen's unlocked-first ordering.
  const sortedRewards = useMemo(() => {
    return [
      ...rewards.filter(r => totalBalance >= r.credits_needed),
      ...rewards.filter(r => totalBalance <  r.credits_needed),
    ];
  }, [rewards, totalBalance]);

  // Redeem = open a redemption REQUEST for parent approval (points are deducted
  // later, by the parent, on approval). Only opens if the child can afford it.
  // Unaffordable tap is a silent no-op: the card already carries the "X to go"
  // progress inline, so no blocking alert (tap→modal→dismiss friction tax on
  // impulsive kids — Pillar 1/2).
  const handleClaim = async (reward: StoreReward) => {
    const displayTitle = pickI18nColumn(reward, i18n.language);
    if (totalBalance < reward.credits_needed) {
      return;
    }
    const { error } = await requestRedemption({
      id:             reward.id,
      title:          displayTitle,
      credits_needed: reward.credits_needed,
    });
    if (error) {
      crossAlert('', t('common.errorGeneric', { defaultValue: 'Something went wrong' }));
      return;
    }
    crossAlert(
      t('childRewards.requestSentTitle'),
      t('childRewards.requestSentMsg', { title: displayTitle }),
    );
  };

  const handleWithdraw = (reward: StoreReward) => {
    const open = openForReward(reward.id);
    if (open) withdrawRedemption(open.id);
  };

  // "Got it 👍" — child acknowledges the parent wants to talk; clears the card.
  const handleAcknowledge = (reward: StoreReward) => {
    const open = openForReward(reward.id);
    if (open) acknowledgeRedemption(open.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.background }}>

      {/* Header — balance and label are separate Text elements (no concatenation) */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.primary }]}>{t('childRewards.title')}</Text>
        <View style={[styles.walletBadge, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={styles.walletIcon}>⚡</Text>
          <Text style={[styles.walletAmount, { color: T.buff }]}>{formatNum(totalBalance)}</Text>
          <Text style={[styles.walletLabel, { color: T.mutedForeground }]}>{t('childRewards.walletLabel')}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : isPauseActive ? (
        // Pause active: short-circuit the shop (mirrors GamerRewardsScreen).
        // Header (balance) stays visible to reassure — nothing is lost.
        <ScrollView contentContainerStyle={styles.content}>
          <PauseEmptyState />
        </ScrollView>
      ) : fetchError ? (
        // Distinct error state — never show "ask your parent" for a network hiccup.
        <View style={styles.centered} testID="rewards-error-state">
          <Text style={styles.errorEmoji}>📡</Text>
          <Text style={{ color: T.foreground, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
            {t('childRewards.errorTitle')}
          </Text>
          <Text style={{ color: T.mutedForeground, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            {t('childRewards.errorSub')}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: T.primary }]}
            onPress={fetchRewards}
            accessibilityRole="button"
            accessibilityLabel={t('childRewards.retry')}
            testID="rewards-retry"
          >
            <Text style={[styles.retryText, { color: T.primaryForeground }]}>{t('childRewards.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : rewards.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: T.mutedForeground, fontSize: 15 }}>{t('childRewards.empty')}</Text>
          <Text style={{ color: T.mutedForeground, fontSize: 13, marginTop: 6 }}>
            {t('childRewards.emptySub')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionLabel, { color: T.mutedForeground }]}>{t('childRewards.available')}</Text>

          {sortedRewards.map((reward) => {
            const canAfford = totalBalance >= reward.credits_needed;
            const progressPct = canAfford
              ? 100
              : Math.min(100, Math.round((totalBalance / reward.credits_needed) * 100));
            const pending = openForReward(reward.id);
            return (
              <View
                key={reward.id}
                style={[
                  styles.rewardCard,
                  {
                    backgroundColor: T.card,
                    borderColor: canAfford ? T.primary : T.border,
                    shadowColor: canAfford ? T.shadow : 'transparent',
                  },
                ]}
              >
                <Text style={styles.rewardIcon}>{reward.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rewardTitle, { color: T.foreground }]}>{pickI18nColumn(reward, i18n.language)}</Text>
                  {/* Always the Buffs price — never a money tag on the child side
                      (cash_value stays parent-facing in ParentRewardsScreen). */}
                  <Text style={[styles.rewardDesc, { color: T.mutedForeground }]}>
                    {t('childRewards.needed', { count: formatNum(reward.credits_needed) })}
                  </Text>
                  {/* Per-card progress: the child sees how close the win is
                      without doing mental subtraction (working-memory tax). */}
                  <View
                    style={[styles.progressTrack, { backgroundColor: T.muted }]}
                    testID={`reward-progress-${reward.id}`}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPct}%`, backgroundColor: canAfford ? T.success : T.primary },
                      ]}
                    />
                  </View>
                  {!canAfford && (
                    <Text style={[styles.toGoText, { color: T.primary }]}>
                      {t('childRewards.toGo', { count: formatNum(reward.credits_needed - totalBalance) })}
                    </Text>
                  )}
                </View>
                {pending ? (
                  <View style={styles.pendingCol}>
                    <Text style={[styles.pendingLabel, { color: T.primary }]} numberOfLines={2}>
                      {pending.status === 'discussing'
                        ? t('childRewards.discussingLabel')
                        : t('childRewards.pendingLabel')}
                    </Text>
                    {pending.status === 'discussing' ? (
                      <TouchableOpacity
                        onPress={() => handleAcknowledge(reward)}
                        hitSlop={PENDING_ACTION_HITSLOP}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.pendingCancel, { color: T.mutedForeground }]}>
                          {t('childRewards.gotIt')}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleWithdraw(reward)}
                        hitSlop={PENDING_ACTION_HITSLOP}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.pendingCancel, { color: T.mutedForeground }]}>
                          {t('childRewards.cancelRequest')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.claimBtn,
                      {
                        backgroundColor: canAfford ? T.primary : T.muted,
                        borderColor:     canAfford ? T.primary : T.border,
                      },
                    ]}
                    onPress={() => handleClaim(reward)}
                  >
                    <Text style={[styles.claimPts, { color: canAfford ? T.primaryForeground : T.mutedForeground }]}>
                      {reward.credits_needed}⚡
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* Safe Harbour reminder */}
          <View style={[styles.safeCard, { backgroundColor: T.muted, borderColor: T.border }]}>
            <Text style={styles.safeEmoji}>🏰</Text>
            <Text style={[styles.safeText, { color: T.mutedForeground }]}>
              {t('childRewards.safeHarbourPre')}
              <Text style={{ color: T.success, fontWeight: '700' }}>{t('childRewards.earn')}</Text>
              {t('childRewards.safeHarbourPost')}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Suggest-a-reward footer + the kid's own open ideas */}
      <View style={[styles.suggestFooter, { borderTopColor: T.border }]}>
        <SuggestionStatusList
          suggestions={suggestions}
          kind="reward"
          palette={suggestPalette}
          onWithdraw={withdraw}
        />
        <TouchableOpacity
          style={[styles.suggestBtn, { backgroundColor: T.card, borderColor: T.border }]}
          onPress={() => setSuggestOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={T.primary} />
          <Text style={[styles.suggestText, { color: T.primary }]}>{t('childSuggest.reward.cta')}</Text>
        </TouchableOpacity>
      </View>

      <SuggestModal
        visible={suggestOpen}
        kind="reward"
        palette={suggestPalette}
        onClose={() => setSuggestOpen(false)}
        onSubmit={({ title, emoji }) => submit({ kind: 'reward', title, emoji })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:        { fontSize: 26, fontWeight: '900' },
  walletBadge:  { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, gap: 4 },
  walletIcon:   { fontSize: 16 },
  walletAmount: { fontSize: 18, fontWeight: '800' },
  walletLabel:  { fontSize: 12 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorEmoji:   { fontSize: 40, marginBottom: 10 },
  // ≥44pt touch target per safe-zone rule (minHeight + centered content).
  retryBtn:     { marginTop: 18, minHeight: 44, paddingHorizontal: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  retryText:    { fontSize: 14, fontWeight: '700' },
  content:      { padding: 20, paddingTop: 4, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  rewardCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, gap: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
  rewardIcon:   { fontSize: 30 },
  rewardTitle:  { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rewardDesc:   { fontSize: 13 },
  // ≥44pt touch target per safe-zone rule (minHeight + centered content).
  claimBtn:     { borderRadius: 10, paddingHorizontal: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  claimPts:     { fontWeight: '700', fontSize: 14 },
  pendingCol:   { alignItems: 'flex-end', gap: 3, maxWidth: 120 },
  pendingLabel: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  pendingCancel:{ fontSize: 12, fontWeight: '600' },
  progressTrack:{ height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6, alignSelf: 'stretch' },
  progressFill: { height: '100%', borderRadius: 3 },
  toGoText:     { fontSize: 12, fontWeight: '700', marginTop: 4 },
  safeCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12, marginTop: 8 },
  safeEmoji:    { fontSize: 24 },
  safeText:     { flex: 1, fontSize: 13, lineHeight: 18 },


  suggestFooter:     { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1 },
  suggestBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, borderWidth: 1, marginTop: 8 },
  suggestText:       { fontSize: 13, fontWeight: '700' },
});
