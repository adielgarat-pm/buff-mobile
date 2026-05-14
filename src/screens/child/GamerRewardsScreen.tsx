/**
 * GamerRewardsScreen — child Rewards (Shop) tab for the Gamer aesthetic mode.
 *
 * Based on Stitch design 06-rewards-shop (6a-from-parent variant) — re-skinned
 * to the BUFF brand palette per BUFF_BRAND.md §7.5 (violet canvas + lime
 * accent, not Stitch's green-on-green).
 *
 * Source design: docs/teen-ui-design/rewards-shop/6a-from-parent/
 *
 * Differences from PastelChildRewards (the existing ChildRewardsScreen):
 *   - Two-tab segmented control: FROM PARENT (default) + FROM BUDDY
 *   - FROM PARENT: 2x2 grid of rewards with locked/unlocked states
 *     - Locked: dim card, progress bar showing buffs accumulated, "X to go"
 *     - Available: lime border, glow, REDEEM button
 *   - FROM BUDDY: placeholder card — boosters system not yet implemented;
 *     when buddy_relationships.buddy_visible = false, header copy switches
 *     to "Your Boosters" (per design notes / D-2026-05-02-13 revised)
 *   - "Suggest a reward to your parent" CTA at bottom (visual stub for now)
 *
 * Subscription gating: identical to PastelChildRewards — non-subscribers
 * see PaywallContent. Keeps revenue funnel consistent across themes.
 *
 * Data:
 *   - Rewards: store_rewards table, filtered by child_id + is_redeemed = false
 *     (same query as PastelChildRewards)
 *   - Balance: useChildData.totalBalance
 *
 * Routing: ChildRewardsScreen routes to this when themeName === 'gamer'.
 */
import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useChildData } from '../../hooks/useChildProgress';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppSettings } from '../../hooks/useAppSettings';
import { supabase } from '../../integrations/supabase/client';
import { PaywallContent } from '../PaywallScreen';
import PauseEmptyState from '../../components/PauseEmptyState';
import WelcomeBackModal, { useWelcomeBack } from '../../components/WelcomeBackModal';

// ─── BUFF brand palette (Gamer mode) ─────────────────────────────────────────
const COLORS = {
  canvas:       '#1a1636',
  surface:      '#2D2546',
  surfaceDim:   '#231d3a',
  surfaceHigh:  '#3D3556',
  border:       'rgba(255,255,255,0.10)',
  borderActive: 'rgba(168, 230, 62, 0.50)',
  text:         '#FFFFFF',
  textMuted:    '#A78BFA',
  textFaint:    'rgba(255,255,255,0.55)',
  lime:         '#A8E63E',
  limeGlow:     'rgba(168, 230, 62, 0.10)',
  violet:       '#8b5cf6',
} as const;

type TabKey = 'parent' | 'buddy';

interface StoreReward {
  id:             string;
  title:          string;
  emoji:          string;
  size:           string | null;
  credits_needed: number;
  is_redeemed:    boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function GamerRewardsScreen() {
  const { t }       = useTranslation();
  const { profile } = useAuth();
  const { previewChildId, isChildPreview, viewMode } = useMode();
  const { isSubscribed } = useSubscription();
  const isChildViewer = viewMode === 'child';

  const childId = previewChildId ?? profile?.id ?? null;
  const { totalBalance } = useChildData(childId);

  const { isPauseActive } = useAppSettings();
  const welcomeBack       = useWelcomeBack();

  const [tab, setTab]         = useState<TabKey>('parent');
  const [rewards, setRewards] = useState<StoreReward[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch rewards (parent-set) ───────────────────────────────────────────
  useEffect(() => {
    if (!childId) {
      setRewards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('store_rewards')
      .select('id, title, emoji, size, credits_needed, is_redeemed')
      .eq('child_id', childId)
      .eq('is_redeemed', false)
      .then(({ data, error }) => {
        if (error) console.error('[GamerRewards] fetch error:', error.message);
        setRewards((data ?? []) as StoreReward[]);
        setLoading(false);
      });
  }, [childId]);

  // ── Categorize rewards by affordability ──────────────────────────────────
  const { unlocked, locked } = useMemo(() => {
    return {
      unlocked: rewards.filter(r => totalBalance >= r.credits_needed),
      locked:   rewards.filter(r => totalBalance <  r.credits_needed),
    };
  }, [rewards, totalBalance]);

  // ── Claim handler (same UX as pastel version — Alert for now) ───────────
  const handleClaim = (reward: StoreReward) => {
    if (isChildPreview) return;
    if (totalBalance < reward.credits_needed) {
      Alert.alert(
        t('childRewards.notEnoughTitle'),
        t('childRewards.notEnoughMsg', {
          count: reward.credits_needed - totalBalance,
          title: reward.title,
        }),
      );
    } else {
      Alert.alert(
        t('childRewards.claimTitle'),
        t('childRewards.claimMsg', { title: reward.title }),
      );
    }
  };

  // ── Subscription gate ────────────────────────────────────────────────────
  // Child viewers (real child or parent-in-preview-as-child) see a calm
  // gamer-styled "ask your parent" empty state instead of the payment CTA.
  if (!isSubscribed) {
    if (isChildViewer) {
      return (
        <View style={[styles.canvas, styles.lockedShop]}>
          <Text style={styles.lockedShopEmoji}>🎁</Text>
          <Text style={styles.lockedShopTitle}>
            {t('childLockedState.shopTitleGamer')}
          </Text>
          <Text style={styles.lockedShopSub}>
            {t('childLockedState.shopSubGamer')}
          </Text>
        </View>
      );
    }
    return <PaywallContent childName={profile?.display_name ?? ''} />;
  }

  // ── Pause active: short-circuit ──────────────────────────────────────────
  if (isPauseActive) {
    return (
      <SafeAreaView style={styles.canvas} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <PauseEmptyState />
        </ScrollView>
        <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
      </SafeAreaView>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.canvas} edges={['top']}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.lime} />
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.canvas} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t('gamerRewards.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('gamerRewards.subtitle')}</Text>
          </View>
          <View style={styles.buffsBadge}>
            <Text style={styles.buffsValue}>💎 {totalBalance.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── Tab switcher ─────────────────────────────────────────────── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'parent' && styles.tabActive]}
            onPress={() => setTab('parent')}
          >
            <Text style={[styles.tabText, tab === 'parent' && styles.tabTextActive]}>
              {t('gamerRewards.tab.parent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'buddy' && styles.tabActive]}
            onPress={() => setTab('buddy')}
          >
            <Text style={[styles.tabText, tab === 'buddy' && styles.tabTextActive]}>
              {t('gamerRewards.tab.buddy')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Content ──────────────────────────────────────────────────── */}
        {tab === 'parent' ? (
          <>
            {rewards.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyTitle}>{t('gamerRewards.emptyParentTitle')}</Text>
                <Text style={styles.emptySubtitle}>{t('gamerRewards.emptyParentSubtitle')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionHeader}>{t('gamerRewards.parentSectionTitle')}</Text>
                <Text style={styles.sectionSubtitle}>{t('gamerRewards.parentSectionSubtitle')}</Text>

                {/* 2-column grid */}
                <View style={styles.grid}>
                  {/* Unlocked first, then locked — matches "actionable items first" UX */}
                  {[...unlocked, ...locked].map(reward => {
                    const isUnlocked = totalBalance >= reward.credits_needed;
                    const progressPct = isUnlocked
                      ? 100
                      : Math.min(100, Math.round((totalBalance / reward.credits_needed) * 100));
                    const toGo = isUnlocked ? 0 : reward.credits_needed - totalBalance;

                    return (
                      <View
                        key={reward.id}
                        style={[
                          styles.card,
                          isUnlocked ? styles.cardUnlocked : styles.cardLocked,
                        ]}
                      >
                        <Text style={styles.cardEmoji}>{reward.emoji || '🎁'}</Text>
                        <Text
                          style={[styles.cardTitle, !isUnlocked && { opacity: 0.7 }]}
                          numberOfLines={2}
                        >
                          {reward.title}
                        </Text>
                        <Text style={[
                          styles.cardCost,
                          { color: isUnlocked ? COLORS.lime : COLORS.textMuted },
                        ]}>
                          💎 {reward.credits_needed}
                        </Text>

                        {isUnlocked ? (
                          <TouchableOpacity
                            style={styles.redeemBtn}
                            onPress={() => handleClaim(reward)}
                            disabled={isChildPreview}
                          >
                            <Text style={styles.redeemBtnText}>{t('gamerRewards.redeem')}</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                            </View>
                            <Text style={styles.cardToGo}>
                              {t('gamerRewards.toGo', { count: toGo })}
                            </Text>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Suggest CTA */}
            <View style={styles.suggestRow}>
              <TouchableOpacity
                style={styles.suggestBtn}
                onPress={() => { /* TODO: hook into reward-suggest flow when designed */ }}
                disabled={isChildPreview}
              >
                <Ionicons name="add" size={18} color={COLORS.textMuted} />
                <Text style={styles.suggestText}>{t('gamerRewards.suggestReward')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // FROM BUDDY tab — boosters system not yet implemented (BUDDY V0 scope)
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonEmoji}>⚡</Text>
            <Text style={styles.comingSoonTitle}>{t('gamerRewards.boostersTitle')}</Text>
            <Text style={styles.comingSoonSubtitle}>{t('gamerRewards.boostersSubtitle')}</Text>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonPillText}>{t('gamerRewards.comingSoon')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <WelcomeBackModal visible={welcomeBack.visible} onDismiss={welcomeBack.dismiss} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  canvas:  { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingBottom: 60 },

  // ── Header ────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle:    { color: COLORS.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  buffsBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buffsValue: { color: COLORS.lime, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // ── Tab switcher ──────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.lime },
  tabText:   {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabTextActive: { color: COLORS.text },

  // ── Section header ────────────────────────────────────────────────────
  sectionHeader: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },

  // ── Grid ──────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardUnlocked: {
    borderColor: COLORS.borderActive,
    shadowColor: COLORS.lime,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  cardLocked: {
    borderColor: COLORS.border,
    opacity: 0.85,
  },
  cardEmoji: { fontSize: 36, marginBottom: 8 },
  cardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 32,           // 2 lines of breathing room
  },
  cardCost: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  redeemBtn: {
    backgroundColor: COLORS.lime,
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  redeemBtnText: {
    color: COLORS.canvas,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.canvas,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.lime,
    opacity: 0.5,
    borderRadius: 3,
  },
  cardToGo: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },

  // ── Empty state ───────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },

  // ── Suggest CTA ───────────────────────────────────────────────────────
  suggestRow: { alignItems: 'center', marginTop: 28 },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── FROM BUDDY (coming-soon stub) ─────────────────────────────────────
  comingSoonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  comingSoonEmoji:    { fontSize: 48, marginBottom: 12 },
  comingSoonTitle:    { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  comingSoonSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 16,
  },
  comingSoonPill: {
    backgroundColor: COLORS.limeGlow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderActive,
  },
  comingSoonPillText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  lockedShop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockedShopEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  lockedShopTitle: {
    color: COLORS.lime,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  lockedShopSub: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
