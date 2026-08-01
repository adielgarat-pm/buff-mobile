/**
 * celebrationActivity — a readable "is a celebration animating right now?" flag,
 * derived from the fire-and-forget confetti event bus.
 *
 * Why: the OTA restart toast (Layer 3) must not pop — or trigger a state-
 * discarding reload — in the middle of a reward moment (Pillar 2: never step on
 * a positive beat). The confetti bus (confetti.ts) only EMITS; it has no
 * readable "in flight" state. This module subscribes once and holds a short-
 * lived flag that stays true for the duration of the burst + reward-pop
 * (GlobalRewardPop floats for ~1200ms), then clears.
 *
 * Idempotent init; safe to import from anywhere.
 */
import { subscribeConfetti } from './confetti';

/** Cover the confetti burst + the ~1200ms reward-pop float, with headroom. */
const CELEBRATION_WINDOW_MS = 2000;

let celebratingUntil = 0;
let started = false;

/** Wire the bus subscription once. Called lazily by isCelebrating(). */
function ensureStarted(): void {
  if (started) return;
  started = true;
  subscribeConfetti(() => {
    celebratingUntil = Date.now() + CELEBRATION_WINDOW_MS;
  });
}

/** True while a celebration is within its animation window. */
export function isCelebrating(now: number = Date.now()): boolean {
  ensureStarted();
  return now < celebratingUntil;
}

/** Test seam — reset module state between tests. */
export function __resetCelebrationActivityForTest(): void {
  celebratingUntil = 0;
  started = false;
}
