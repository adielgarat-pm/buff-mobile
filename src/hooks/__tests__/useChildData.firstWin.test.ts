/**
 * pkg/first-win P0 — the completeTask wiring for the first-win event.
 * Guards: only child-screen sources can log a first win; never on a failed
 * write; never on a re-tap of an already-completed task; logged with the
 * source the row was written with.
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';

const mockAuth: { profile: { id: string; role: string } } = { profile: { id: 'child-1', role: 'child' } };
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: 'fam-1', profile: mockAuth.profile }),
}));
jest.mock('../usePetState', () => ({ applyTaskCompletionToPet: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/confetti', () => ({ emitConfetti: jest.fn() }));

const mockIsFirst = jest.fn(() => Promise.resolve(true));
const mockLogFirstWin = jest.fn();
jest.mock('../../lib/firstWinTelemetry', () => ({
  isFirstCountedCompletion: (id: string) => mockIsFirst(id),
  logFirstWin: (a: unknown) => mockLogFirstWin(a),
}));

// Generic PostgREST stub: every builder method chains; awaiting a chain gives
// an empty list; maybeSingle gives the "existing row" state; upsert gives the
// configured write result.
const mockState = { existingCompleted: false, upsertError: null as unknown, upserts: [] as unknown[] };
jest.mock('../../integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  for (const m of ['select', 'eq', 'neq', 'in', 'is', 'or', 'order', 'limit', 'gte', 'lte', 'lt', 'gt', 'not', 'filter', 'match', 'contains', 'range'])
    chain[m] = jest.fn(self);
  chain.maybeSingle = jest.fn(() => Promise.resolve({ data: { completed: mockState.existingCompleted }, error: null }));
  chain.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
  chain.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res);
  chain.upsert = jest.fn((row: unknown) => { mockState.upserts.push(row); return Promise.resolve({ error: mockState.upsertError }); });
  chain.update = jest.fn(self);
  chain.insert = jest.fn(() => Promise.resolve({ error: null }));
  return {
    supabase: {
      from: jest.fn(() => chain),
      rpc: jest.fn(() => Promise.resolve({ data: { ok: true, new_balance: 20 }, error: null })),
      channel: jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn().mockReturnThis() })),
      removeChannel: jest.fn(),
    },
  };
});

import { useChildData } from '../useChildProgress';

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.profile = { id: 'child-1', role: 'child' };
  mockState.existingCompleted = false;
  mockState.upsertError = null;
  mockState.upserts = [];
  mockIsFirst.mockImplementation(() => Promise.resolve(true));
});

async function complete() {
  const { result } = renderHook(() => useChildData('child-1'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => { await result.current.completeTask('task-1'); });
}

describe('completeTask → first win', () => {
  it('logs first_task_complete with source child_device after a successful write', async () => {
    await complete();
    expect(mockState.upserts).toHaveLength(1);
    expect(mockLogFirstWin).toHaveBeenCalledWith({ familyId: 'fam-1', childId: 'child-1', source: 'child_device' });
  });

  it('never logs when the write fails', async () => {
    mockState.upsertError = { message: 'rls' };
    await complete();
    expect(mockLogFirstWin).not.toHaveBeenCalled();
  });

  it('never checks or logs on a re-tap of an already-completed task', async () => {
    mockState.existingCompleted = true;
    await complete();
    expect(mockIsFirst).not.toHaveBeenCalled();
    expect(mockLogFirstWin).not.toHaveBeenCalled();
  });

  it('never checks or logs for a parent surface (source parent)', async () => {
    mockAuth.profile = { id: 'parent-1', role: 'parent' };
    await complete();
    expect(mockIsFirst).not.toHaveBeenCalled();
    expect(mockLogFirstWin).not.toHaveBeenCalled();
  });

  it('does not log when the child already had a counted completion', async () => {
    mockIsFirst.mockImplementation(() => Promise.resolve(false));
    await complete();
    expect(mockLogFirstWin).not.toHaveBeenCalled();
  });
});
