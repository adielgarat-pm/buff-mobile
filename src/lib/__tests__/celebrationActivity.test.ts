/**
 * Tests for celebrationActivity — the readable "is a celebration animating?"
 * flag derived from the confetti event bus.
 */
import { emitConfetti } from '../confetti';
import { isCelebrating, __resetCelebrationActivityForTest } from '../celebrationActivity';

describe('celebrationActivity', () => {
  beforeEach(() => __resetCelebrationActivityForTest());

  test('not celebrating before any event', () => {
    // First call also wires the bus subscription (lazy init).
    expect(isCelebrating()).toBe(false);
  });

  test('true within the window after an emit, false after it elapses', () => {
    isCelebrating(); // ensure subscribed before emitting
    const base = Date.now();
    emitConfetti(5);
    expect(isCelebrating(base + 500)).toBe(true); // inside the ~2s window
    expect(isCelebrating(base + 5000)).toBe(false); // past the window
  });
});
