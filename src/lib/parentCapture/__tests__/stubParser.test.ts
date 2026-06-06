import { stubParse } from '../stubParser';

const TODAY = { todayISO: '2026-06-05' };

describe('stubParse', () => {
  test('empty / whitespace text -> no items (no ghosts)', async () => {
    expect(await stubParse({ kind: 'text', text: '   ' })).toEqual([]);
  });

  test('non-empty text -> items with valid shape', async () => {
    const items = await stubParse({ kind: 'text', text: 'concert and homework' }, TODAY);
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(typeof it.title).toBe('string');
      expect(['task', 'event', 'schedule', 'reference']).toContain(it.type);
      expect(['parent', 'child']).toContain(it.owner);
      expect(['matched', 'no_match', 'unknown']).toContain(it.relevance);
      expect(['high', 'medium', 'low']).toContain(it.confidence);
    }
  });

  test('includes a no_match item (noise-filtering surface)', async () => {
    const items = await stubParse({ kind: 'text', text: 'x' }, TODAY);
    expect(items.some((i) => i.relevance === 'no_match')).toBe(true);
  });

  test('includes a parent/child split via linkedEvent', async () => {
    const items = await stubParse({ kind: 'text', text: 'x' }, TODAY);
    const linked = items.filter((i) => i.linkedEvent === 'grade-4-concert');
    expect(linked.some((i) => i.owner === 'parent')).toBe(true);
    expect(linked.some((i) => i.owner === 'child')).toBe(true);
  });

  test('image input -> single item', async () => {
    const items = await stubParse({ kind: 'image', imageUri: 'file://x' }, TODAY);
    expect(items.length).toBe(1);
  });
});
