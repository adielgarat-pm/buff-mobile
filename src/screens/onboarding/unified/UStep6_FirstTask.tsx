/**
 * UStep6_FirstTask — "do the first mission together, now".
 *
 * The single highest-leverage activation moment: instead of dropping the parent
 * onto an empty dashboard, we end onboarding with the child completing ONE task,
 * which writes the first daily_progress row = the real "aha".
 *
 * Design guards (from docs/sessions/onboarding-redesign/SPEC.md §Behavior Contract):
 *   - Presence gate first: only do the together-moment if the child is actually
 *     here. If not, skip straight to handoff and write NOTHING (never a fake
 *     activation from a parent tapping for an absent child).
 *   - Write-THEN-celebrate: the row is written before any confetti. A failed
 *     write shows a retry and NO celebration — we never claim success we didn't
 *     verify.
 *   - The seed row is tagged source='onboarding_first_task' so it is excluded
 *     from the real-activation metric (it's a UX milestone, not organic usage).
 *
 * Flows to ChildAccessStep (handoff) in all cases.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../integrations/supabase/client';
import { getTodayKey } from '../../../utils/vibeUtils';
import { logOnboardingEvent } from '../../../lib/onboardingFunnel';
import { crossAlert } from '../../../platform';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep6_FirstTask'>;
type Route = RouteProp<RootStackParamList, 'UStep6_FirstTask'>;

export default function UStep6_FirstTask() {
  const navigation      = useNavigation<Nav>();
  const { params }      = useRoute<Route>();
  const { t }           = useTranslation();
  const { familyId }    = useAuth();

  const [phase, setPhase] = useState<'presence' | 'task' | 'done'>('presence');
  const [task, setTask]   = useState<{ id: string; title: string } | null>(null);
  const [busy, setBusy]   = useState(false);

  const goHandoff = () => navigation.navigate('ChildAccessStep', params);

  // "Not right now" → skip the together-moment, write nothing.
  const skip = () => goHandoff();

  // "Yes, we're together" → fetch one starter task to do right now.
  const startTogether = async () => {
    setBusy(true);
    // Onboarding tasks are stored with a plain (child-language) title, so no
    // bilingual resolution needed here.
    const { data } = await supabase
      .from('tasks')
      .select('id, title, time')
      .eq('assigned_to', params.childProfileId)
      .order('time', { ascending: true })
      .limit(1);
    setBusy(false);

    const first = (data ?? [])[0] as { id: string; title: string } | undefined;
    if (!first) {
      // No task to offer (shouldn't happen — UStep5 guarantees starter tasks) —
      // don't strand the parent; go to handoff.
      goHandoff();
      return;
    }
    setTask({ id: first.id, title: first.title });
    setPhase('task');
  };

  // Write the first daily_progress row (the seed), THEN celebrate.
  const markDone = async () => {
    if (!task || !familyId) return;
    setBusy(true);
    const { error } = await supabase.from('daily_progress').upsert(
      {
        family_id:    familyId,
        child_id:     params.childProfileId,
        date:         getTodayKey(),
        task_id:      task.id,
        completed:    true,
        completed_at: new Date().toISOString(),
        source:       'onboarding_first_task',
      } as never,
      { onConflict: 'family_id,child_id,date,task_id' },
    );
    setBusy(false);

    if (error) {
      // No celebration on a failed write. Log it, let them retry.
      void logOnboardingEvent({
        familyId, eventType: 'first_task_write_failed', childId: params.childProfileId,
      });
      crossAlert(t('onboarding.stepD.errTitle'), t('onboarding.stepD.errBody'));
      return;
    }

    void logOnboardingEvent({
      familyId, eventType: 'first_task_complete',
      source: 'onboarding_first_task', childId: params.childProfileId,
    });
    setPhase('done');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.content}>
        {phase === 'presence' && (
          <>
            <Text style={styles.emoji}>🤝</Text>
            <Text style={styles.heading}>{t('onboarding.stepD.presenceTitle', { name: params.childName })}</Text>
            <Text style={styles.sub}>{t('onboarding.stepD.presenceSub')}</Text>

            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={startTogether} disabled={busy} activeOpacity={0.85}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('onboarding.stepD.presenceYes')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={skip} disabled={busy} activeOpacity={0.7}>
              <Text style={styles.btnGhostText}>{t('onboarding.stepD.presenceNo')}</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'task' && task && (
          <>
            <Text style={styles.emoji}>⭐</Text>
            <Text style={styles.heading}>{t('onboarding.stepD.taskTitle', { name: params.childName })}</Text>
            <View style={styles.taskCard}>
              <Text style={styles.taskText}>{task.title}</Text>
            </View>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={markDone} disabled={busy} activeOpacity={0.85}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('onboarding.stepD.markDone')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={skip} disabled={busy} activeOpacity={0.7}>
              <Text style={styles.btnGhostText}>{t('onboarding.stepD.presenceNo')}</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'done' && (
          <>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.heading}>{t('onboarding.stepD.doneTitle')}</Text>
            <Text style={styles.sub}>{t('onboarding.stepD.doneSub', { name: params.childName })}</Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={goHandoff} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>{t('onboarding.stepD.continue')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: T.bg },
  content:         { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  emoji:           { fontSize: 52, textAlign: 'center', marginBottom: 20 },
  heading:         { color: T.text, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  sub:             { color: T.textMuted, fontSize: 16, textAlign: 'center', marginBottom: 28, lineHeight: 24 },
  taskCard:        { backgroundColor: T.card, borderColor: T.accent, borderWidth: 1.5, borderRadius: 16, paddingVertical: 22, paddingHorizontal: 20, width: '100%', marginBottom: 28 },
  taskText:        { color: T.text, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  btn:             { width: '100%', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnPrimary:      { backgroundColor: T.accent },
  btnPrimaryText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnGhost:        { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnGhostText:    { color: T.textMuted, fontSize: 15, fontWeight: '600' },
});
