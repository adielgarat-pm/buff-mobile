/**
 * firstWinTelemetry — guards the two child-side First Win events
 * (pkg/first-win P0): once-per-session child_first_open, and a first_task_complete
 * that is logged only when the child had no counted completion before.
 */
const mockLog = jest.fn();
jest.mock('../onboardingFunnel', () => ({ logOnboardingEvent: (a: unknown) => mockLog(a) }));

// Chainable PostgREST stub; the terminal `.or()` resolves the count result.
const mockResult: { count: number | null; error: unknown } = { count: 0, error: null };
const mockOr = jest.fn(() => Promise.resolve(mockResult));
const mockChain = { select: jest.fn(), eq: jest.fn(), is: jest.fn(), or: mockOr };
mockChain.select.mockReturnValue(mockChain);
mockChain.eq.mockReturnValue(mockChain);
mockChain.is.mockReturnValue(mockChain);
jest.mock('../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn(() => mockChain) },
}));

import {
  logChildFirstOpen, isFirstCountedCompletion, logFirstWin,
  COUNTED_SOURCES_FILTER, __resetFirstWinTelemetryForTests,
} from '../firstWinTelemetry';

beforeEach(() => {
  jest.clearAllMocks();
  __resetFirstWinTelemetryForTests();
  mockResult.count = 0; mockResult.error = null;
});

describe('logChildFirstOpen', () => {
  it('logs child_first_open once per child+source per session', () => {
    logChildFirstOpen({ familyId: 'f1', childId: 'c1', source: 'child_device' });
    logChildFirstOpen({ familyId: 'f1', childId: 'c1', source: 'child_device' });
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith({
      familyId: 'f1', eventType: 'child_first_open', childId: 'c1', source: 'child_device',
    });
  });

  it('logs a handover separately from the child device', () => {
    logChildFirstOpen({ familyId: 'f1', childId: 'c1', source: 'child_device' });
    logChildFirstOpen({ familyId: 'f1', childId: 'c1', source: 'view_as_child' });
    expect(mockLog).toHaveBeenCalledTimes(2);
  });

  it('skips without a family or child', () => {
    logChildFirstOpen({ familyId: null, childId: 'c1', source: 'child_device' });
    logChildFirstOpen({ familyId: 'f1', childId: null, source: 'child_device' });
    expect(mockLog).not.toHaveBeenCalled();
  });
});

describe('isFirstCountedCompletion', () => {
  it('is true when the child has no counted completion yet', async () => {
    await expect(isFirstCountedCompletion('c1')).resolves.toBe(true);
  });

  it('counts legacy NULL-source rows (the NOT IN trap) and handover sources (D1)', async () => {
    await isFirstCountedCompletion('c1');
    expect(mockOr).toHaveBeenCalledWith(COUNTED_SOURCES_FILTER);
    expect(COUNTED_SOURCES_FILTER).toContain('source.is.null');
    expect(COUNTED_SOURCES_FILTER).toContain('view_as_child');
    expect(COUNTED_SOURCES_FILTER).toContain('onboarding_handoff');
    expect(COUNTED_SOURCES_FILTER).not.toContain('onboarding_first_task');
    expect(COUNTED_SOURCES_FILTER).not.toMatch(/[,(]parent[,)]/);
  });

  it('is false once a counted completion exists, and then answers from memory', async () => {
    mockResult.count = 3;
    await expect(isFirstCountedCompletion('c1')).resolves.toBe(false);
    await expect(isFirstCountedCompletion('c1')).resolves.toBe(false);
    expect(mockOr).toHaveBeenCalledTimes(1);
  });

  it('never invents a first win when the query fails, and retries next time', async () => {
    mockResult.count = null; mockResult.error = { message: 'boom' };
    await expect(isFirstCountedCompletion('c1')).resolves.toBe(false);
    mockResult.count = 0; mockResult.error = null;
    await expect(isFirstCountedCompletion('c1')).resolves.toBe(true);
    expect(mockOr).toHaveBeenCalledTimes(2);
  });

  it('two quick completions share one check: only the first is the first win', async () => {
    const [a, b] = await Promise.all([isFirstCountedCompletion('c1'), isFirstCountedCompletion('c1')]);
    expect([a, b]).toEqual([true, false]);
    expect(mockOr).toHaveBeenCalledTimes(1);
    await expect(isFirstCountedCompletion('c1')).resolves.toBe(false);
  });
});

describe('logFirstWin', () => {
  it('logs first_task_complete with the source, and suppresses later checks', async () => {
    logFirstWin({ familyId: 'f1', childId: 'c1', source: 'view_as_child' });
    expect(mockLog).toHaveBeenCalledWith({
      familyId: 'f1', eventType: 'first_task_complete', childId: 'c1', source: 'view_as_child',
    });
    await expect(isFirstCountedCompletion('c1')).resolves.toBe(false);
    expect(mockOr).not.toHaveBeenCalled();
  });
});
