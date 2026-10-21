/**
 * RoutineEditor (pkg/anchor-routine-onboarding M3) — edits hit the saved rows
 * by id + assigned_to, the minimum is enforced, a failed write reloads from the
 * DB, and a moment switch inserts the new routine before deleting the old one.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: { time?: string }) => (o?.time ? `${k}:${o.time}` : k) }),
}));
jest.mock('../../../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));

type Call = { table: string; op: string; payload?: unknown; filters: [string, string, unknown][] };
const mockCalls: Call[] = [];
const mockFail = { value: false };
const mockReloadRows = { value: [] as { id: string; title: string; time: string }[] };

jest.mock('../../../../integrations/supabase/client', () => {
  const make = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] };
    const chain: Record<string, unknown> = {};
    const result = () => {
      if (call.op === 'select') return { data: mockReloadRows.value, error: null };
      if (mockFail.value) return { data: null, error: { message: 'boom' } };
      if (call.op === 'insert') {
        const rows = call.payload as { title: string; time: string }[];
        return { data: rows.map((r, i) => ({ id: `new-${i}`, title: r.title, time: r.time })), error: null };
      }
      return { data: [{ id: 'x' }], error: null };
    };
    chain.update = jest.fn((p) => { call.op = 'update'; call.payload = p; mockCalls.push(call); return chain; });
    chain.delete = jest.fn(() => { call.op = 'delete'; mockCalls.push(call); return chain; });
    chain.insert = jest.fn((p) => { call.op = 'insert'; call.payload = p; mockCalls.push(call); return chain; });
    chain.select = jest.fn(() => chain);
    chain.eq = jest.fn((c, v) => { call.filters.push(['eq', c, v]); return chain; });
    chain.in = jest.fn((c, v) => { call.filters.push(['in', c, v]); return chain; });
    chain.then = (res: (v: unknown) => unknown) => Promise.resolve(result()).then(res);
    return chain;
  };
  return { supabase: { from: jest.fn((t: string) => make(t)) } };
});

import { RoutineEditor } from '../RoutineEditor';

const rows = [
  { id: 'a', title: 'Get dressed', time: '07:00' },
  { id: 'b', title: 'Teeth', time: '07:05' },
  { id: 'c', title: 'Breakfast', time: '07:10' },
  { id: 'd', title: 'Bag', time: '07:15' },
  { id: 'e', title: 'Shoes', time: '07:20' },
];

const regenerate = jest.fn(() => [
  { id: 'g1', title: { en: 'Pack bag', he: 'תיק' }, buff_value: 20, timeOfDay: 'evening', time: '19:30', category: 'organization', domain: 3, sexLean: 'both', evidenceTag: 'x', source: 'routine:evening' },
  { id: 'g2', title: { en: 'Clothes', he: 'בגדים' }, buff_value: 20, timeOfDay: 'evening', time: '19:40', category: 'self-care', domain: 1, sexLean: 'both', evidenceTag: 'x', source: 'routine:evening' },
]) as never;
const buildTaskRows = jest.fn((list: { title: { en: string }; time: string }[]) =>
  list.map((t) => ({ assigned_to: 'kid-1', title: t.title.en, time: t.time })));

const renderEditor = () => render(
  <RoutineEditor
    familyId="fam-1" childId="kid-1" initialRows={rows} initialMoment="morning" isRTL={false}
    regenerate={regenerate} buildTaskRows={buildTaskRows as never}
  />,
);

beforeEach(() => { mockCalls.length = 0; mockFail.value = false; mockReloadRows.value = []; jest.clearAllMocks(); });

it('renames a step on the saved row, scoped to the child', async () => {
  const { getByTestId } = renderEditor();
  fireEvent.press(getByTestId('onb5-title-b'));
  fireEvent.changeText(getByTestId('onb5-title-input-b'), '  Brush   teeth ');
  fireEvent(getByTestId('onb5-title-input-b'), 'submitEditing');
  await waitFor(() => expect(mockCalls.some((c) => c.op === 'update')).toBe(true));
  const upd = mockCalls.find((c) => c.op === 'update')!;
  expect(upd.payload).toEqual({ title: 'Brush teeth' });
  expect(upd.filters).toEqual(expect.arrayContaining([['eq', 'id', 'b'], ['eq', 'assigned_to', 'kid-1']]));
});

it('shifts every step by 15 minutes', async () => {
  const { getByTestId, findByText } = renderEditor();
  fireEvent.press(getByTestId('onb5-later'));
  await findByText('onboarding.step5.routine.startsAt:07:15');
  await waitFor(() => expect(mockCalls.filter((c) => c.op === 'update')).toHaveLength(5));
  expect(mockCalls.map((c) => (c.payload as { time: string }).time)).toEqual(['07:15', '07:20', '07:25', '07:30', '07:35']);
});

it('removes a step but never below four', async () => {
  const { getByTestId, queryByTestId } = renderEditor();
  fireEvent.press(getByTestId('onb5-remove-e'));
  await waitFor(() => expect(mockCalls.some((c) => c.op === 'delete')).toBe(true));
  expect(queryByTestId('onb5-title-e')).toBeNull();
  // 4 left → no remove buttons
  await waitFor(() => expect(queryByTestId('onb5-remove-a')).toBeNull());
});

it('a failed write shows the error and reloads the rows from the DB', async () => {
  mockFail.value = true;
  mockReloadRows.value = rows;
  const { getByTestId, findByText } = renderEditor();
  fireEvent.press(getByTestId('onb5-remove-e'));
  await findByText('onboarding.step5.routine.saveError');
  expect(getByTestId('onb5-title-e')).toBeTruthy(); // restored from reload
});

it('switching the moment inserts the new routine, then deletes the old steps', async () => {
  const { getByTestId, findByText } = renderEditor();
  fireEvent.press(getByTestId('onb5-moment-evening'));
  await findByText('Pack bag');
  expect(regenerate).toHaveBeenCalledWith('evening');
  const ops = mockCalls.map((c) => c.op);
  expect(ops.indexOf('insert')).toBeLessThan(ops.indexOf('delete'));
  const del = mockCalls.find((c) => c.op === 'delete')!;
  expect(del.filters).toEqual(expect.arrayContaining([['in', 'id', ['a', 'b', 'c', 'd', 'e']], ['eq', 'assigned_to', 'kid-1']]));
});
