/**
 * Tests for the parse round-trip guard rails (2026-07-28 stuck-spinner fix).
 *
 * Production data showed a real Gemini parse taking 60-90s with NO timeout on
 * either side: a lost response meant the spinner ran forever and the feature
 * read as broken. These tests pin the two guarantees the fix added:
 *   1. the client call ALWAYS settles (withTimeout backstop → typed 'timeout');
 *   2. the server's typed statuses (402/429/504) map to the right error codes.
 * No network — the supabase client is mocked.
 */
import { supabase } from '../../../integrations/supabase/client';
import {
  CaptureParseError,
  PARSE_TIMEOUT_MS,
  parseCapture,
  withTimeout,
} from '../parseCapture';

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

const mockedInvoke = supabase.functions.invoke as jest.MockedFunction<
  typeof supabase.functions.invoke
>;

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('withTimeout', () => {
  it('passes a resolution through and clears the timer', async () => {
    jest.useFakeTimers();
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('passes a rejection through unchanged', async () => {
    jest.useFakeTimers();
    const boom = new Error('boom');
    await expect(withTimeout(Promise.reject(boom), 1000)).rejects.toBe(boom);
  });

  it('rejects with CaptureParseError(timeout) and fires onTimeout when time runs out', async () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();
    const never = new Promise<never>(() => {});
    const p = withTimeout(never, 5000, onTimeout);
    const assertion = expect(p).rejects.toMatchObject({ code: 'timeout' });
    jest.advanceTimersByTime(5000);
    await assertion;
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});

describe('parseCapture', () => {
  const input = { kind: 'text', text: 'שיעור מחשבים יום חמישי 13:00' } as const;

  it('returns items + runId on success and aborts nothing', async () => {
    mockedInvoke.mockResolvedValue({
      data: { items: [{ id: 'g0', title: 'x' }], run_id: 'run-1' },
      error: null,
    } as never);
    const res = await parseCapture(input, 'fam-1', 'he', null);
    expect(res.items).toHaveLength(1);
    expect(res.runId).toBe('run-1');
    // The invoke must carry an abort signal so the timeout can cancel it.
    const opts = mockedInvoke.mock.calls[0][1] as { signal?: AbortSignal };
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    [402, 'premium_required'],
    [429, 'rate_limited'],
    [504, 'timeout'],
    [500, 'generic'],
  ])('maps HTTP %s to CaptureParseError(%s)', async (status, code) => {
    mockedInvoke.mockResolvedValue({
      data: null,
      error: { message: 'err', context: { status } },
    } as never);
    await expect(parseCapture(input, 'fam-1')).rejects.toMatchObject({
      name: 'CaptureParseError',
      code,
    });
  });

  it('settles with timeout (and aborts the request) if the invoke never resolves', async () => {
    jest.useFakeTimers();
    let seenSignal: AbortSignal | undefined;
    mockedInvoke.mockImplementation(((_fn: string, opts: { signal?: AbortSignal }) => {
      seenSignal = opts.signal;
      return new Promise(() => {}); // dead connection — never settles
    }) as never);
    const p = parseCapture(input, 'fam-1');
    const assertion = expect(p).rejects.toMatchObject({ code: 'timeout' });
    jest.advanceTimersByTime(PARSE_TIMEOUT_MS);
    await assertion;
    expect(seenSignal?.aborted).toBe(true);
  });

  it('exposes the timeout as a CaptureParseError instance', async () => {
    jest.useFakeTimers();
    mockedInvoke.mockImplementation((() => new Promise(() => {})) as never);
    const p = parseCapture(input, 'fam-1').catch((e) => e);
    jest.advanceTimersByTime(PARSE_TIMEOUT_MS);
    expect(await p).toBeInstanceOf(CaptureParseError);
  });
});
