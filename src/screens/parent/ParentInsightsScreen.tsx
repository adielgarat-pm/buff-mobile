/**
 * ParentInsightsScreen — the rich, data-real Parent Insights screen (BUFF Premium).
 *
 * Replaces the thin single dashboard card. Composes the layers from DESIGN.md §4,
 * top → bottom:
 *   [A] wellbeing gesture (if paused / low-vibe / lapsed — reuses recommendationEngine)
 *   [B] weekly framing card (real active-day count, real week-over-week, a CTA)
 *   [D] highlights (strongest phase + most-active window)
 *   [C] ONE tip — reward-loop health (C0) first, else a targeted completion tip
 *   [D] weekly map (7 active/rest dots)
 *   [B] reinforcement message + CTA
 *
 * Every number is REAL (no Math.random week-over-week). "Active day" comes from
 * the ONE shared rule (successDay.ts) aligned with the BUDDY EOD. CTAs reuse the
 * dashboard's existing levers (sticker / bonus / med sheets, rewards tab) via
 * navigation params — no duplicated action logic. Premium-gated.
 */
import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useParentInsights } from '../../hooks/useParentInsights';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';
import { useRewardLoopHealth } from '../../hooks/useRewardLoopHealth';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useDailyVibe } from '../../hooks/useDailyVibe';
import { useTaskTimeline } from '../../hooks/useTaskTimeline';
import { TaskTimelineSection } from '../../components/TaskTimelineSection';
import { useSmartInsights } from '../../hooks/useSmartInsights';
import { useAutoCoachInsight } from '../../hooks/useAutoCoachInsight';
import { useInsightViewLog } from '../../hooks/useInsightViewLog';
import { useAuth } from '../../contexts/AuthContext';
import { logOnboardingEvent } from '../../lib/onboardingFunnel';
import {
  selectInsightFraming,
  type InsightCtaType,
  type TargetedTipSignals,
} from '../../utils/insightFraming';
import { PHASES, type Phase } from '../../types/phase';

type Nav   = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ParentInsights'>;

// Category-completion thresholds for the targeted tips (DESIGN §3 Layer C).
const HOMEWORK_LOW = 50;
const SELFCARE_LOW = 50;
const PHASE_LOW    = 50;

export default function ParentInsightsScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { t, i18n } = useTranslation();
  const { isSubscribed, hasRealEntitlement } = useSubscription();

  const { children, loading: childrenLoading } = useChildrenDashboard();

  // Default to the routed child, else the first child. A simple selector lets a
  // multi-kid parent switch (full multi-child comparison is out of scope).
  const [selectedId, setSelectedId] = useState<string | null>(route.params?.childId ?? null);
  const activeChild = children.find(c => c.childId === selectedId) ?? children[0] ?? null;
  const childId     = activeChild?.childId ?? null;
  const childName   = activeChild?.displayName ?? '';
  const firstName   = childName.split(' ')[0];

  const { stats, loading: weeklyLoading }       = useWeeklyStats(childId);
  const { phaseInsights, categoryStats, cachedFraming, loading: insightsLoading } = useParentInsights(childId);
  const { signals: rewardSignals }              = useRewardLoopHealth(childId, stats.activeDays > 0);

  // Layer A signals (reuse, don't duplicate).
  const { isPauseActive, fridayEnabled } = useAppSettings();
  const { isLowPower }                   = useDailyVibe(childId);

  const {
    rows: timelineRows,
    categorySummaries,
    hasWeekendPattern,
    loading: timelineLoading,
  } = useTaskTimeline(childId, fridayEnabled);

  const {
    smartInsight,
    computedAt,
    parentContext,
    setParentContext,
    generating,
    generate: generateSmartInsight,
    error: smartError,
    generationsLeft,
    totalCount: coachTotalCount,
    loadingState: smartLoading,
    userVote,
    submitVote,
  } = useSmartInsights(childId);

  // Lazy auto-generate (Phase E, option א) — shared guards live in
  // useAutoCoachInsight (also used by the Parent Dashboard card, which is now
  // the primary surface for the coach insight — pkg/dashboard-ai-insight).
  useAutoCoachInsight({
    childId,
    smartInsight,
    computedAt,
    loadingState: smartLoading,
    generating,
    generationsLeft,
    hasRealEntitlement,
    activeDays: stats.activeDays,
    totalCount: coachTotalCount,
    generate: generateSmartInsight,
  });

  // Same render-vs-generate distinction as the dashboard card. `visible` must
  // mirror what actually reaches the screen: this component early-returns a
  // locked view for a non-subscriber (below), so a free parent with a taste
  // insight never sees the card here — counting it would inflate View Rate.
  const { familyId } = useAuth();
  useInsightViewLog({
    familyId,
    childId,
    computedAt,
    visible:   isSubscribed && !!smartInsight,
    placement: 'insights_screen',
  });

  // ── Highlights (Layer D) ───────────────────────────────────────────────────
  const sortedPhases = useMemo(
    () => [...phaseInsights].filter(p => p.taskCount > 0).sort((a, b) => b.avgCompletionRate - a.avgCompletionRate),
    [phaseInsights],
  );
  const bestPhase = sortedPhases[0] ?? null;
  const mostActivePhase = useMemo(() => {
    let top: { phase: Phase; completions: number } | null = null;
    for (const p of phaseInsights) {
      const completions = Math.round((p.avgCompletionRate / 100) * p.taskCount);
      if (!top || completions > top.completions) top = { phase: p.phase, completions };
    }
    return top?.phase ?? null;
  }, [phaseInsights]);

  // ── Targeted-tip signals (by category, NOT title keyword — see DESIGN) ──────
  // NOTE (v1 limitation, flagged to Adi): meds tasks are stored as category
  // 'self-care' (MedReminderSheet), with no medication category or strategy_id,
  // so meds and hygiene are structurally indistinguishable. Until meds get a
  // dedicated tag, C1 (meds) folds into the self-care tip — we do NOT fall back
  // to fragile title-keyword matching. homework = category 'learning'.
  const weakestPhase = sortedPhases.length
    ? sortedPhases[sortedPhases.length - 1]
    : null;
  const tipSignals: TargetedTipSignals = {
    medsLow:         false,
    homeworkLow:     (categoryStats.learning?.rate ?? 100) < HOMEWORK_LOW,
    hygieneLow:      (categoryStats['self-care']?.rate ?? 100) < SELFCARE_LOW,
    weakestPhaseKey: weakestPhase && weakestPhase.avgCompletionRate < PHASE_LOW
      ? `${weakestPhase.phase}-low`
      : null,
  };

  const liveFraming = useMemo(
    () => selectInsightFraming({
      activeDays:   stats.activeDays,
      daysWithData: stats.daysWithData,
      reward:       rewardSignals,
      tips:         tipSignals,
    }),
    [stats.activeDays, stats.daysWithData, rewardSignals, tipSignals],
  );

  // Prefer server-computed framing (pg_cron, richer data) over the client
  // real-time fallback. cachedFraming is null until the DB row loads.
  const framing = cachedFraming ?? liveFraming;

  // ── CTA router — reuse existing levers, no duplicated logic ────────────────
  const runCta = (ctaType: InsightCtaType) => {
    if (!childId) return;
    switch (ctaType) {
      case 'send-bonus':
        navigation.navigate('ParentApp', { screen: 'ParentDashboard', params: { openSheet: 'bonus', sheetChildId: childId } });
        break;
      case 'send-sticker':
        navigation.navigate('ParentApp', { screen: 'ParentDashboard', params: { openSheet: 'sticker', sheetChildId: childId } });
        break;
      case 'set-anchor':
        navigation.navigate('ParentApp', { screen: 'ParentDashboard', params: { openSheet: 'med', sheetChildId: childId } });
        break;
      case 'open-rewards':
        navigation.navigate('ParentApp', { screen: 'ParentRewards', params: { childId } });
        break;
      case 'start-conversation': // soft nudge — the action is the IRL talk; no lever.
      case 'none':
      default:
        break;
    }
  };

  const ctaLabel = (ctaType: InsightCtaType): string | null => {
    switch (ctaType) {
      case 'send-bonus':         return t('insights.weekly.cta.bonus');
      case 'send-sticker':       return t('insights.weekly.cta.sticker');
      case 'set-anchor':         return t('insights.weekly.cta.anchor');
      case 'open-rewards':       return t('insights.weekly.cta.rewards');
      case 'start-conversation': return t('insights.weekly.cta.conversation');
      default:                   return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const loading = childrenLoading || weeklyLoading || insightsLoading;

  const Header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={[styles.back, { color: T.accent }]}>‹ {t('insights.screen.back')}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: T.text }]}>
        {t('insights.screen.title')}{firstName ? ` · ${firstName}` : ''}
      </Text>
      <View style={{ width: 48 }} />
    </View>
  );

  // Defense-in-depth: the entry is already gated, but never render premium
  // content to a non-subscriber who reaches here some other way.
  if (!isSubscribed) {
    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        {Header}
        <View style={styles.centered}>
          <Text style={styles.lockedIcon}>📊</Text>
          <Text style={[styles.lockedTitle, { color: T.text }]}>{t('dashboard.insightsPremiumTitle')}</Text>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: T.accent }]}
            onPress={() => navigation.navigate('Paywall', { childName: firstName || undefined })}
          >
            <Text style={styles.ctaText}>{t('dashboard.insightsPremiumHint')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        {Header}
        <View style={styles.centered}><ActivityIndicator color={T.accent} size="large" /></View>
      </View>
    );
  }

  if (!childId) {
    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        {Header}
        <View style={styles.centered}>
          <Text style={[styles.lockedTitle, { color: T.textMuted }]}>{t('insights.weekly.comingSoon.headline')}</Text>
        </View>
      </View>
    );
  }

  // Layer A1 — paused: calm state, suppress all metrics/pressure.
  if (isPauseActive) {
    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        {Header}
        <View style={styles.centered}>
          <Text style={styles.lockedIcon}>🌿</Text>
          <Text style={[styles.lockedTitle, { color: T.text }]}>{t('insights.weekly.paused.title')}</Text>
          <Text style={[styles.pausedMsg, { color: T.textMuted }]}>{t('insights.weekly.paused.message')}</Text>
        </View>
      </View>
    );
  }

  const { weekly, tip } = framing;
  const restDays = stats.thisWeek.filter(d => !d.isActive).length;
  const cta = ctaLabel(weekly.ctaType);

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      {Header}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Child selector (only when more than one child) */}
        {children.length > 1 && (
          <View style={styles.childRow}>
            {children.map(c => {
              const on = c.childId === childId;
              return (
                <TouchableOpacity
                  key={c.childId}
                  onPress={() => setSelectedId(c.childId)}
                  style={[styles.childChip, { borderColor: on ? T.accent : T.cardBorder, backgroundColor: on ? T.accent : T.card }]}
                >
                  <Text style={[styles.childChipText, { color: on ? '#fff' : T.text }]}>{c.avatar} {c.displayName.split(' ')[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Layer A2/A3 — wellbeing gesture above the metrics (low vibe today) */}
        {isLowPower && (
          <TouchableOpacity
            style={[styles.gestureCard]}
            onPress={() => runCta('send-sticker')}
            activeOpacity={0.85}
          >
            <Text style={styles.gestureIcon}>💜</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.gestureTitle}>{t('insights.weekly.lowVibe.title', { name: firstName })}</Text>
              <Text style={styles.gestureCta}>{t('insights.weekly.cta.sticker')} →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Layer B — weekly framing card */}
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
          {weekly.isEmpty ? (
            <>
              <Text style={[styles.weeklyHeadline, { color: T.text }]}>{t('insights.weekly.comingSoon.headline')}</Text>
              <Text style={[styles.weeklyMsg, { color: T.textMuted }]}>{t('insights.weekly.comingSoon.message', { name: firstName })}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.weeklyHeadline, { color: T.text }]}>
                {t(`insights.weekly.${weekly.i18nKey}.headline`, { name: firstName })}
              </Text>

              {/* active / rest counters + real week-over-week badge */}
              <View style={styles.countersRow}>
                <View style={[styles.counter, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.counterNum}>{stats.activeDays}</Text>
                  <Text style={styles.counterLabel}>{t('insights.weekly.activeDays')}</Text>
                </View>
                <View style={[styles.counter, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.counterNum, { color: T.textMuted }]}>{restDays}</Text>
                  <Text style={styles.counterLabel}>{t('insights.weekly.restDays')}</Text>
                </View>
              </View>

              {stats.weekOverWeek !== null && stats.weekOverWeek !== 0 && (
                <Text style={[styles.wow, { color: stats.weekOverWeek > 0 ? T.success : T.textMuted }]}>
                  {stats.weekOverWeek > 0 ? '↑' : '↓'} {t('insights.weekly.weekOverWeek', { count: Math.abs(stats.weekOverWeek) })}
                </Text>
              )}

              <Text style={[styles.weeklyMsg, { color: T.text }]}>
                {t(`insights.weekly.${weekly.i18nKey}.message`, {
                  name: firstName,
                  count: stats.activeDays,
                  phase: bestPhase ? t(`phase.${bestPhase.phase}`) : '',
                })}
              </Text>

              {cta && (
                <TouchableOpacity style={[styles.cta, { backgroundColor: T.accent }]} onPress={() => runCta(weekly.ctaType)}>
                  <Text style={styles.ctaText}>{cta}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Layer D — highlights */}
        {!weekly.isEmpty && (bestPhase || mostActivePhase) && (
          <View style={styles.highlightsRow}>
            {bestPhase && (
              <View style={[styles.highlight, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                <Text style={styles.highlightLabel}>🏆 {t('insights.weekly.highlights.strongest')}</Text>
                <Text style={[styles.highlightValue, { color: T.text }]}>
                  {PHASES.find(p => p.id === bestPhase.phase)?.icon} {t(`phase.${bestPhase.phase}`)}
                </Text>
                <Text style={[styles.highlightSub, { color: T.success }]}>
                  {Math.round(bestPhase.avgCompletionRate)}% {t('insights.weekly.consistency')}
                </Text>
              </View>
            )}
            {mostActivePhase && (
              <View style={[styles.highlight, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                <Text style={styles.highlightLabel}>⏰ {t('insights.weekly.highlights.mostActive')}</Text>
                <Text style={[styles.highlightValue, { color: T.text }]}>
                  {PHASES.find(p => p.id === mostActivePhase)?.icon} {t(`phase.${mostActivePhase}`)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Layer C0 / C — the single tip */}
        {tip && (
          <View style={[styles.tipCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
            <Text style={styles.tipHeader}>💬 {t('insights.weekly.tip.title')}</Text>
            <Text style={[styles.tipBody, { color: T.text }]}>
              {tip.layer === 'C0'
                ? t(tip.i18nKey, { name: firstName })
                : t(`${tip.i18nKey}.suggestion`)}
            </Text>
            {ctaLabel(tip.ctaType) && (
              tip.ctaType === 'start-conversation' ? (
                // Coaching tip — the move is the IRL talk, so this is a soft,
                // non-tappable nudge rather than an in-app action button.
                <Text style={[styles.tipConversation, { color: T.textMuted }]}>{ctaLabel(tip.ctaType)}</Text>
              ) : (
                <TouchableOpacity style={[styles.tipCta]} onPress={() => runCta(tip.ctaType)}>
                  <Text style={[styles.tipCtaText, { color: T.accent }]}>{ctaLabel(tip.ctaType)} →</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {/* Smart Insight — LLM-generated (Premium), shown when generated */}
        {smartInsight && (
          <View style={[styles.smartCard, { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD' }]}>
            <View style={styles.smartBadgeRow}>
              <View style={styles.smartBadge}>
                <Text style={styles.smartBadgeText}>{t('insights.smart.badge')}</Text>
              </View>
              {/* "Valid as of" stamp — an insight stays valid until the next one
                  is computed (D: Adi 2026-07-14), so always say when it was. */}
              {computedAt && (
                <Text style={[styles.smartAsOf, { color: T.textMuted }]}>
                  {t('insights.smart.asOf', {
                    date: new Date(computedAt).toLocaleDateString(
                      i18n.language?.startsWith('he') ? 'he-IL' : 'en-US',
                      { month: 'short', day: 'numeric' },
                    ),
                  })}
                </Text>
              )}
            </View>
            <Text style={[styles.smartHeadline, { color: '#4C1D95' }]}>{smartInsight.headline}</Text>
            <Text style={[styles.smartMessage,  { color: T.text   }]}>{smartInsight.message}</Text>
            <View style={styles.smartActionRow}>
              <Text style={styles.smartActionIcon}>→</Text>
              <Text style={[styles.smartAction, { color: '#6D28D9' }]}>{smartInsight.action}</Text>
            </View>
            {smartInsight.cta_type && smartInsight.cta_type !== 'none' && ctaLabel(smartInsight.cta_type as any) && (
              // start-conversation has no in-app lever — the IRL talk IS the action.
              // Render it as quiet text (like the tip card), never as a dead button
              // (Adi, 2026-07-17: "looks clickable but does nothing").
              smartInsight.cta_type === 'start-conversation' ? (
                <Text style={[styles.tipConversation, { color: T.textMuted, marginTop: 4 }]}>
                  💬 {ctaLabel(smartInsight.cta_type as any)}
                </Text>
              ) : (
                <TouchableOpacity
                  style={[styles.cta, { backgroundColor: '#7C3AED', marginTop: 4 }]}
                  onPress={() => {
                    // Logged here, not inside runCta — runCta is shared with the
                    // rule-based weekly/tip cards, which are not AI insights.
                    void logOnboardingEvent({
                      familyId,
                      childId,
                      eventType: 'insight_cta_clicked',
                      source:    'insights_screen',
                      variant:   smartInsight.cta_type,
                    });
                    runCta(smartInsight.cta_type as any);
                  }}
                >
                  <Text style={styles.ctaText}>{ctaLabel(smartInsight.cta_type as any)}</Text>
                </TouchableOpacity>
              )
            )}
            {/* 👍 👎 feedback row */}
            <View style={styles.voteRow}>
              <Text style={[styles.voteLabel, { color: T.textMuted }]}>
                {t('insights.smart.voteLabel')}
              </Text>
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  onPress={() => submitVote(1)}
                  style={[styles.voteBtn, userVote === 1 && styles.voteBtnActive]}
                >
                  <Text style={styles.voteEmoji}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => submitVote(-1)}
                  style={[styles.voteBtn, userVote === -1 && styles.voteBtnActive]}
                >
                  <Text style={styles.voteEmoji}>👎</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Parent context input — "מה כדאי שנדע על השבוע שהיה?" */}
        {isSubscribed && (
          <View style={[styles.contextCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
            <Text style={[styles.contextLabel, { color: T.text }]}>
              {t('insights.smart.contextLabel')}
            </Text>
            <Text style={[styles.contextHint, { color: T.textMuted }]}>
              {t('insights.smart.contextHint')}
            </Text>
            <TextInput
              style={[styles.contextInput, { color: T.text, borderColor: T.cardBorder }]}
              value={parentContext}
              onChangeText={setParentContext}
              placeholder={t('insights.smart.contextPlaceholder')}
              placeholderTextColor={T.textMuted}
              maxLength={140}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <View style={styles.generateRow}>
              <TouchableOpacity
                style={[
                  styles.cta,
                  { backgroundColor: (generating || generationsLeft === 0) ? '#9CA3AF' : '#7C3AED', marginTop: 4, flex: 1 },
                ]}
                onPress={generateSmartInsight}
                disabled={generating || generationsLeft === 0}
              >
                {generating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.ctaText}>
                      {t('insights.smart.generateCta')}
                    </Text>
                }
              </TouchableOpacity>
              <View style={styles.quotaBadge}>
                <Text style={[styles.quotaText, { color: generationsLeft === 0 ? '#DC2626' : T.textMuted }]}>
                  {generationsLeft}/3
                </Text>
                <Text style={[styles.quotaLabel, { color: T.textMuted }]}>
                  {t('insights.smart.quotaThisWeek')}
                </Text>
              </View>
            </View>
            {smartError && (
              <Text style={styles.smartErrorText}>
                {smartError === 'premium'    ? t('insights.smart.errorPremium')
                : smartError === 'rate-limit' ? t('insights.smart.errorRateLimit')
                : t('insights.smart.errorGeneric')}
              </Text>
            )}
          </View>
        )}

        {/* Layer D — weekly map */}
        {!weekly.isEmpty && (
          <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
            <Text style={[styles.mapTitle, { color: T.text }]}>{t('insights.weekly.map.title')}</Text>
            <View style={styles.mapRow}>
              {stats.thisWeek.map(day => (
                <View key={day.date} style={styles.mapDay}>
                  <View style={[styles.mapDot, { backgroundColor: day.isActive ? '#FEF3C7' : '#F3F4F6' }]}>
                    <Text style={styles.mapEmoji}>{day.isActive ? '🔥' : '💤'}</Text>
                  </View>
                  <Text style={[styles.mapDayLabel, { color: T.textMuted }]}>{t(day.dayKey)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              <Text style={[styles.legend, { color: T.textMuted }]}>🔥 {t('insights.weekly.activeDayLabel')}</Text>
              <Text style={[styles.legend, { color: T.textMuted }]}>💤 {t('insights.weekly.restDayLabel')}</Text>
            </View>
          </View>
        )}

        {/* Task timeline — 14-day per-task grid, grouped by category */}
        {!timelineLoading && timelineRows.length > 0 && (
          <TaskTimelineSection
            rows={timelineRows}
            categorySummaries={categorySummaries}
            hasWeekendPattern={hasWeekendPattern}
            fridayEnabled={fridayEnabled}
          />
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
  },
  back:  { fontSize: 16, fontWeight: '600', width: 64 },
  title: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },

  childRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  childChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  childChipText: { fontSize: 14, fontWeight: '600' },

  gestureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FDF2F8', borderColor: '#FBCFE8', borderWidth: 1,
    borderRadius: 16, padding: 16,
  },
  gestureIcon:  { fontSize: 28 },
  gestureTitle: { fontSize: 15, fontWeight: '700', color: '#9D174D' },
  gestureCta:   { fontSize: 13, fontWeight: '600', color: '#BE185D', marginTop: 2 },

  card: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  weeklyHeadline: { fontSize: 18, fontWeight: '800' },
  weeklyMsg:      { fontSize: 14, lineHeight: 20 },

  countersRow: { flexDirection: 'row', gap: 10 },
  counter:     { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  counterNum:  { fontSize: 24, fontWeight: '800', color: '#B45309' },
  counterLabel:{ fontSize: 12, color: '#6B7280', marginTop: 2 },
  wow:         { fontSize: 13, fontWeight: '700' },

  cta:     { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  highlightsRow: { flexDirection: 'row', gap: 10 },
  highlight:     { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  highlightLabel:{ fontSize: 12, color: '#6B7280' },
  highlightValue:{ fontSize: 15, fontWeight: '700' },
  highlightSub:  { fontSize: 12, fontWeight: '600' },

  tipCard:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  tipHeader:  { fontSize: 13, fontWeight: '700', color: '#6D28D9' },
  tipBody:    { fontSize: 14, lineHeight: 20 },
  tipCta:          { marginTop: 2 },
  tipCtaText:      { fontSize: 14, fontWeight: '700' },
  tipConversation: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  mapTitle: { fontSize: 15, fontWeight: '700' },
  mapRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  mapDay:   { alignItems: 'center', gap: 4 },
  mapDot:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mapEmoji: { fontSize: 16 },
  mapDayLabel: { fontSize: 10 },
  legendRow:{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 4 },
  legend:   { fontSize: 12 },

  scrollView:  { flex: 1 },
  lockedIcon:  { fontSize: 40 },
  lockedTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  pausedMsg:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Smart Insight card
  smartCard:        { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 10 },
  smartBadgeRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smartAsOf:        { fontSize: 11 },
  smartBadge:       { backgroundColor: '#7C3AED', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  smartBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  smartHeadline:    { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  smartMessage:     { fontSize: 14, lineHeight: 21 },
  smartActionRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  smartActionIcon:  { fontSize: 14, color: '#7C3AED', fontWeight: '700', marginTop: 1 },
  smartAction:      { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  // Vote row (👍👎)
  voteRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#DDD6FE' },
  voteLabel:    { fontSize: 12 },
  voteButtons:  { flexDirection: 'row', gap: 8 },
  voteBtn:      { padding: 6, borderRadius: 8, backgroundColor: 'transparent' },
  voteBtnActive:{ backgroundColor: '#EDE9FE' },
  voteEmoji:    { fontSize: 20 },

  // Parent context input card
  contextCard:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  contextLabel:   { fontSize: 15, fontWeight: '700' },
  contextHint:    { fontSize: 12, marginTop: -4 },
  contextInput:   { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, minHeight: 64, marginTop: 4 },
  generateRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4 },
  quotaBadge:     { alignItems: 'center', paddingBottom: 2 },
  quotaText:      { fontSize: 15, fontWeight: '800' },
  quotaLabel:     { fontSize: 10, marginTop: -2 },
  smartErrorText: { fontSize: 13, color: '#DC2626', textAlign: 'center', marginTop: 4 },
});
