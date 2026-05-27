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
 * Gated behind BUFF Premium — shows PaywallContent if not subscribed.
 */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChildTheme, useTheme } from '../../contexts/ThemeContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { supabase } from '../../integrations/supabase/client';
import { PaywallContent } from '../PaywallScreen';
import GamerRewardsScreen from './GamerRewardsScreen';
import { pickI18nColumn } from '../../lib/i18nString';

interface StoreReward {
  id:             string;
  title:          string;
  title_he?:      string | null;
  emoji:          string;
  size:           string;
  credits_needed: number;
  is_redeemed:    boolean;
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
  const { previewChildId, viewMode } = useMode();
  const { isSubscribed } = useSubscription();
  const isChildViewer = viewMode === 'child';

  const childId = previewChildId ?? profile?.id ?? null;
  const { totalBalance } = useChildData(childId);

  const [rewards, setRewards] = useState<StoreReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) {
      setRewards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('store_rewards')
      .select('id, title, title_he, emoji, size, credits_needed, is_redeemed')
      .eq('child_id', childId)
      .eq('is_redeemed', false)
      .then(({ data, error }) => {
        if (error) console.error('[ChildRewards] fetch error:', error.message);
        setRewards(data ?? []);
        setLoading(false);
      });
  }, [childId]);

  // Gate: non-subscribers see Paywall in place of the shop.
  // For child viewers (real child or parent-in-preview-as-child), show a
  // calm "ask your parent" empty state instead of the payment CTA.
  if (!isSubscribed) {
    if (isChildViewer) {
      return (
        <View style={[styles.lockedShop, { backgroundColor: T.background }]}>
          <Text style={styles.lockedShopEmoji}>🎁</Text>
          <Text style={[styles.lockedShopTitle, { color: T.foreground }]}>
            {t('childLockedState.shopTitle')}
          </Text>
          <Text style={[styles.lockedShopSub, { color: T.mutedForeground }]}>
            {t('childLockedState.shopSub')}
          </Text>
        </View>
      );
    }
    return <PaywallContent childName={profile?.display_name ?? ''} />;
  }

  const handleClaim = (reward: StoreReward) => {
    const displayTitle = pickI18nColumn(reward, i18n.language);
    if (totalBalance < reward.credits_needed) {
      Alert.alert(
        t('childRewards.notEnoughTitle'),
        t('childRewards.notEnoughMsg', { count: reward.credits_needed - totalBalance, title: displayTitle })
      );
    } else {
      Alert.alert(t('childRewards.claimTitle'), t('childRewards.claimMsg', { title: displayTitle }));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.background }}>

      {/* Header — balance and label are separate Text elements (no concatenation) */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.primary }]}>{t('childRewards.title')}</Text>
        <View style={[styles.walletBadge, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={styles.walletIcon}>⚡</Text>
          <Text style={[styles.walletAmount, { color: T.buff }]}>{totalBalance.toLocaleString()}</Text>
          <Text style={[styles.walletLabel, { color: T.mutedForeground }]}>{t('childRewards.walletLabel')}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.primary} />
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

          {rewards.map((reward) => {
            const canAfford = totalBalance >= reward.credits_needed;
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
                  <Text style={[styles.rewardDesc, { color: T.mutedForeground }]}>
                    {t('childRewards.needed', { count: reward.credits_needed.toLocaleString() })}
                  </Text>
                </View>
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
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:      { padding: 20, paddingTop: 4, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  rewardCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, gap: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
  rewardIcon:   { fontSize: 30 },
  rewardTitle:  { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rewardDesc:   { fontSize: 13 },
  claimBtn:     { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  claimPts:     { fontWeight: '700', fontSize: 13 },
  safeCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12, marginTop: 8 },
  safeEmoji:    { fontSize: 24 },
  safeText:     { flex: 1, fontSize: 13, lineHeight: 18 },

  lockedShop:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  lockedShopEmoji:   { fontSize: 64, marginBottom: 16 },
  lockedShopTitle:   { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8, lineHeight: 24 },
  lockedShopSub:     { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
