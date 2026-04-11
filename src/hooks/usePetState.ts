/**
 * usePetState — mobile port of the web app's useChildPet hook.
 *
 * Key differences from the web version:
 *  - AsyncStorage replaces localStorage for both pet state and session state.
 *  - No Supabase writes (mock phase); persistence is device-local only.
 *  - window.dispatchEvent → no-op (no DOM); rest-card depletion is returned
 *    as a flag from onTaskCompleted for callers to act on.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PetState,
  DEFAULT_PET_STATE,
  EvolutionStage,
  getEvolutionStage,
  getNextEvolutionThreshold,
  EVOLUTION_THRESHOLDS,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
} from '../types/pet';

// ─── Constants ────────────────────────────────────────────────────────────────

const PET_STATE_KEY   = 'buff_pet_state';
const PET_SESSION_KEY = 'buff_pet_session';

/** Screen-active time before rest kicks in (5 min) */
const REST_DURATION_MS = 5 * 60 * 1000;
/** How long the pet rests after hitting the time limit (15 min) */
const REST_COOLDOWN_MS = 15 * 60 * 1000;

// ─── Session state (in-memory + AsyncStorage) ─────────────────────────────────

interface SessionState {
  activeStartTime: number | null;
  restingUntil:    number | null;
}

async function getSessionState(): Promise<SessionState> {
  try {
    const raw = await AsyncStorage.getItem(PET_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { activeStartTime: null, restingUntil: null };
}

async function saveSessionState(state: SessionState) {
  try {
    await AsyncStorage.setItem(PET_SESSION_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function normalizePetState(raw: Record<string, unknown>): PetState {
  const days = (raw.evolution_days_count as number) ?? 0;
  return {
    level:                     (raw.level as number)               ?? DEFAULT_PET_STATE.level,
    experience:                (raw.experience as number)           ?? DEFAULT_PET_STATE.experience,
    energy_level:              (raw.energy_level as number)         ?? DEFAULT_PET_STATE.energy_level,
    current_skin:              (raw.current_skin as string)         ?? DEFAULT_PET_STATE.current_skin,
    last_interaction:          (raw.last_interaction as string | null) ?? null,
    evolution_stage:           (raw.evolution_stage as EvolutionStage) ?? getEvolutionStage(days),
    evolution_days_count:      days,
    daily_streak:              (raw.daily_streak as number)         ?? DEFAULT_PET_STATE.daily_streak,
    rest_cards_balance:        (raw.rest_cards_balance as number)   ?? DEFAULT_PET_STATE.rest_cards_balance,
    last_task_completion_date: (raw.last_task_completion_date as string | null) ?? null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePetState(defaultSkin?: string) {
  const [petState, setPetState] = useState<PetState>({
    ...DEFAULT_PET_STATE,
    current_skin: defaultSkin ?? DEFAULT_PET_STATE.current_skin,
  });
  const [isResting, setIsResting]   = useState(false);
  const [loading,   setLoading]     = useState(true);

  const restTimerRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Load pet state from AsyncStorage ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PET_STATE_KEY);
        if (raw) {
          const parsed = normalizePetState(JSON.parse(raw));
          // Check if streak needs updating on load (missed days without rest card)
          const processed = checkStreakOnLoad(parsed);
          if (processed !== parsed) {
            await AsyncStorage.setItem(PET_STATE_KEY, JSON.stringify(processed));
          }
          setPetState(processed);
        } else if (defaultSkin) {
          // First launch — apply theme-appropriate skin
          const initial = { ...DEFAULT_PET_STATE, current_skin: defaultSkin };
          await AsyncStorage.setItem(PET_STATE_KEY, JSON.stringify(initial));
          setPetState(initial);
        }
      } catch {}
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session rest timer ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const session = await getSessionState();

      if (session.restingUntil && Date.now() < session.restingUntil) {
        setIsResting(true);
        const remaining = session.restingUntil - Date.now();
        restTimerRef.current = setTimeout(async () => {
          setIsResting(false);
          await saveSessionState({ activeStartTime: null, restingUntil: null });
        }, remaining);
        return;
      }

      if (session.restingUntil) {
        await saveSessionState({ activeStartTime: null, restingUntil: null });
        setIsResting(false);
      }

      const startTime = session.activeStartTime ?? Date.now();
      await saveSessionState({ ...session, activeStartTime: startTime });

      const checkActive = async () => {
        const s = await getSessionState();
        if (s.activeStartTime && Date.now() - s.activeStartTime >= REST_DURATION_MS) {
          const restUntil = Date.now() + REST_COOLDOWN_MS;
          await saveSessionState({ activeStartTime: null, restingUntil: restUntil });
          setIsResting(true);
          restTimerRef.current = setTimeout(async () => {
            setIsResting(false);
            await saveSessionState({ activeStartTime: null, restingUntil: null });
          }, REST_COOLDOWN_MS);
        }
      };

      activeTimerRef.current = setTimeout(checkActive, REST_DURATION_MS);
    })();

    return () => {
      if (restTimerRef.current)   clearTimeout(restTimerRef.current);
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Streak check on load ─────────────────────────────────────────────────
  function checkStreakOnLoad(state: PetState): PetState {
    const today   = getTodayKey();
    const lastDate = state.last_task_completion_date;
    if (!lastDate || lastDate === today) return state;

    const diffDays = Math.floor(
      (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 1) return state;

    let streak    = state.daily_streak;
    let restCards = state.rest_cards_balance;

    for (let i = 0; i < diffDays - 1; i++) {
      if (restCards > 0) {
        restCards--;
      } else {
        streak = 0;
        break;
      }
    }

    if (streak !== state.daily_streak || restCards !== state.rest_cards_balance) {
      return { ...state, daily_streak: streak, rest_cards_balance: restCards };
    }
    return state;
  }

  // ── Save helper ───────────────────────────────────────────────────────────
  const savePetState = useCallback(async (next: PetState) => {
    setPetState(next);
    try {
      await AsyncStorage.setItem(PET_STATE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  // ── onTaskCompleted ───────────────────────────────────────────────────────
  const onTaskCompleted = useCallback(async (credits: number) => {
    const today = getTodayKey();
    const xp    = Math.max(5, Math.round(credits * 0.5));

    let newStreak  = petState.daily_streak;
    let newEvoDays = petState.evolution_days_count;
    const lastDate = petState.last_task_completion_date;

    if (lastDate !== today) {
      if (lastDate) {
        const diffDays = Math.floor(
          (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        newStreak = diffDays === 1
          ? newStreak + 1
          : petState.daily_streak > 0 ? petState.daily_streak + 1 : 1;
      } else {
        newStreak = 1;
      }
      newEvoDays += 1;
    }

    const newStage = getEvolutionStage(newEvoDays);
    const evolved  = newStage !== petState.evolution_stage;
    const newXp    = petState.experience + xp;

    let newLevel = petState.level;
    while (newLevel < MAX_LEVEL && newXp >= LEVEL_THRESHOLDS[newLevel]) newLevel++;

    const prevCardMilestone = Math.floor(petState.evolution_days_count / 5);
    const newCardMilestone  = Math.floor(newEvoDays / 5);
    const newRestCards = petState.rest_cards_balance + Math.max(0, newCardMilestone - prevCardMilestone);
    const restCardDepleted = newRestCards === 0 && petState.rest_cards_balance > 0;

    const next: PetState = {
      ...petState,
      experience:                newXp,
      level:                     newLevel,
      energy_level:              Math.min(100, petState.energy_level + 15),
      last_interaction:          new Date().toISOString(),
      evolution_stage:           newStage,
      evolution_days_count:      newEvoDays,
      daily_streak:              newStreak,
      rest_cards_balance:        newRestCards,
      last_task_completion_date: today,
    };

    await savePetState(next);

    if (isResting) {
      setIsResting(false);
      await saveSessionState({ activeStartTime: Date.now(), restingUntil: null });
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    }

    return { leveledUp: newLevel > petState.level, newLevel, evolved, newStage, restCardDepleted };
  }, [petState, savePetState, isResting]);

  // ── recordInteraction ─────────────────────────────────────────────────────
  const recordInteraction = useCallback(async () => {
    if (isResting) return;
    await savePetState({ ...petState, last_interaction: new Date().toISOString() });
  }, [petState, savePetState, isResting]);

  // ── changeSkin ────────────────────────────────────────────────────────────
  const changeSkin = useCallback(async (skinId: string) => {
    await savePetState({ ...petState, current_skin: skinId });
  }, [petState, savePetState]);

  // ── Derived progress values ───────────────────────────────────────────────
  const currentLevelThreshold = LEVEL_THRESHOLDS[petState.level - 1] ?? 0;
  const nextLevelThreshold    = petState.level < MAX_LEVEL
    ? LEVEL_THRESHOLDS[petState.level]
    : LEVEL_THRESHOLDS[MAX_LEVEL - 1];
  const xpInLevel  = petState.experience - currentLevelThreshold;
  const xpNeeded   = nextLevelThreshold - currentLevelThreshold;
  const xpProgress = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;

  const nextEvolutionDays    = getNextEvolutionThreshold(petState.evolution_stage);
  const currentEvolutionDays = EVOLUTION_THRESHOLDS[petState.evolution_stage];
  const evolutionDaysInStage = petState.evolution_days_count - currentEvolutionDays;
  const evolutionDaysNeeded  = nextEvolutionDays - currentEvolutionDays;
  const evolutionProgress    = petState.evolution_stage === 'guardian'
    ? 100
    : Math.min(100, (evolutionDaysInStage / evolutionDaysNeeded) * 100);

  return {
    petState,
    isResting,
    loading,
    onTaskCompleted,
    recordInteraction,
    changeSkin,
    xpProgress,
    xpInLevel,
    xpNeeded,
    evolutionProgress,
    evolutionDaysInStage,
    evolutionDaysNeeded,
  };
}
