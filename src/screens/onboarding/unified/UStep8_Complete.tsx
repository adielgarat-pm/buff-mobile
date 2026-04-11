/**
 * UStep8_Complete — "[name] is all set!"
 *
 * On mount:
 *  1. Creates the child profile in Supabase (profiles table)
 *  2. Creates the custom first mission + auto-generated starter tasks
 *  3. Saves first reward to pro_settings (no rewards table exists yet)
 *  4. Sets onboarding_complete = true on the parent profile
 *
 * "Go to Dashboard" navigates to ParentApp directly.
 * useChildrenDashboard in RootNavigator subscribes to profiles changes (via the
 * subscription we added) and will set isOnboarded = true, but we also navigate
 * explicitly so the transition is immediate.
 */
import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  SafeAreaView, ScrollView, Alert, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import * as Crypto from 'expo-crypto';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../integrations/supabase/client';
import { STARTER_TASKS_BY_CHALLENGE, FALLBACK_TASKS } from './onboardingData';
import type { StarterTask } from './onboardingData';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep8_Complete'>;
type Route = RouteProp<RootStackParamList, 'UStep8_Complete'>;

export default function UStep8_Complete() {
  const navigation              = useNavigation<Nav>();
  const { params }              = useRoute<Route>();
  const { t }                   = useTranslation();
  const { familyId, familyShortCode, user, refreshProfile } = useAuth();

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const hasSaved = useRef(false);

  // ── Save data on first mount ─────────────────────────────────────────────
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    saveAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAll = async () => {
    if (!familyId || !user) {
      setSaveErr(t('onboarding.complete.saveError'));
      return;
    }
    setSaving(true);
    setSaveErr(null);

    try {
      // 1. Create child profile with a generated UUID as placeholder user_id.
      //    The child will update their user_id when they sign up using the family code.
      const childUserId = await Crypto.randomUUID();

      const { data: childProfile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          user_id:      childUserId,
          family_id:    familyId,
          display_name: params.childName,
          role:         'child',
          marketing_consent: false,
          pro_settings: {
            age_group:   params.ageGroup,
            gender:      params.gender   ?? null,
            birth_date:  params.birthDate ?? null,
            first_reward: params.firstReward,
            onboarding_data: {
              mainGoal:             params.mainGoal,
              mainChallenge:        params.mainChallenge,
              additionalChallenges: params.additionalChallenges,
              motivator:            params.motivator,
              hasPhone:             params.hasPhone,
            },
          },
        } as never)
        .select('id')
        .single();

      if (profileErr || !childProfile) {
        throw new Error(profileErr?.message ?? 'Profile creation failed');
      }

      const childProfileId = (childProfile as { id: string }).id;

      // 2. Build task list: custom first mission + auto-generated starters
      const starterTasks: StarterTask[] =
        STARTER_TASKS_BY_CHALLENGE[params.mainChallenge] ?? FALLBACK_TASKS;

      const allTasks = [
        // Custom first mission from Step 5
        {
          family_id:     familyId,
          child_id:      childProfileId,
          title:         params.firstMission,
          category:      'morning',
          time:          '08:00',
          credits:       10,
          icon:          '⭐',
          schedule_days: [1, 2, 3, 4, 5],
        },
        // Auto-generated starters (de-duped against firstMission)
        ...starterTasks
          .filter(st => st.title.toLowerCase() !== params.firstMission.toLowerCase())
          .map(st => ({
            family_id:     familyId,
            child_id:      childProfileId,
            title:         st.title,
            category:      st.category,
            time:          st.time,
            credits:       st.credits,
            icon:          st.icon,
            schedule_days: [1, 2, 3, 4, 5],
          })),
      ];

      const { error: tasksErr } = await supabase
        .from('tasks')
        .insert(allTasks as never);

      if (tasksErr) {
        // Non-fatal — profile was created, tasks can be added later
        console.warn('[Onboarding] tasks insert error:', tasksErr.message);
      }

      // 3. Mark parent profile as onboarding complete
      await supabase
        .from('profiles')
        .update({
          pro_settings: {
            onboarding_complete: true,
            onboarding_child_name: params.childName,
          },
        } as never)
        .eq('user_id', user.id);

      // 4. Refresh parent profile so RootNavigator re-evaluates isOnboarded
      await refreshProfile(user.id);

      setSaved(true);
    } catch (err) {
      console.error('[Onboarding] saveAll error:', err);
      setSaveErr(err instanceof Error ? err.message : t('onboarding.complete.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const goToDashboard = () => {
    navigation.reset({ index: 0, routes: [{ name: 'ParentApp' }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.heading}>
          {t('onboarding.complete.title', { name: params.childName })}
        </Text>
        <Text style={styles.sub}>{t('onboarding.complete.sub')}</Text>

        {/* Family code card */}
        {familyShortCode && (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>{t('onboarding.complete.familyCode')}</Text>
            <Text style={styles.code}>{familyShortCode}</Text>
            <Text style={styles.codeHint}>
              {t('onboarding.complete.codeHint', { name: params.childName })}
            </Text>
          </View>
        )}

        {/* Coach tip card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>{t('onboarding.complete.coachTitle')}</Text>
          <Text style={styles.tipText}>
            {t('onboarding.complete.coachTip', { name: params.childName })}
          </Text>
          <Text style={[styles.tipText, { marginTop: 10, fontStyle: 'italic' }]}>
            {t('onboarding.complete.coachRole')}
          </Text>
        </View>

        {/* Save error */}
        {saveErr && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{saveErr}</Text>
            <TouchableOpacity onPress={saveAll} style={styles.retryBtn}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Go to Dashboard */}
        <TouchableOpacity
          style={[styles.btn, (saving || !!saveErr) && styles.btnDisabled]}
          onPress={goToDashboard}
          disabled={saving || !!saveErr}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{t('onboarding.complete.cta')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: T.bg },
  scroll:    { padding: 24, paddingTop: 48, paddingBottom: 40, alignItems: 'center' },
  trophy:    { fontSize: 60, marginBottom: 16 },
  heading:   { color: T.accent, fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  sub:       { color: T.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },

  codeCard:  { width: '100%', backgroundColor: T.accent, borderRadius: 16, padding: 22, alignItems: 'center', marginBottom: 16 },
  codeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  code:      { color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: 8, marginBottom: 6 },
  codeHint:  { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  tipCard:   { width: '100%', backgroundColor: T.card, borderRadius: 14, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: T.cardBorder },
  tipTitle:  { color: T.text, fontWeight: '700', fontSize: 15, marginBottom: 10 },
  tipText:   { color: T.textMuted, fontSize: 14, lineHeight: 21 },

  errorCard: { width: '100%', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  retryBtn:  { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  btn:        { width: '100%', backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
