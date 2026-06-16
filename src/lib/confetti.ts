/**
 * confetti — a tiny app-wide "celebrate now" event bus.
 *
 * Task completion happens on several child screens (Mint/Gamer dashboards +
 * Quests tabs), all funnelling through useChildProgress.completeTask. Rather
 * than wire a confetti overlay into each screen, completeTask emits a single
 * event here and ONE <GlobalConfetti> mounted at the app root renders the burst
 * — same pattern as the completion sound (src/lib/sfx). Best-effort; listeners
 * are swallowed on error so a confetti hiccup never affects task completion.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Fire a celebration. Called from completeTask on a real incomplete→complete. */
export function emitConfetti(): void {
  listeners.forEach((l) => {
    try { l(); } catch { /* never break the caller */ }
  });
}

/** Subscribe to confetti events. Returns an unsubscribe fn. */
export function subscribeConfetti(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
