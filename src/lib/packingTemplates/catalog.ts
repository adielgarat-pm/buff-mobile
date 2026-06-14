/**
 * Packing-template library — pure data.
 *
 * SEED CONTENT (Adi to finalise): pool_day / day_camp / overnight_camp. Items
 * are bilingual literals; `defaultApplies` decides what is pre-checked when the
 * template is applied to a new activity. Final lists are a DATA edit here — the
 * generator (templateToEquipment) never changes.
 *
 * Phase 2 of pkg/activities-and-camp-lists. See SPEC §"Data model".
 */
import type { PackingTemplateDef } from './types';

export const PACKING_TEMPLATE_LIBRARY: PackingTemplateDef[] = [
  {
    id: 'pool_day',
    title: { en: 'Pool day', he: 'יום בריכה' },
    icon: 'water-outline',
    defaultSchedule: 'oneoff',
    items: [
      { id: 'swimsuit',  label: { en: 'Swimsuit',     he: 'בגד ים' },       defaultApplies: true },
      { id: 'towel',     label: { en: 'Towel',        he: 'מגבת' },         defaultApplies: true },
      { id: 'sunscreen', label: { en: 'Sunscreen',    he: 'קרם הגנה' },     defaultApplies: true },
      { id: 'hat',       label: { en: 'Hat',          he: 'כובע' },         defaultApplies: false },
      { id: 'water',     label: { en: 'Water bottle', he: 'בקבוק מים' },    defaultApplies: true },
      { id: 'flipflops', label: { en: 'Flip-flops',   he: 'כפכפים' },       defaultApplies: false },
      { id: 'goggles',   label: { en: 'Goggles',      he: 'משקפת שחייה' },  defaultApplies: false },
    ],
  },
  {
    id: 'day_camp',
    title: { en: 'Day camp', he: 'קייטנת יום' },
    icon: 'sunny-outline',
    defaultSchedule: 'recurring',
    items: [
      { id: 'water',      label: { en: 'Water bottle',     he: 'בקבוק מים' },       defaultApplies: true },
      { id: 'hat',        label: { en: 'Hat',              he: 'כובע' },            defaultApplies: true },
      { id: 'snack',      label: { en: 'Snack / food',     he: 'אוכל / חטיף' },     defaultApplies: true },
      { id: 'change',     label: { en: 'Change of clothes', he: 'בגדים להחלפה' },   defaultApplies: true },
      { id: 'sunscreen',  label: { en: 'Sunscreen',        he: 'קרם הגנה' },        defaultApplies: true },
      { id: 'swimsuit',   label: { en: 'Swimsuit',         he: 'בגד ים' },          defaultApplies: false },
      { id: 'towel',      label: { en: 'Towel',            he: 'מגבת' },            defaultApplies: false },
    ],
  },
  {
    id: 'overnight_camp',
    title: { en: 'Overnight camp', he: 'שינה בחוץ' },
    icon: 'moon-outline',
    defaultSchedule: 'oneoff',
    items: [
      { id: 'sleeping_bag', label: { en: 'Sleeping bag',       he: 'שק שינה' },          defaultApplies: true },
      { id: 'clothes',      label: { en: 'Clothes',            he: 'בגדים' },            defaultApplies: true },
      { id: 'utensils',     label: { en: 'Reusable utensils',  he: 'כלי אוכל רב-פעמיים' }, defaultApplies: true },
      { id: 'wipes',        label: { en: 'Wipes',              he: 'מגבונים' },          defaultApplies: true },
      { id: 'toothbrush',   label: { en: 'Toothbrush',         he: 'מברשת שיניים' },     defaultApplies: true },
      { id: 'flashlight',   label: { en: 'Flashlight',         he: 'פנס' },              defaultApplies: false },
      { id: 'water',        label: { en: 'Water bottle',       he: 'בקבוק מים' },        defaultApplies: true },
      { id: 'warm_layer',   label: { en: 'Warm layer',         he: 'שכבה חמה' },         defaultApplies: false },
    ],
  },
];

/** Fast lookup by template id. */
export const TEMPLATE_BY_ID: Record<string, PackingTemplateDef> = Object.fromEntries(
  PACKING_TEMPLATE_LIBRARY.map((t) => [t.id, t]),
);

/**
 * Resolve a template's default-checked items to a flat equipment list in the
 * given language. This is what pre-fills Activity.equipment at creation; the
 * parent then edits the list freely (it is a copy, not a live link).
 */
export function templateToEquipment(templateId: string, lang: string): string[] {
  const tpl = TEMPLATE_BY_ID[templateId];
  if (!tpl) return [];
  const he = lang.startsWith('he');
  return tpl.items
    .filter((i) => i.defaultApplies)
    .map((i) => (he && i.label.he ? i.label.he : i.label.en));
}
