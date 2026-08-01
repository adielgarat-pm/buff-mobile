/**
 * firstLaunchDecision — the pure, testable core of Layer 1 (first-launch
 * freshness). The hook (useFirstLaunchFreshness) wires timers/async/expo-updates
 * around these; the branching itself lives here so it can be unit-tested.
 */

/** Should we gate the splash to wait for a fresh OTA, or skip straight through? */
export function decideFirstLaunch(i: {
  flag: string | null;
  enabled: boolean;
  isDev: boolean;
}): 'skip' | 'gate' {
  if (i.isDev) return 'skip'; // never in dev
  if (!i.enabled) return 'skip'; // updates disabled / Expo Go / sideload
  if (i.flag) return 'skip'; // already ran once on this install
  return 'gate'; // genuine first launch
}

/**
 * Given we are gating, should we reload NOW because a pending update arrived?
 * Must be false after the timeout fired (late fetch must not yank the user) or
 * once we've already acted this launch.
 */
export function shouldReloadOnPending(i: {
  gated: boolean;
  isUpdatePending: boolean;
  timedOut: boolean;
  acted: boolean;
}): boolean {
  return i.gated && i.isUpdatePending && !i.timedOut && !i.acted;
}
