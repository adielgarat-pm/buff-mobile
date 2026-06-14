/**
 * useBuffCatch — local persistence for the BUFF Catch mini-game (SPEC §7).
 *
 * Stores two values per child in AsyncStorage (no schema change, no economy):
 *   - personal best:  `buffcatch:best:{childId}`
 *   - plays today:     `buffcatch:plays:{childId}:{YYYY-MM-DD}`  (resets by date)
 *
 * The daily counter key is date-scoped, so it resets automatically at local
 * midnight without any cleanup job. A round started before midnight keeps
 * running; the *next* play reads the new date key and starts fresh (SPEC §9).
 *
 * View-as-child: the caller passes the resolved childId (previewChildId for a
 * parent previewing, else the child's own profile id), so best/plays land
 * under the correct child — never the parent (SPEC §7).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackBuffCatchPlayed } from '../lib/buffCatchTelemetry';

/** Flat daily cap on rounds (SPEC §11, resolved 2026-06-14). */
export const BUFF_CATCH_DAILY_CAP = 3;

const bestKey  = (childId: string) => `buffcatch:best:${childId}`;
const playsKey = (childId: string) => `buffcatch:plays:${childId}:${todayKey()}`;

/** Local-time YYYY-MM-DD — matches the kid's wall clock, not UTC. */
function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const toInt = (v: string | null) => {
  const n = parseInt(v ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
};

export interface UseBuffCatch {
  best:       number;
  playsToday: number;
  playsLeft:  number;
  loading:    boolean;
  /** Increment today's play counter (call on round start). Returns plays left after. */
  consumePlay: () => Promise<number>;
  /** Persist the score as a new best if it beats the old one + fire telemetry. */
  saveResult:  (score: number) => Promise<{ isNewBest: boolean; best: number }>;
  /** Re-read from storage (call on screen focus to refresh the entry card). */
  reload:      () => Promise<void>;
}

export function useBuffCatch(childId: string | null): UseBuffCatch {
  const [best, setBest]             = useState(0);
  const [playsToday, setPlaysToday] = useState(0);
  const [loading, setLoading]       = useState(true);

  const reload = useCallback(async () => {
    if (!childId) { setLoading(false); return; }
    setLoading(true);
    try {
      const pairs = await AsyncStorage.multiGet([bestKey(childId), playsKey(childId)]);
      const map = Object.fromEntries(pairs);
      setBest(toInt(map[bestKey(childId)]));
      setPlaysToday(toInt(map[playsKey(childId)]));
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { void reload(); }, [reload]);

  const consumePlay = useCallback(async (): Promise<number> => {
    if (!childId) return BUFF_CATCH_DAILY_CAP;
    // Read fresh from storage so back-to-back rounds don't race stale state.
    const key = playsKey(childId);
    const next = toInt(await AsyncStorage.getItem(key)) + 1;
    await AsyncStorage.setItem(key, String(next));
    setPlaysToday(next);
    return Math.max(0, BUFF_CATCH_DAILY_CAP - next);
  }, [childId]);

  const saveResult = useCallback(async (score: number) => {
    if (!childId) return { isNewBest: false, best: 0 };
    const key = bestKey(childId);
    const current = toInt(await AsyncStorage.getItem(key));
    const isNewBest = score > current;
    const newBest = isNewBest ? score : current;
    if (isNewBest) {
      await AsyncStorage.setItem(key, String(newBest));
      setBest(newBest);
    }
    trackBuffCatchPlayed({ childId, score, isNewBest });
    return { isNewBest, best: newBest };
  }, [childId]);

  return {
    best,
    playsToday,
    playsLeft: Math.max(0, BUFF_CATCH_DAILY_CAP - playsToday),
    loading,
    consumePlay,
    saveResult,
    reload,
  };
}
