/**
 * useStepReachedLog — records that a parent reached an onboarding wizard step.
 *
 * The rules worth guarding are the ones that keep the derived drop-step honest:
 *   - one row per (family, step) per JS session — a parent bouncing back and
 *     forth between steps must not inflate the count;
 *   - different steps for the same family are distinct exposures;
 *   - no family scope → no row (RLS would reject it anyway);
 *   - it never throws — instrumentation must not break the wizard.
 *
 * Each test uses a fresh familyId so the module-level session Set can't leak
 * between cases (mirrors useInsightViewLog.test); the reset export is also
 * called in beforeEach as a belt-and-braces guard.
 */
import { renderHook } from '@testing-library/react-native';

import { useStepReachedLog, __resetStepReachedLogForTests } from '../useStepReachedLog';
import { logOnboardingEvent } from '../../lib/onboardingFunnel';

jest.mock('../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));

const mockedLog = logOnboardingEvent as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  __resetStepReachedLogForTests();
});

describe('useStepReachedLog', () => {
  it('logs a step_reached event with the step id as variant', () => {
    renderHook(() => useStepReachedLog('1_child_profile', 'fam-a'));
    expect(mockedLog).toHaveBeenCalledTimes(1);
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      familyId:  'fam-a',
      eventType: 'onboarding_step_reached',
      source:    'onboarding',
      variant:   '1_child_profile',
    }));
  });

  it('does not log without a family scope', () => {
    renderHook(() => useStepReachedLog('2_goal', null));
    expect(mockedLog).not.toHaveBeenCalled();
  });

  it('logs once per (family, step) across re-renders', () => {
    const { rerender } = renderHook(() => useStepReachedLog('3_challenges', 'fam-b'));
    rerender({});
    rerender({});
    expect(mockedLog).toHaveBeenCalledTimes(1);
  });

  it('treats different steps of the same family as distinct exposures', () => {
    renderHook(() => useStepReachedLog('1_child_profile', 'fam-c'));
    renderHook(() => useStepReachedLog('2_goal', 'fam-c'));
    expect(mockedLog).toHaveBeenCalledTimes(2);
  });

  it('treats the same step for different families as distinct exposures', () => {
    renderHook(() => useStepReachedLog('4_motivator', 'fam-d'));
    renderHook(() => useStepReachedLog('4_motivator', 'fam-e'));
    expect(mockedLog).toHaveBeenCalledTimes(2);
  });

  it('does not re-log a family+step once seen this session', () => {
    renderHook(() => useStepReachedLog('5_preview', 'fam-f'));
    renderHook(() => useStepReachedLog('5_preview', 'fam-f'));
    expect(mockedLog).toHaveBeenCalledTimes(1);
  });
});
