/**
 * Tests for the Nudge Manager (SPEC §3.4) — one slot, priority order,
 * global cooldown, care-prompt suppression, eligible() fault tolerance.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerNudge,
  useActiveNudge,
  markNudgeDismissed,
  _resetNudgeRegistry,
} from '../nudgeManager';
import type { NudgeId, PassiveNudge } from '../types';

function makeNudge(
  id: NudgeId,
  priority: number,
  eligible: () => boolean | Promise<boolean>,
): PassiveNudge {
  return { id, priority, eligible, render: () => null };
}

beforeEach(async () => {
  _resetNudgeRegistry();
  await AsyncStorage.clear();
});

it('returns null when nothing is registered', async () => {
  const { result } = renderHook(() => useActiveNudge());
  await waitFor(() => expect(result.current).toBeNull());
});

it('returns the only eligible nudge', async () => {
  registerNudge(makeNudge('install', 20, () => true));
  const { result } = renderHook(() => useActiveNudge());
  await waitFor(() => expect(result.current?.id).toBe('install'));
});

it('picks the higher-priority nudge when several are eligible', async () => {
  registerNudge(makeNudge('rate', 10, () => true));
  registerNudge(makeNudge('install', 20, () => true));
  const { result } = renderHook(() => useActiveNudge());
  await waitFor(() => expect(result.current?.id).toBe('install'));
});

it('skips an ineligible higher-priority nudge and picks the next', async () => {
  registerNudge(makeNudge('install', 20, () => false));
  registerNudge(makeNudge('rate', 10, () => true));
  const { result } = renderHook(() => useActiveNudge());
  await waitFor(() => expect(result.current?.id).toBe('rate'));
});

it('shows nothing when suppressed, even if a nudge is eligible', async () => {
  registerNudge(makeNudge('install', 20, () => true));
  const { result } = renderHook(() => useActiveNudge({ suppressed: true }));
  await waitFor(() => expect(result.current).toBeNull());
});

it('suppresses all nudges during the global cooldown after a dismiss', async () => {
  await markNudgeDismissed();
  registerNudge(makeNudge('install', 20, () => true));
  const { result } = renderHook(() => useActiveNudge());
  await waitFor(() => expect(result.current).toBeNull());
});

it('allows a nudge again once the global cooldown has elapsed', async () => {
  const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
  await AsyncStorage.setItem('nudges:lastDismissedAt', String(eightDaysAgo));
  registerNudge(makeNudge('install', 20, () => true));
  const { result } = renderHook(() => useActiveNudge());
  await waitFor(() => expect(result.current?.id).toBe('install'));
});

it('treats a throwing eligible() as not eligible and falls through', async () => {
  registerNudge(
    makeNudge('install', 20, () => {
      throw new Error('boom');
    }),
  );
  registerNudge(makeNudge('rate', 10, () => true));
  const { result } = renderHook(() => useActiveNudge());
  await waitFor(() => expect(result.current?.id).toBe('rate'));
});
