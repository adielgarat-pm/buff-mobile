/**
 * GlobalConfetti — single app-root confetti overlay.
 *
 * Subscribes to the confetti event bus (src/lib/confetti). Each emit bumps a
 * counter used as the ConfettiBurst `key`, remounting it so the burst replays
 * from the start on every task completion. Mounted once in App.tsx so it
 * overlays whatever child screen is active.
 */
import { useEffect, useState } from 'react';
import { ConfettiBurst } from './ConfettiBurst';
import { subscribeConfetti } from '../lib/confetti';

export function GlobalConfetti() {
  const [burst, setBurst] = useState(0);

  useEffect(() => subscribeConfetti(() => setBurst((b) => b + 1)), []);

  if (burst === 0) return null;
  // key={burst} → fresh ConfettiBurst instance each emit → animation replays.
  return <ConfettiBurst key={burst} play />;
}
