/**
 * successDay — the ONE shared count-based success rule (D-2026-06-14).
 *
 * A successful day = min(3, assigned) completed tasks, never a % of the
 * whole list (with 9-20 tasks a 70% bar is unreachable and reads as
 * permanent failure to the child). These tests pin the rule for every
 * child surface that consumes it: Focus Fuel bar (both dashboards),
 * egg-crack/hatch progression, and the goal-hint copy interpolation.
 */
import {
  SUCCESS_DAY_FLOOR,
  isActiveDay,
  successGoal,
  fuelProgressPct,
  eggCrackStage,
} from '../successDay';

describe('successGoal — goal = min(3, assigned)', () => {
  it('is 0 when no tasks are assigned (rest day, nothing to chase)', () => {
    expect(successGoal(0)).toBe(0);
  });

  it('matches the task count on tiny days (1-2 tasks stay reachable)', () => {
    expect(successGoal(1)).toBe(1);
    expect(successGoal(2)).toBe(2);
  });

  it('caps at the floor of 3 for regular and heavy days', () => {
    expect(successGoal(3)).toBe(3);
    expect(successGoal(9)).toBe(3);
    expect(successGoal(10)).toBe(3);
    expect(successGoal(20)).toBe(3);
  });

  it('never goes negative on bad input', () => {
    expect(successGoal(-4)).toBe(0);
  });

  it('stays in lockstep with SUCCESS_DAY_FLOOR', () => {
    expect(successGoal(Number.MAX_SAFE_INTEGER)).toBe(SUCCESS_DAY_FLOOR);
  });
});

describe('fuelProgressPct — bar fills by done / goal, capped at 100', () => {
  it('is 0 on a zero-task day (empty bar, not NaN)', () => {
    expect(fuelProgressPct(0, 0)).toBe(0);
    expect(fuelProgressPct(5, 0)).toBe(0);
  });

  it('fills in thirds toward a 3-task goal on a 10-task day', () => {
    expect(fuelProgressPct(0, 10)).toBe(0);
    expect(fuelProgressPct(1, 10)).toBe(33);
    expect(fuelProgressPct(2, 10)).toBe(67);
    expect(fuelProgressPct(3, 10)).toBe(100);
  });

  it('caps at 100 when the child completes beyond the goal', () => {
    expect(fuelProgressPct(7, 10)).toBe(100);
    expect(fuelProgressPct(10, 10)).toBe(100);
  });

  it('reaches 100 at the full count on tiny days', () => {
    expect(fuelProgressPct(1, 1)).toBe(100);
    expect(fuelProgressPct(1, 2)).toBe(50);
    expect(fuelProgressPct(2, 2)).toBe(100);
  });

  it('clamps negative completed counts to an empty bar', () => {
    expect(fuelProgressPct(-1, 10)).toBe(0);
  });
});

describe('eggCrackStage — cracks keyed to completions, hatch at the goal', () => {
  it('stays intact with no tasks assigned or none done', () => {
    expect(eggCrackStage(0, 0)).toBe(0);
    expect(eggCrackStage(0, 10)).toBe(0);
  });

  it('1 done = first crack, 2 = second crack, 3 (goal) = hatch on a big day', () => {
    expect(eggCrackStage(1, 10)).toBe(1);
    expect(eggCrackStage(2, 10)).toBe(2);
    expect(eggCrackStage(3, 10)).toBe(3);
  });

  it('never regresses past hatch when the child keeps completing', () => {
    expect(eggCrackStage(4, 10)).toBe(3);
    expect(eggCrackStage(20, 20)).toBe(3);
  });

  it('hatches at the full count on tiny days (goal = min(3, total))', () => {
    expect(eggCrackStage(1, 1)).toBe(3); // 1-task day: one completion hatches
    expect(eggCrackStage(1, 2)).toBe(1); // 2-task day: first crack…
    expect(eggCrackStage(2, 2)).toBe(3); // …then hatch
  });

  it('exactly-3-task day walks crack1 → crack2 → hatch', () => {
    expect(eggCrackStage(1, 3)).toBe(1);
    expect(eggCrackStage(2, 3)).toBe(2);
    expect(eggCrackStage(3, 3)).toBe(3);
  });

  it('clamps negative completed counts to intact', () => {
    expect(eggCrackStage(-1, 5)).toBe(0);
  });
});

describe('isActiveDay agrees with successGoal (atGoal semantics)', () => {
  it.each([
    [0, 0, false],  // rest day
    [0, 10, false],
    [2, 10, false], // below goal
    [3, 10, true],  // at goal
    [9, 10, true],
    [1, 1, true],   // tiny-day goal reachable
    [1, 2, false],
    [2, 2, true],
  ])('completed=%i assigned=%i → active=%s', (completed, assigned, expected) => {
    expect(isActiveDay(completed, assigned)).toBe(expected);
    // atGoal must be exactly "reached the count goal on a day with tasks"
    expect(isActiveDay(completed, assigned)).toBe(
      assigned > 0 && completed >= successGoal(assigned),
    );
  });
});
