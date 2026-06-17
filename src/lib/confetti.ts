/**
 * confetti — a tiny app-wide "celebrate now" event bus.
 *
 * Task completion happens on several child screens (Mint/Gamer dashboards +
 * Quests tabs), all funnelling through useChildProgress.completeTask. Rather
 * than wire celebration into each screen, completeTask emits a single event here
 * carrying the BUFFs just earned, and the app root renders the reward moment:
 * ONE <GlobalConfetti> fires the burst and ONE <GlobalRewardPop> floats the
 * "+N ⚡". Best-effort; listeners are swallowed on error so a celebration hiccup
 * never affects task completion.
 */
type Listener = (credits: number) => void;

const listeners = new Set<Listener>();

/** Fire a celebration, passing the BUFFs earned (0 if unknown). */
export function emitConfetti(credits = 0): void {
  listeners.forEach((l) => {
    try { l(credits); } catch { /* never break the caller */ }
  });
}

/** Subscribe to celebration events. Returns an unsubscribe fn. */
export function subscribeConfetti(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
