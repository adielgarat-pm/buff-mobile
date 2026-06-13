import {
  PACKING_TEMPLATE_LIBRARY,
  TEMPLATE_BY_ID,
  templateToEquipment,
} from '../catalog';

describe('PACKING_TEMPLATE_LIBRARY', () => {
  it('has unique template ids', () => {
    const ids = PACKING_TEMPLATE_LIBRARY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique item ids within each template', () => {
    for (const tpl of PACKING_TEMPLATE_LIBRARY) {
      const ids = tpl.items.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every item carries both he and en labels', () => {
    for (const tpl of PACKING_TEMPLATE_LIBRARY) {
      for (const item of tpl.items) {
        expect(item.label.en.length).toBeGreaterThan(0);
        expect(item.label.he.length).toBeGreaterThan(0);
      }
    }
  });

  it('every template has at least one default-applied item', () => {
    for (const tpl of PACKING_TEMPLATE_LIBRARY) {
      expect(tpl.items.some((i) => i.defaultApplies)).toBe(true);
    }
  });

  it('TEMPLATE_BY_ID indexes all templates', () => {
    expect(Object.keys(TEMPLATE_BY_ID).sort()).toEqual(
      PACKING_TEMPLATE_LIBRARY.map((t) => t.id).sort(),
    );
  });
});

describe('templateToEquipment', () => {
  it('returns only default-applied items', () => {
    const pool = TEMPLATE_BY_ID['pool_day'];
    const expected = pool.items.filter((i) => i.defaultApplies).length;
    expect(templateToEquipment('pool_day', 'en')).toHaveLength(expected);
  });

  it('picks Hebrew labels for a he locale', () => {
    const eq = templateToEquipment('pool_day', 'he');
    expect(eq).toContain('בגד ים'); // swimsuit, defaultApplies
    expect(eq).not.toContain('כובע'); // hat, not default
  });

  it('picks English labels for an en locale', () => {
    const eq = templateToEquipment('pool_day', 'en');
    expect(eq).toContain('Swimsuit');
  });

  it('returns [] for an unknown template', () => {
    expect(templateToEquipment('does_not_exist', 'en')).toEqual([]);
  });
});
