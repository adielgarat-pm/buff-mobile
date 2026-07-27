/**
 * Tests for the capture usability metric (migration 047).
 *
 * summarizeReview is the whole point: it turns "what the AI proposed" vs "what
 * the parent confirmed" into the Trust Rate and Edit Rate. No network — the
 * supabase client is mocked (importing the real one opens a realtime socket).
 */
import { supabase } from '../../../integrations/supabase/client';
import {
  baselineFromEntries,
  logCaptureConfirm,
  summarizeReview,
  type ReviewEntryLike,
} from '../captureMetrics';

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

/** Mock from('capture_runs').update(payload).eq('id', runId) */
function mockUpdateChain() {
  const eq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn(() => ({ eq }));
  mockedFrom.mockReturnValue({ update } as never);
  return { update, eq };
}

beforeEach(() => {
  jest.clearAllMocks();
});

function entry(
  id: string,
  owner: 'parent' | 'child',
  childId: string | null,
  discarded = false,
): ReviewEntryLike {
  return { parsed: { id }, owner, childId, discarded };
}

describe('summarizeReview', () => {
  it('counts kept and discarded, and reports no edits when nothing changed', () => {
    const entries = [
      entry('g0', 'child', 'kid-1'),
      entry('g1', 'parent', null),
      entry('g2', 'parent', null, true),
    ];
    const baseline = baselineFromEntries(entries);

    expect(summarizeReview(entries, baseline)).toEqual({
      keptCount: 2,
      discardedCount: 1,
      editedCount: 0,
    });
  });

  it('counts an owner change and a re-assignment to another child as edits', () => {
    const original = [
      entry('g0', 'parent', null), // AI said "this is on you"
      entry('g1', 'child', 'kid-1'), // AI picked the wrong kid
      entry('g2', 'child', 'kid-2'), // AI got it right
    ];
    const baseline = baselineFromEntries(original);

    const confirmed = [
      entry('g0', 'child', 'kid-1'),
      entry('g1', 'child', 'kid-2'),
      entry('g2', 'child', 'kid-2'),
    ];

    expect(summarizeReview(confirmed, baseline)).toEqual({
      keptCount: 3,
      discardedCount: 0,
      editedCount: 2,
    });
  });

  it('does not count a discarded item as edited even if it was re-assigned first', () => {
    const original = [entry('g0', 'parent', null)];
    const baseline = baselineFromEntries(original);
    const confirmed = [entry('g0', 'child', 'kid-1', true)];

    expect(summarizeReview(confirmed, baseline)).toEqual({
      keptCount: 0,
      discardedCount: 1,
      editedCount: 0,
    });
  });

  it('treats an item with no baseline as unedited rather than inflating the edit rate', () => {
    const confirmed = [entry('g0', 'child', 'kid-1')];

    expect(summarizeReview(confirmed, {})).toEqual({
      keptCount: 1,
      discardedCount: 0,
      editedCount: 0,
    });
  });

  it('returns all-zero for an empty review (no items returned)', () => {
    expect(summarizeReview([], {})).toEqual({
      keptCount: 0,
      discardedCount: 0,
      editedCount: 0,
    });
  });
});

describe('logCaptureConfirm', () => {
  it('stamps the counts and confirmed_at on the run row', async () => {
    const { update, eq } = mockUpdateChain();

    await logCaptureConfirm('run-1', { keptCount: 4, discardedCount: 2, editedCount: 1 });

    expect(mockedFrom).toHaveBeenCalledWith('capture_runs');
    const payload = update.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.kept_count).toBe(4);
    expect(payload.discarded_count).toBe(2);
    expect(payload.edited_count).toBe(1);
    expect(typeof payload.confirmed_at).toBe('string');
    expect(eq).toHaveBeenCalledWith('id', 'run-1');
  });

  it('is a no-op when the server could not log the run', async () => {
    mockUpdateChain();

    await logCaptureConfirm(null, { keptCount: 1, discardedCount: 0, editedCount: 0 });

    expect(mockedFrom).not.toHaveBeenCalled();
  });
});
