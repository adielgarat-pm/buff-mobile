/**
 * offRoutineSeed — idempotently seed a child's off-routine task rows.
 *
 * Off-routine tasks are REAL `tasks` rows flagged `is_off_routine=true` and
 * scheduled every day. They are created once (the first time off-routine is
 * enabled for a child) and then simply shown/hidden by the off-routine mode —
 * no deletion on toggle-off. Completion/credit/stats all reuse the normal task
 * pipeline (a real row with real credits).
 */
import { supabase } from '../integrations/supabase/client';
import { OFF_ROUTINE_BANK } from '../screens/onboarding/unified/starterTasks/offRoutineTasks';
import type { AgeBand } from '../screens/onboarding/unified/starterTasks/types';
import { pickLang } from './i18nString';

const VALID_BANDS: AgeBand[] = ['6-8', '9-11', '12-14', '15-18'];

function normalizeBand(ageGroup: string | null | undefined): AgeBand {
  return ageGroup && (VALID_BANDS as string[]).includes(ageGroup)
    ? (ageGroup as AgeBand)
    : '9-11';
}

/**
 * Ensure the child has off-routine tasks. No-op if they already exist
 * (idempotent — the parent can toggle on/off repeatedly).
 * Titles are written in the child's language at insert time.
 */
export async function ensureOffRoutineTasks(opts: {
  childId:  string;
  familyId: string;
  ageGroup: string | null | undefined;
  lang:     'he' | 'en';
}): Promise<{ created: number; error?: string }> {
  const { childId, familyId, ageGroup, lang } = opts;

  const { count, error: countErr } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_to', childId)
    .eq('is_off_routine', true);

  if (countErr) return { created: 0, error: countErr.message };
  if ((count ?? 0) > 0) return { created: 0 };

  const bank = OFF_ROUTINE_BANK[normalizeBand(ageGroup)];
  const rows = bank.map(def => ({
    family_id:       familyId,
    assigned_to:     childId,
    title:           pickLang(def.title, lang),
    time:            def.time,
    category:        def.category,
    credits:         def.credits,
    icon:            def.icon,
    schedule_days:   [0, 1, 2, 3, 4, 5, 6],
    hide_on_weekend: false,
    is_off_routine:  true,
  }));

  const { error: insErr } = await supabase.from('tasks').insert(rows as never);
  if (insErr) return { created: 0, error: insErr.message };
  return { created: rows.length };
}
