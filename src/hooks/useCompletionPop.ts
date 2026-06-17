import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * useCompletionPop — a quick celebratory scale "pop" on a task card the moment
 * it goes incomplete→complete. Returns an Animated.Value to drive a transform
 * scale on the card's wrapper.
 *
 * Fires ONLY on the rising edge (not on un-complete, not on initial mount),
 * mirroring the confetti / reward-float gate, so a card that mounts already-done
 * or a re-tap stays still. Subtle + brief (~250ms overshoot then settle) so it
 * adds tactile delight without jitter, per BUFF's pillars (calm, non-gambling).
 * Shared by the Mint card (PhaseTaskCard) and the Gamer card.
 */
export function useCompletionPop(completed: boolean) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(completed);

  useEffect(() => {
    if (completed && !prev.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      ]).start();
    }
    prev.current = completed;
  }, [completed, scale]);

  return scale;
}
