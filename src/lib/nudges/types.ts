/**
 * Passive-nudge contract — the shared single-slot system on the parent
 * dashboard. Owned by pkg/pwa-install-nudge (SPEC §3.4); consumed by
 * pkg/rate-us-port (which registers a 'rate' nudge but edits nothing here).
 *
 * A "passive nudge" is an opportunistic, dismissible prompt (install BUFF,
 * rate BUFF). At most ONE shows per visit — the Nudge Manager arbitrates by
 * priority + a global cooldown so the dashboard is never stacked.
 */
import type { ReactNode } from 'react';

export type NudgeId = 'install' | 'install-native' | 'rate';

export interface PassiveNudge {
  /** Stable id; also the storage namespace for the nudge's own cooldown. */
  id: NudgeId;
  /** Higher wins when several are eligible at once. See NUDGE_PRIORITY. */
  priority: number;
  /**
   * Per-nudge gating: platform, install/already-done state, the nudge's own
   * dismiss cooldown, engagement threshold, etc. May be async (reads storage).
   * Throwing is treated as "not eligible" — never crashes the dashboard.
   */
  eligible: () => boolean | Promise<boolean>;
  /** The banner/card to render in the slot when this nudge wins. */
  render: () => ReactNode;
}

/**
 * Priority order (high → low): care/recovery prompts are NOT in this registry
 * — they win via the `suppressed` flag the dashboard passes to the manager.
 * Among registered passive nudges: install-native > install (PWA) > rate. On
 * android-web the native "get the app" nudge outranks the PWA add-to-home one,
 * so the single slot shows native; iOS/desktop have no native offer, so the PWA
 * nudge wins there. rate is the politest ask and yields to everything.
 */
export const NUDGE_PRIORITY: Record<NudgeId, number> = {
  'install-native': 25,
  install: 20,
  rate: 10,
};
