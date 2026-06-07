/**
 * UStep5_Preview — "[name]'s plan is ready!"
 *
 * On mount (saveAll):
    . INSERT child profile into profiles → get back childProfileId
 *   2. INSERT tasks using childProfileId
 *   3. INSERT rewards into store_rewards using childProfileId
 *      (non-fatal if table doesn't exist yet)
 *
 * Both CTA and Skip navigate to UStep7_Phone, carrying childProfileId forward.
 */
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  Animated, I18nManager, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { ONBOARDING_CONFIG } from '../../../config/onboardingConfig';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../integrations/supabase/client';
import {
  REWARD_PICKS,
  FALLBACK_REWARDS,
  calcRewardCreditsDefault,
} from './onboardingData';
import type { AgeGroup } from './onboardingData';
import { generateStarterTasks } from './starterTasks';
import { pickLang, bilingualForDb, resolveChildLang } from '../../../lib/i18nString';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep5_Preview'>;
type Route = RouteProp<RootStackParamList, 'UStep5_Preview'>;

const STEP = 4; const TOTAL = 6;
const TAG  = '[UStep5_Preview]';

const SIZE_LABEL: Record<string, string> = { small: '3d', medium: '7d', large: '14d' };

export default function UStep5_Preview() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t, i18n } = useTranslation();
  const { familyId, user } = useAuth();

  const lang  = i18n.language.startsWith('he') ? 'he' : 'en';
  // Per-child language. At onboarding the profile doesn't exist yet, so this
  // is the name-script default (Hebrew name → Hebrew, Latin → English, falling
  // back to the device language for a nameless child). It is BOTH persisted to
  // pro_settings.language below AND used to bake the task titles, so the stored
  // field is the single source of truth that EditChild and the child's own
  // device later read back via resolveChildLang.
  const childLang = resolveChildLang({ display_name: params.childName }, lang);
  const isRTL = I18nManager.isRTL;

  const [saveErr,        setSaveErr]        = useState<string | null>(null);
  const [childProfileId, setChildProfileId] = useState<string | null>(null);
  const hasSaved = useRef(false);

  // Starter-task engine: age + clinical-presentation-aware selection across the
  // child's main + additional challenges. Replaces the old positional logic
  // (STARTER_TASKS_BY_CHALLENGE.slice + TASK_TIMES[index]). Each task carries its
  // own time (from timeOfDay → HH:MM) and category, fixing the bug where list
  // position decided the clock time. Deterministic — see starterTasks/.
  const tasks = generateStarterTasks({
    ageGroup:             params.ageGroup,
    gender:               params.gender,
    mainChallenge:        params.mainChallenge,
    additionalChallenges: params.additionalChallenges,
  });

  // motivators is an array (1 or 2). Pick rewards from each motivator's list,
  // one per motivator, so the selection feels personal.
  const buildRewards = () => {
    const motivators = params.motivators ?? [];
    if (motivators.length === 0) return FALLBACK_REWARDS.slice(0, ONBOARDING_CONFIG.DEFAULT_REWARDS_COUNT);

    const perMotivator = Math.ceil(ONBOARDING_CONFIG.DEFAULT_REWARDS_COUNT / motivators.length);
    const combined = motivators.flatMap(motivatorId => {
      const picks = (REWARD_PICKS[motivatorId] as Record<AgeGroup, typeof FALLBACK_REWARDS> | undefined)
        ?.[params.ageGroup] ?? FALLBACK_REWARDS;
      return picks.slice(0, perMotivator);
    });
    return combined.slice(0, ONBOARDING_CONFIG.DEFAULT_REWARDS_COUNT);
  };
  const rewards = buildRewards();

  // ── Staggered fade-in animations ──────────────────────────────────────────
  const totalCards = tasks.length + rewards.length;
  const anims = useRef(
    Array.from({ length: totalCards }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      ONBOARDING_CONFIG.CARD_STAGGER_MS,
      anims.map(anim =>
        Animated.timing(anim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        })
      )
    ).start();
  }, [anims]);

  // ── Save to Supabase on first mount ───────────────────────────────────────
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    saveAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Friendly duplicate-name confirmation. Fires when create_child_profile
  // reports an existing ACTIVE same-name child in this family. Positive-coaching
  // tone: the parent likely thinks the first add failed (empty dashboard / weak
  // feedback) — we reassure that the child already exists and offer to open
  // them, rather than silently creating a second profile (which also breaks the
  // child's family-code login by making two same-name profiles pickable).
  const promptDuplicate = (existingName: string) => {
    Alert.alert(
      t('onboarding.step5.duplicateTitle', { name: existingName }),
      t('onboarding.step5.duplicateBody', { name: existingName }),
      [
        {
          text: t('onboarding.step5.duplicateOpen', { name: existingName }),
          onPress: () => navigation.navigate('ParentApp', { screen: 'ParentTasks' }),
        },
        {
          text: t('onboarding.step5.duplicateAddAnyway'),
          onPress: () => { hasSaved.current = true; saveAll(true); },
        },
        {
          text: t('onboarding.step5.duplicateCancel'),
          style: 'cancel',
          // Return to the parent app, NOT navigation.goBack(): the previous
          // screen in the add-child stack is the transient "Building plan"
          // loading screen, which doesn't re-advance and would strand the
          // parent. Exit cleanly to the parent Tasks tab instead.
          onPress: () => navigation.navigate('ParentApp', { screen: 'ParentTasks' }),
        },
      ],
      { cancelable: true },
    );
  };

  const saveAll = async (force = false) => {
    console.log(`${TAG} saveAll started (force=${force})`);
    console.log(`${TAG} familyId=${familyId ?? 'null'}, user=${user?.id ?? 'null'}`);

    if (!familyId || !user) {
      console.warn(`${TAG} Missing familyId or user — cannot save`);
      setSaveErr('Missing account data. Please restart the app.');
      return;
    }

    try {
      // ── 1. Resolve child profile ─────────────────────────────────────────
      // Empty-state re-entry (params.existingChildId set): attach tasks/rewards
      // to the existing child instead of creating a new profile. This is the
      // duplicate-profile guard — see IN-2026-05-14-03.
      let id: string;

      if (params.existingChildId) {
        id = params.existingChildId;
        console.log(`${TAG} [1/3] Reusing existing child profile — childProfileId: ${id} (skipping insert)`);
        setChildProfileId(id);
      } else {
        console.log(`${TAG} [1/3] Creating child profile for "${params.childName}" (force=${force})...`);

        // pro_settings mirrors the previous direct-insert payload. The profile
        // insert now happens INSIDE the create_child_profile RPC, so the
        // same-name duplicate check and the insert are one atomic transaction
        // (no client-side check-then-insert race). The RPC derives family_id +
        // parent authorization server-side, and the existing AFTER INSERT
        // triggers still seed buddy_relationships + default tasks/rewards +
        // credit_vault within the same statement.
        const proSettings = {
          age_group:  params.ageGroup,
          gender:     params.gender    ?? null,
          birth_date: params.birthDate ?? null,
          language:   childLang,        // per-child language (parent-editable later)
          onboarding_data: {
            mainChallenge:        params.mainChallenge,
            additionalChallenges: params.additionalChallenges,
            motivators:           params.motivators,
          },
        };

        const { data: rpcData, error: rpcErr } = await supabase.rpc('create_child_profile', {
          p_display_name: params.childName,
          p_pro_settings: proSettings as never,
          p_force:        force,
        });

        if (rpcErr) {
          console.error(`${TAG} [1/3] create_child_profile FAILED:`, rpcErr.message);
          throw new Error(rpcErr.message);
        }

        const res = rpcData as {
          status: 'created' | 'duplicate' | 'error';
          child_id?: string;
          existing_child_id?: string;
          existing_child_name?: string;
          reason?: string;
        };

        if (res?.status === 'duplicate') {
          console.log(`${TAG} [1/3] Duplicate active child "${res.existing_child_name}" — prompting parent`);
          promptDuplicate(res.existing_child_name ?? params.childName);
          return; // parent decides via dialog: open existing / add anyway / cancel
        }

        if (res?.status !== 'created' || !res.child_id) {
          console.error(`${TAG} [1/3] create_child_profile rejected:`, res?.reason);
          throw new Error(res?.reason ?? 'Profile creation failed');
        }

        id = res.child_id;
        console.log(`${TAG} [1/3] Profile create SUCCESS — childProfileId: ${id}`);
        setChildProfileId(id);
      }

      // ── 2. INSERT tasks ──────────────────────────────────────────────────
      console.log(`${TAG} [2/3] Inserting ${tasks.length} tasks for childProfileId=${id}...`);

      // The engine already produced the final, capped (≤5) list spanning the
      // main + additional challenges, each carrying its own clock time (from
      // timeOfDay) and category. We only translate the title into the CHILD's
      // language (childLang, from their name script) — not the app locale — so
      // each child gets tasks in their own language.
      const taskRows = tasks.map((t) => ({
        family_id:     familyId,
        assigned_to:   id,
        title:         pickLang(t.title, childLang),
        category:      t.category,
        time:          t.time,
        credits:       t.buff_value,
        icon:          '⭐',
        schedule_days: [0, 1, 2, 3, 4, 5, 6], // default: every day (incl. Sat); parent can narrow per task
      }));
      console.log(`${TAG} [2/3] Task rows (${taskRows.length}):`, JSON.stringify(taskRows.map(r => `${r.time} ${r.title}`)));

      // Idempotency: skip if the child already has tasks. saveAll re-runs on
      // remount / error-retry / null-childProfileId goNext, and the empty-state
      // CTA attaches to an existing child — without this a second run duplicated
      // the whole task set (IN-2026-05-29-08). Gated per-table so a partial prior
      // failure still backfills the missing side.
      const { count: existingTaskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', id);

      if (existingTaskCount && existingTaskCount > 0) {
        console.log(`${TAG} [2/3] Child already has ${existingTaskCount} task(s) — skipping insert (idempotent)`);
      } else {
        const { error: tasksErr } = await supabase
          .from('tasks')
          .insert(taskRows as never);

        if (tasksErr) {
          console.warn(`${TAG} [2/3] Tasks insert error (non-fatal):`, tasksErr.message);
        } else {
          console.log(`${TAG} [2/3] Tasks insert SUCCESS`);
        }
      }

      // ── 3. INSERT store_rewards ──────────────────────────────────────────
      console.log(`${TAG} [3/3] Inserting ${rewards.length} rewards for childProfileId=${id}...`);

      // `store_rewards` has both `title` (en) and `title_he` columns —
      // `bilingualForDb` spreads them in one line. The read side
      // (3 reward screens) picks the right column via `pickI18nColumn`.
      const rewardRows = rewards.map(r => ({
        family_id:      familyId,
        child_id:       id,
        ...bilingualForDb(r.title),
        emoji:          r.emoji,
        size:           r.size,
        credits_needed: calcRewardCreditsDefault(r.size),
        is_redeemed:    false,
      }));
      console.log(`${TAG} [3/3] Reward rows:`, JSON.stringify(rewardRows.map(r => r.title)));

      // Idempotency (mirror of the task guard above): skip if the child already
      // has rewards. See IN-2026-05-29-08.
      const { count: existingRewardCount } = await supabase
        .from('store_rewards')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', id);

      if (existingRewardCount && existingRewardCount > 0) {
        console.log(`${TAG} [3/3] Child already has ${existingRewardCount} reward(s) — skipping insert (idempotent)`);
      } else {
        const { error: rewardsErr } = await supabase
          .from('store_rewards')
          .insert(rewardRows as never);

        if (rewardsErr) {
          console.warn(`${TAG} [3/3] store_rewards insert error (non-fatal — table may not exist yet):`, rewardsErr.message);
        } else {
          console.log(`${TAG} [3/3] Rewards insert SUCCESS`);
        }
      }

      console.log(`${TAG} saveAll complete ✓`);

    } catch (err) {
      console.error(`${TAG} saveAll FATAL error:`, err);
      setSaveErr(err instanceof Error ? err.message : 'Save failed. Please try again.');
      hasSaved.current = false; // allow retry
    }
  };

  const progress = (STEP + 1) / (TOTAL + 1);
  const arrow    = isRTL ? '←' : '→';

  const goNext = () => {
    if (!childProfileId) {
      console.warn(`${TAG} goNext called but childProfileId not yet available — retrying save`);
      saveAll();
      return;
    }
    // Empty-state re-entry: tasks are now attached to the existing child, so
    // return straight to the parent app (Tasks tab). Skips UStep7_Phone (the
    // child already exists) and UStep8_Complete (which would overwrite the
    // already-onboarded parent's pro_settings).
    if (params.existingChildId) {
      console.log(`${TAG} Existing child — returning to Parent Tasks tab`);
      navigation.navigate('ParentApp', { screen: 'ParentTasks' });
      return;
    }
    console.log(`${TAG} Navigating to UStep7_Phone with childProfileId=${childProfileId}`);
    navigation.navigate('UStep7_Phone', { ...params, childProfileId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, isRTL && styles.rowReverse]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backChevron}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.flowLabel}>{t('onboarding.flowLabel')}</Text>
          <Text style={styles.stepCount}>{STEP + 1} / {TOTAL + 1}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, isRTL && styles.textRight]}>
          {t('onboarding.step5.title', { name: params.childName })}
        </Text>
        <Text style={[styles.sub, isRTL && styles.textRight]}>
          {t('onboarding.step5.subtitle')}
        </Text>

        {saveErr && (
          <TouchableOpacity style={styles.errorCard} onPress={() => saveAll()}>
            <Text style={styles.errorText}>{saveErr}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* ── Tasks section ──────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, isRTL && styles.textRight]}>
          {t('onboarding.step5.missions')}
        </Text>

        {tasks.map((task, i) => (
          <Animated.View
            key={task.id}
            style={[
              styles.card,
              {
                opacity: anims[i],
                transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <View style={[styles.cardRow, isRTL && styles.rowReverse]}>
              <Text style={styles.buffIcon}>⚡</Text>
              <Text style={[styles.cardTitle, isRTL && styles.textRight]}>
                {pickLang(task.title, childLang)}
              </Text>
              <Text style={styles.buffBadge}>
                {t('onboarding.step5.buffs', { count: task.buff_value })}
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* ── Rewards section ────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }, isRTL && styles.textRight]}>
          {t('onboarding.step5.rewards')}
        </Text>

        {rewards.map((reward, i) => {
          const credits = calcRewardCreditsDefault(reward.size);
          return (
            <Animated.View
              key={reward.id}
              style={[
                styles.card,
                {
                  opacity: anims[tasks.length + i],
                  transform: [{ translateY: anims[tasks.length + i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                },
              ]}
            >
              <View style={[styles.cardRow, isRTL && styles.rowReverse]}>
                <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, isRTL && styles.textRight]}>
                    {pickLang(reward.title, lang)}
                  </Text>
                  <View style={[styles.rewardMeta, isRTL && styles.rowReverse]}>
                    <View style={styles.sizeBadge}>
                      <Text style={styles.sizeBadgeText}>{SIZE_LABEL[reward.size]}</Text>
                    </View>
                    <Text style={styles.creditsText}>
                      {t('onboarding.step5.buffs', { count: credits })}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, !childProfileId && styles.ctaBtnLoading]}
          onPress={goNext}
          activeOpacity={0.85}
          disabled={!!saveErr}
        >
          {!childProfileId && !saveErr ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              {t(
                params.existingChildId ? 'onboarding.step5.ctaExistingChild' : 'onboarding.step5.cta',
                { name: params.childName, arrow }
              )}
            </Text>
          )}
        </TouchableOpacity>
        {!params.existingChildId && (
          <TouchableOpacity onPress={goNext} activeOpacity={0.7} style={styles.skipBtn} disabled={!!saveErr}>
            <Text style={styles.skipText}>{t('onboarding.step5.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: T.bg },

  // Header
  topBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  rowReverse:     { flexDirection: 'row-reverse' },
  backChevron:    { color: T.accent, fontSize: 28, lineHeight: 32, width: 36 },
  stepInfo:       { flex: 1, alignItems: 'center' },
  flowLabel:      { color: T.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  stepCount:      { color: T.text, fontSize: 13, fontWeight: '600' },
  barTrack:       { height: 3, backgroundColor: T.cardBorder, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  barFill:        { height: '100%', backgroundColor: T.accent, borderRadius: 2 },

  // Content
  content:        { padding: 24, paddingTop: 24, paddingBottom: 130 },
  heading:        { color: T.text, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  sub:            { color: T.textMuted, fontSize: 15, marginBottom: 24, lineHeight: 22 },
  sectionLabel:   { color: T.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  textRight:      { textAlign: 'right' },

  // Error
  errorCard:      { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  errorText:      { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 4 },
  retryText:      { color: '#DC2626', fontSize: 12, fontWeight: '600' },

  // Cards
  card:           { backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: T.cardBorder },
  cardRow:        { flexDirection: 'row', alignItems: 'center' },
  buffIcon:       { fontSize: 16, marginRight: 10 },
  cardTitle:      { flex: 1, color: T.text, fontSize: 14, fontWeight: '500' },
  buffBadge:      { color: T.accent, fontSize: 12, fontWeight: '700', backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },

  // Rewards
  rewardEmoji:    { fontSize: 22, marginRight: 12, width: 30 },
  rewardMeta:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  sizeBadge:      { backgroundColor: T.cardBorder, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  sizeBadgeText:  { color: T.textMuted, fontSize: 11, fontWeight: '600' },
  creditsText:    { color: T.accent, fontSize: 12, fontWeight: '700' },

  // Footer
  footer:         {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: T.bg,
    padding: 20, paddingBottom: 32,
  },
  ctaBtn:         { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  ctaBtnLoading:  { opacity: 0.7 },
  ctaText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn:        { alignItems: 'center', paddingVertical: 8 },
  skipText:       { color: T.textMuted, fontSize: 14 },
});
