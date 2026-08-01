/**
 * useSafeSurface (native) — gathers the live inputs and returns whether the OTA
 * restart toast (Layer 3) may show right now. The decision itself is the pure
 * `evaluateSafeSurface` (src/lib/safeSurface.ts); this hook only wires the
 * sources: parent/child mode + view-as-child (ModeContext), pause mode
 * (useAppSettings), the top-level route (currentRoute store), foreground state
 * (AppState), a settle delay, and the celebration flag.
 *
 * Must be mounted inside the app providers (it calls useMode/useAppSettings).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMode } from '../contexts/ModeContext';
import { useAppSettings } from './useAppSettings';
import { getCurrentRoute, subscribeCurrentRoute } from '../lib/currentRoute';
import { isCelebrating } from '../lib/celebrationActivity';
import { evaluateSafeSurface, SafeSurfaceResult } from '../lib/safeSurface';

/** Never greet a parent the instant they enter; let the surface settle. */
const SETTLE_MS = 4000;
/** Re-evaluate cadence so a transient block (celebration) clears on its own. */
const TICK_MS = 1000;

export function useSafeSurface(): SafeSurfaceResult {
  const { viewMode, isChildPreview } = useMode();
  const { isPauseActive } = useAppSettings();

  const [routeName, setRouteName] = useState<string | null>(getCurrentRoute());
  useEffect(() => subscribeCurrentRoute(setRouteName), []);

  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const onChange = (s: AppStateStatus) => setIsForeground(s === 'active');
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, []);

  // A slow tick so a transient block (an in-flight celebration) re-evaluates and
  // clears without needing an unrelated re-render.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Read the transient celebration flag at evaluation time.
  const celebrating = isCelebrating();
  const tickRef = useRef(0);
  tickRef.current += 1;

  return useMemo(
    () =>
      evaluateSafeSurface({
        routeName,
        viewMode,
        isChildPreview,
        isPauseActive,
        isForeground,
        settled,
        celebrating,
      }),
    // celebrating is intentionally re-read each render via the tick.
    [routeName, viewMode, isChildPreview, isPauseActive, isForeground, settled, celebrating],
  );
}
