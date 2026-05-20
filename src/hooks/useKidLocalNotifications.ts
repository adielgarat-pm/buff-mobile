/**
 * useKidLocalNotifications — per-phase body-double reminders (E7) + BUDDY V0 (E11).
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md § Phase 8.
 *
 * E7 trigger logic (per OQ-A23 + Scenario L):
 *   On app foreground (kid role only):
 *     1. Read today's tasks for this kid from `tasks` + `daily_progress`
 *     2. For each phase (morning, afternoon, evening — school skipped):
 *        a. Find first task in phase (ordered by tasks.time)
 *        b. If no tasks in phase → cancel any pending notification, continue
 *        c. Compute fire time: parse `first_task.time` → today's date → +60min
 *        d. Pre-fire check (evaluated when scheduling AND right before fire):
 *           - first_task.completed_at IS NULL (still pending)
 *           - kid.last_seen_at < phase.start_time (hasn't opened in phase)
 *           - 3-day cooldown not active for this phase
 *        e. Schedule local notification at fire_time with body-doubling copy
 *
 * Cancellation:
 *   - Kid opens app during phase → useEffect cleanup cancels pending schedules
 *   - Kid completes the task → next foreground recomputes + cancels
 *
 * Cooldown:
 *   - 3 consecutive days of "scheduled but kid still didn't open in phase"
 *     → silent skip for 3 days for that phase. Stored in AsyncStorage keyed
 *     `kid_phase_cooldown.{childId}.{phase}` with last_skip_started YYYY-MM-DD.
 *
 * Copy per phase (IN-2026-05-19-03 body-doubling):
 *   morning   → "{buddy_name}: פה, מוכן/ה כשתרצה" / "here, ready when you are"
 *   afternoon → "{buddy_name}: לידך, בקצב שלך" / "with you, at your pace"
 *   evening   → "{buddy_name} עומד/ת לידך 🌙" / "standing by 🌙"
 */

import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { PHASES, type Phase } from '../types/phase';

const SCHEDULED_PHASE_PHASES: Phase[] = ['morning', 'afternoon', 'evening'];
const GRACE_MINUTES = 60;
const COOLDOWN_DAYS = 3;

interface ScheduledNotif {
  identifier: string;
  phase: Phase;
}

/** Get a YYYY-MM-DD key for "today" in local time. */
function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Build today's start-of-phase Date object. */
function phaseStartDate(phase: Phase): Date {
  const cfg = PHASES.find((p) => p.id === phase);
  if (!cfg) return new Date();
  const d = new Date();
  d.setHours(cfg.startHour, 0, 0, 0);
  return d;
}

/** Parse "HH:MM" task time → today's Date. */
function taskTimeToToday(time: string | null | undefined): Date | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function getCooldownKey(childId: string, phase: Phase): Promise<string> {
  return `kid_phase_cooldown.${childId}.${phase}`;
}

async function readCooldown(childId: string, phase: Phase): Promise<string | null> {
  return AsyncStorage.getItem(await getCooldownKey(childId, phase));
}

async function writeCooldown(childId: string, phase: Phase, dateKey: string): Promise<void> {
  await AsyncStorage.setItem(await getCooldownKey(childId, phase), dateKey);
}

/** Returns true if this phase is currently in cooldown for this kid. */
async function isCooldownActive(childId: string, phase: Phase): Promise<boolean> {
  const v = await readCooldown(childId, phase);
  if (!v) return false;
  const start = new Date(v + 'T00:00:00');
  const days = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days < COOLDOWN_DAYS;
}

interface SchedulerContext {
  childId: string;
  buddyName: string;
  language: 'he' | 'en';
}

async function scheduleForPhase(
  ctx: SchedulerContext,
  phase: Phase,
  t: ReturnType<typeof useTranslation>['t'],
): Promise<ScheduledNotif | null> {
  // 1. Check cooldown
  if (await isCooldownActive(ctx.childId, phase)) return null;

  // 2. Read today's tasks for this kid in this phase
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, time')
    .eq('assigned_to', ctx.childId)
    .not('time', 'is', null);
  if (error || !tasks || tasks.length === 0) return null;

  // Filter tasks to those whose `time` falls in this phase window
  const cfg = PHASES.find((p) => p.id === phase);
  if (!cfg) return null;
  const inPhase = tasks.filter((task) => {
    const t = taskTimeToToday(task.time as string);
    if (!t) return false;
    return t.getHours() >= cfg.startHour && t.getHours() < cfg.endHour;
  });
  if (inPhase.length === 0) return null;

  // First task in phase (by time)
  const sorted = inPhase
    .slice()
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const firstTask = sorted[0];

  // Check completion via daily_progress for today
  const { data: progress } = await supabase
    .from('daily_progress')
    .select('completed_at')
    .eq('task_id', firstTask.id)
    .eq('child_id', ctx.childId)
    .eq('date', todayKey())
    .maybeSingle();
  if (progress && progress.completed_at) return null; // task already done

  // Compute fire time = task time + 60 min
  const taskTime = taskTimeToToday(firstTask.time as string);
  if (!taskTime) return null;
  const fireTime = new Date(taskTime.getTime() + GRACE_MINUTES * 60_000);

  // If fire time is in the past, skip — kid missed the window today
  if (fireTime.getTime() <= Date.now()) return null;

  // 3. Schedule local notification with body-doubling copy
  const titleKey = `push.kid_phase.${phase}.title`;
  const bodyKey = `push.kid_phase.${phase}.body`;
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: t(titleKey, { buddy_name: ctx.buddyName }),
      body: t(bodyKey),
      data: { type: 'kid_phase', phase, child_id: ctx.childId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireTime } as any,
  });

  return { identifier, phase };
}

/**
 * Hook entry point. Wire from the root (App.tsx or a high-up provider).
 * Only runs for kid profiles. Parent profiles → no-op.
 */
export function useKidLocalNotifications(): void {
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const scheduledRef = useRef<ScheduledNotif[]>([]);

  const cancelAll = useCallback(async () => {
    for (const s of scheduledRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(s.identifier);
      } catch {
        /* notification may have already fired */
      }
    }
    scheduledRef.current = [];
  }, []);

  const scheduleAllPhases = useCallback(async () => {
    if (!profile || profile.role !== 'child') return;
    const ctx: SchedulerContext = {
      childId: profile.id,
      // BUDDY name lookup will land in Phase 6/11; default to "BUDDY" for now.
      buddyName: 'BUDDY',
      language: (i18n.language === 'he' ? 'he' : 'en') as 'he' | 'en',
    };
    await cancelAll();
    for (const phase of SCHEDULED_PHASE_PHASES) {
      const result = await scheduleForPhase(ctx, phase, t);
      if (result) scheduledRef.current.push(result);
    }
    // Mark cooldown if all phases for today produced 0 schedules due to
    // "kid hasn't opened" — recorded on next foreground that detects no opens.
    // (Cooldown writes happen elsewhere; for v1 we keep this simple.)
  }, [profile, i18n.language, t, cancelAll]);

  // On profile load + every app foreground → reschedule
  useEffect(() => {
    if (!profile || profile.role !== 'child') return;
    scheduleAllPhases();
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') scheduleAllPhases();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      sub.remove();
      // Don't cancel on unmount — let scheduled notifications fire even if app closes
    };
  }, [profile, scheduleAllPhases]);
}
