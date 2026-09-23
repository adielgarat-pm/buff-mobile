/**
 * EditFocusScreen — parent changes a child's focus areas + motivators after
 * onboarding, then is OFFERED (never forced) fitting task/reward ideas.
 *
 * Freemium v2 / edit-focus (D: Adi 2026-09-23, family-d111 interview: the
 * parent chose the wrong focus in onboarding and could not change it). FREE
 * core. Reached only from Edit Child → "Focus & rewards"; never part of the
 * onboarding stack, so onboarding stays exactly as long as it was.
 *
 * Guarantees:
 *   - Save merges into pro_settings.onboarding_data (other fields untouched;
 *     the first-ever answer kept once in onboarding_data_initial).
 *   - Suggestions exclude anything the child already has, and start UNCHECKED
 *     (Q6). "Add selected" only INSERTs tasks / store_rewards; "Skip" adds
 *     nothing. Existing tasks, rewards, BUFFs and history are never touched.
 *   - Same UI on Android and web (plain React Native primitives only).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import {
  OPTIONS_BY_AGE, MOTIVATORS, calcRewardCreditsDefault,
  type AgeGroup, type Gender, type RewardItem,
} from '../onboarding/unified/onboardingData';
import { generateStarterTasks, type GeneratedTask } from '../onboarding/unified/starterTasks';
import { buildSeedRewards } from '../onboarding/unified/seedRewards';
import { pickLang, pickI18nColumn, bilingualForDb, resolveChildLang } from '../../lib/i18nString';
import { diffSuggestions, mergeFocusIntoProSettings, type FocusSuggestions } from '../../lib/focusSuggestions';

type Nav   = StackNavigationProp<RootStackParamList, 'EditFocus'>;
type Route = RouteProp<RootStackParamList, 'EditFocus'>;

const AGE_GROUPS: AgeGroup[] = ['6-8', '9-11', '12-14', '15-18'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

type ProSettings = Record<string, unknown> & {
  age_group?: string;
  gender?: Gender | null;
  onboarding_data?: { mainChallenge?: string; additionalChallenges?: string[]; motivators?: string[] };
};

export default function EditFocusScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { familyId } = useAuth();
  const { rowDirection, textAlign, isRTL } = useRTLStyles();

  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState<string | null>(null);
  const [name, setName]         = useState('');
  const [proSettings, setProSettings] = useState<ProSettings>({});
  const [childLang, setChildLang] = useState<'he' | 'en'>('he');

  const [main, setMain]           = useState<string | null>(null);
  const [others, setOthers]       = useState<string[]>([]);
  const [motivators, setMotivators] = useState<string[]>([]);

  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<FocusSuggestions | null>(null);
  const [pickedTasks, setPickedTasks]     = useState<string[]>([]);
  const [pickedRewards, setPickedRewards] = useState<string[]>([]);
  const [adding, setAdding]       = useState(false);

  // ── Load the child ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, pro_settings')
        .eq('id', params.childId)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setLoadErr(t('editChild.loadError'));
        setLoading(false);
        return;
      }
      const row = data as { display_name: string | null; pro_settings: ProSettings | null };
      const ps = row.pro_settings ?? {};
      const od = ps.onboarding_data ?? {};
      setName(row.display_name ?? '');
      setProSettings(ps);
      setChildLang(resolveChildLang({ pro_settings: ps, display_name: row.display_name }));
      setMain(od.mainChallenge ?? null);
      setOthers((od.additionalChallenges ?? []).filter(c => c !== od.mainChallenge));
      setMotivators(od.motivators ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [params.childId, t]);

  // The age group being edited on the Edit Child screen wins over the stored one.
  const ageGroup = useMemo<AgeGroup | null>(() => {
    const ag = (params.ageGroup ?? proSettings.age_group) as string | undefined;
    return ag && (AGE_GROUPS as string[]).includes(ag) ? (ag as AgeGroup) : null;
  }, [params.ageGroup, proSettings.age_group]);

  const options = ageGroup ? OPTIONS_BY_AGE[ageGroup] : [];
  // A stored focus id from another age band is not selectable here; keep the
  // parent's choice honest by only counting ids that exist in this band.
  const validMain = main && options.some(o => o.id === main) ? main : null;

  const chooseMain = (id: string) => {
    setMain(id);
    setOthers(prev => prev.filter(x => x !== id));
  };
  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  // ── Save focus, then compute the offer ───────────────────────────────────
  const save = async () => {
    if (!ageGroup || !validMain) return;
    setSaving(true);
    setSaveErr(null);

    // Re-read right before writing so a concurrent edit elsewhere (e.g. the
    // language toggle) is never clobbered.
    const { data: fresh, error: readErr } = await supabase
      .from('profiles').select('pro_settings').eq('id', params.childId).single();
    if (readErr) {
      setSaveErr(t('editChild.saveError'));
      setSaving(false);
      return;
    }
    const prev = ((fresh as { pro_settings: ProSettings | null } | null)?.pro_settings) ?? {};
    const focus = {
      mainChallenge: validMain,
      additionalChallenges: others.filter(o => options.some(x => x.id === o)),
      motivators,
    };
    const next = mergeFocusIntoProSettings(prev, focus, new Date().toISOString());

    const { data: updated, error: updErr } = await supabase
      .from('profiles')
      .update({ pro_settings: next } as never)
      .eq('id', params.childId)
      .select('id');
    if (updErr || !updated || updated.length === 0) {
      // 0 rows = RLS-blocked silently; never pretend it saved.
      setSaveErr(t('editChild.saveError'));
      setSaving(false);
      return;
    }

    // Offer: what the new focus would seed, minus what the child already has.
    const genTasks: GeneratedTask[] = generateStarterTasks({
      ageGroup,
      gender: (prev.gender ?? undefined) as Gender | undefined,
      mainChallenge: focus.mainChallenge,
      additionalChallenges: focus.additionalChallenges,
    });
    const genRewards: RewardItem[] = buildSeedRewards(motivators, ageGroup, { fallback: false });
    const [{ data: taskRows }, { data: rewardRows }] = await Promise.all([
      supabase.from('tasks').select('title').eq('assigned_to', params.childId),
      supabase.from('store_rewards').select('title, title_he').eq('child_id', params.childId),
    ]);
    const existingRewardTitles = ((rewardRows ?? []) as { title: string; title_he: string | null }[])
      .flatMap(r => [pickI18nColumn(r, 'en'), pickI18nColumn(r, 'he')]);
    setSuggestions(diffSuggestions({
      tasks: genTasks,
      rewards: genRewards,
      existingTaskTitles: ((taskRows ?? []) as { title: string | null }[]).map(r => r.title),
      existingRewardTitles,
    }));
    setPickedTasks([]);    // Q6: suggestions start UNCHECKED
    setPickedRewards([]);
    setSaving(false);
  };

  // ── Add only what the parent picked (INSERT only) ────────────────────────
  const addSelected = async () => {
    if (!suggestions || !familyId) return;
    setAdding(true);
    setSaveErr(null);
    const tasks = suggestions.tasks.filter(x => pickedTasks.includes(x.id));
    const rewards = suggestions.rewards.filter(x => pickedRewards.includes(x.id));
    try {
      if (tasks.length > 0) {
        const { error } = await supabase.from('tasks').insert(tasks.map(x => ({
          family_id:     familyId,
          assigned_to:   params.childId,
          title:         pickLang(x.title, childLang),
          category:      x.category,
          time:          x.time,
          credits:       x.buff_value,
          icon:          '⭐',
          schedule_days: ALL_DAYS,
        })) as never);
        if (error) throw error;
      }
      if (rewards.length > 0) {
        const { error } = await supabase.from('store_rewards').insert(rewards.map(r => ({
          family_id:      familyId,
          child_id:       params.childId,
          ...bilingualForDb(r.title),
          emoji:          r.emoji,
          size:           r.size,
          credits_needed: calcRewardCreditsDefault(r.size),
          is_redeemed:    false,
        })) as never);
        if (error) throw error;
      }
      navigation.goBack();
    } catch (e) {
      console.warn('[EditFocus] add failed:', e instanceof Error ? e.message : e);
      setSaveErr(t('editFocus.addError'));
    } finally {
      setAdding(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const header = (
    <View style={[styles.header, { flexDirection: rowDirection }]}>
      <TouchableOpacity
        testID="edit-focus-back"
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel={t('editChild.cancel')}
      >
        <Text style={styles.backChevron}>{isRTL ? '›' : '‹'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{t('editFocus.title')}</Text>
      <View style={styles.backBtn} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color={T.accent} />
      </SafeAreaView>
    );
  }

  if (loadErr) {
    return (
      <SafeAreaView style={styles.safe}>
        {header}
        <Text style={[styles.errorText, { textAlign }]}>{loadErr}</Text>
      </SafeAreaView>
    );
  }

  // Plain render helper (not a component) so rows never remount on re-render.
  const chip = ({ id, label, emoji, selected, onPress, testID, radio }: {
    id: string; label: string; emoji: string; selected: boolean; onPress: () => void; testID: string; radio?: boolean;
  }) => (
    <TouchableOpacity
      key={id}
      testID={testID}
      style={[styles.option, { flexDirection: rowDirection }, selected && styles.optionActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole={radio ? 'radio' : 'checkbox'}
      accessibilityState={radio ? { selected } : { checked: selected }}
      accessibilityLabel={label}
    >
      <Text style={styles.optionEmoji}>{emoji}</Text>
      <Text style={[styles.optionLabel, { textAlign }, selected && styles.optionLabelActive]}>{label}</Text>
      <View style={[styles.check, selected && styles.checkOn]}>
        {selected && <Text style={styles.checkTick}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  // ── Step 2: the optional offer ───────────────────────────────────────────
  if (suggestions) {
    const nothing = suggestions.tasks.length === 0 && suggestions.rewards.length === 0;
    const count = pickedTasks.length + pickedRewards.length;
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        {header}
        <ScrollView contentContainerStyle={styles.content}>
          {nothing ? (
            <Text testID="edit-focus-no-ideas" style={[styles.sub, { textAlign }]}>{t('editFocus.savedNoIdeas')}</Text>
          ) : (
            <>
              <Text style={[styles.heading, { textAlign }]}>{t('editFocus.suggestTitle', { name })}</Text>
              <Text style={[styles.sub, { textAlign }]}>{t('editFocus.suggestSub')}</Text>
              {suggestions.tasks.length > 0 && (
                <Text style={[styles.label, { textAlign }]}>{t('editFocus.tasksLabel')}</Text>
              )}
              {suggestions.tasks.map(x => (
                chip({ id: x.id, emoji: '⭐', label: pickLang(x.title, childLang), selected: pickedTasks.includes(x.id), onPress: () => toggle(pickedTasks, setPickedTasks, x.id), testID: `edit-focus-task-${x.id}` })
              ))}
              {suggestions.rewards.length > 0 && (
                <Text style={[styles.label, { textAlign, marginTop: 16 }]}>{t('editFocus.rewardsLabel')}</Text>
              )}
              {suggestions.rewards.map(r => (
                chip({ id: r.id, emoji: r.emoji, label: pickLang(r.title, childLang), selected: pickedRewards.includes(r.id), onPress: () => toggle(pickedRewards, setPickedRewards, r.id), testID: `edit-focus-reward-${r.id}` })
              ))}
            </>
          )}

          {saveErr && <Text style={[styles.errorText, { textAlign }]}>{saveErr}</Text>}

          {!nothing && (
            <TouchableOpacity
              testID="edit-focus-add"
              style={[styles.primaryBtn, (count === 0 || adding) && styles.btnDisabled]}
              disabled={count === 0 || adding}
              onPress={addSelected}
              accessibilityRole="button"
            >
              {adding
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryText}>{t('editFocus.addSelected', { count })}</Text>}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="edit-focus-skip"
            style={styles.secondaryBtn}
            disabled={adding}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>{nothing ? t('editFocus.done') : t('editFocus.skip')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 1: choose the focus ─────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        {!ageGroup ? (
          <Text testID="edit-focus-need-age" style={[styles.sub, { textAlign }]}>{t('editFocus.needAge')}</Text>
        ) : (
          <>
            <Text style={[styles.label, { textAlign }]}>{t('editFocus.mainLabel')}</Text>
            {options.map(o => (
              chip({ id: o.id, emoji: o.emoji, label: t(o.labelKey), radio: true, selected: validMain === o.id, onPress: () => chooseMain(o.id), testID: `edit-focus-main-${o.id}` })
            ))}

            <Text style={[styles.label, { textAlign, marginTop: 20 }]}>{t('editFocus.otherLabel')}</Text>
            {options.filter(o => o.id !== validMain).map(o => (
              chip({ id: o.id, emoji: o.emoji, label: t(o.labelKey), selected: others.includes(o.id), onPress: () => toggle(others, setOthers, o.id), testID: `edit-focus-other-${o.id}` })
            ))}

            <Text style={[styles.label, { textAlign, marginTop: 20 }]}>{t('editFocus.motivatorsLabel', { name })}</Text>
            {MOTIVATORS.map(m => (
              chip({ id: m.id, emoji: m.emoji, label: t(m.labelKey), selected: motivators.includes(m.id), onPress: () => toggle(motivators, setMotivators, m.id), testID: `edit-focus-motivator-${m.id}` })
            ))}

            {saveErr && <Text style={[styles.errorText, { textAlign }]}>{saveErr}</Text>}

            <TouchableOpacity
              testID="edit-focus-save"
              style={[styles.primaryBtn, (!validMain || saving) && styles.btnDisabled]}
              disabled={!validMain || saving}
              onPress={save}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t('editFocus.save')}</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: T.bg },
  centered:    { alignItems: 'center', justifyContent: 'center' },
  header:      { alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backChevron: { color: T.accent, fontSize: 28, lineHeight: 32 },
  title:       { flex: 1, color: T.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  content:     { padding: 20, paddingTop: 12, paddingBottom: 40 },
  heading:     { color: T.text, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  sub:         { color: T.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  label:       { color: T.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  option:      { backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 8, alignItems: 'center', borderWidth: 1.5, borderColor: T.cardBorder },
  optionActive:      { borderColor: T.accent },
  optionEmoji:       { fontSize: 20, width: 30, textAlign: 'center' },
  optionLabel:       { flex: 1, color: T.text, fontSize: 15, fontWeight: '500', marginHorizontal: 8 },
  optionLabelActive: { color: T.accent, fontWeight: '700' },
  check:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: T.cardBorder, alignItems: 'center', justifyContent: 'center' },
  checkOn:     { backgroundColor: T.accent, borderColor: T.accent },
  checkTick:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  primaryBtn:  { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
  secondaryBtn:  { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: T.textMuted, fontSize: 15, fontWeight: '600' },
  errorText:   { color: '#DC2626', fontSize: 14, marginTop: 12 },
});
