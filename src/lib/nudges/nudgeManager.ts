/**
 * Nudge Manager — the single shared passive-nudge slot (SPEC §3.4).
 *
 * Owned by pkg/pwa-install-nudge. The install banner and the rate-us banner
 * both register here instead of each deciding independently, so the dashboard
 * shows AT MOST ONE passive nudge per visit.
 *
 * Rules:
 *   1. One slot, one winner — highest `priority` among eligible nudges.
 *   2. Priority: care/recovery > install > rate. Care prompts aren't registered
 *      here; the dashboard passes `suppressed` when one is active.
 *   3. Global cooldown — after ANY passive nudge is dismissed, suppress ALL of
 *      them for GLOBAL_COOLDOWN_DAYS so a parent isn't hit by install today and
 *      rate tomorrow. (Each nudge ALSO owns its local cooldown via eligible().)
 *   4. Never on a child-owned session — the dashboard sets `suppressed`.
 *
 * Storage: AsyncStorage (transparently localStorage on web), matching the
 * codebase convention (useVibeDismiss / useAnchorRecoveryDismiss).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NudgeId, PassiveNudge } from './types';

const registry = new Map<NudgeId, PassiveNudge>();

/** Register (or replace) a passive nudge. Idempotent by id; call at app init. */
export function registerNudge(nudge: PassiveNudge): void {
  registry.set(nudge.id, nudge);
}

/** Test-only: clear the module-level registry between tests. */
export function _resetNudgeRegistry(): void {
  registry.clear();
}

export const GLOBAL_COOLDOWN_DAYS = 7;
const LAST_DISMISSED_KEY = 'nudges:lastDismissedAt';

/** Stamp "a passive nudge was just dismissed" → starts the global cooldown. */
export async function markNudgeDismissed(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_DISMISSED_KEY, String(Date.now()));
  } catch (err) {
    if (__DEV__) console.warn('[nudgeManager] dismiss write failed:', err);
  }
}

async function inGlobalCooldown(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LAST_DISMISSED_KEY);
    if (!raw) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    const windowMs = GLOBAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - last < windowMs;
  } catch {
    return false;
  }
}

/**
 * Public read of the shared global nudge cooldown, for install-family CTAs that
 * live OUTSIDE the single dashboard slot (the entry/post-signup native-install
 * CTA) so they honour the same 7-day "recently dismissed" window. Additive — the
 * manager's own behaviour is unchanged.
 */
export async function isInGlobalNudgeCooldown(): Promise<boolean> {
  return inGlobalCooldown();
}

export interface UseActiveNudgeOptions {
  /**
   * Caller-supplied global suppressor: true when this is a child-owned session
   * OR a higher-tier care/recovery prompt is currently showing. When true, the
   * slot stays empty regardless of registrations.
   */
  suppressed?: boolean;
}

/**
 * The dashboard renders the single winning nudge: `const n = useActiveNudge();
 * return n?.render() ?? null;`. Returns null while evaluating, when suppressed,
 * during global cooldown, or when nothing is eligible.
 */
export function useActiveNudge(opts: UseActiveNudgeOptions = {}): PassiveNudge | null {
  const suppressed = opts.suppressed ?? false;
  const [active, setActive] = useState<PassiveNudge | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (suppressed) {
        if (!cancelled) setActive(null);
        return;
      }
      if (await inGlobalCooldown()) {
        if (!cancelled) setActive(null);
        return;
      }
      // Highest priority first; first eligible wins (one slot, one winner).
      const candidates = [...registry.values()].sort((a, b) => b.priority - a.priority);
      for (const nudge of candidates) {
        let ok = false;
        try {
          ok = await nudge.eligible();
        } catch (err) {
          if (__DEV__) console.warn(`[nudgeManager] eligible(${nudge.id}) threw:`, err);
        }
        if (cancelled) return;
        if (ok) {
          setActive(nudge);
          return;
        }
      }
      if (!cancelled) setActive(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [suppressed]);

  return active;
}
