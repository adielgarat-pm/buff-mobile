/**
 * starterTaskRetitle — swap baked starter-task titles to a child's new language.
 *
 * `tasks.title` is monolingual, picked at INSERT time from the bilingual
 * onboarding libraries. When a child's language changes later (EditChild
 * toggle, own-device locale binding) those baked titles go stale in the old
 * language. This retitles ONLY rows whose title exactly matches a library
 * string — user-authored tasks are never touched (they are the language
 * *signal*, not the target).
 *
 * Best-effort by design: from a child session RLS may block the tasks UPDATE
 * (0 rows) — callers treat the returned count as informational.
 */
import { supabase } from '../integrations/supabase/client';
import { STARTER_TASK_LIBRARY } from '../screens/onboarding/unified/starterTasks/taskLibrary';
import { STARTER_TASKS_BY_CHALLENGE, FALLBACK_TASKS } from '../screens/onboarding/unified/onboardingData';
import { pickLang, type I18nString } from './i18nString';

function allLibraryTitles(): I18nString[] {
  // The NEW engine library is listed FIRST because it is the canonical source;
  // buildRetitleMap keeps the first mapping for a given key (see below), so on a
  // cross-library collision the engine's variant wins over the legacy library.
  return [
    ...STARTER_TASK_LIBRARY.map((t) => t.title),
    ...Object.values(STARTER_TASKS_BY_CHALLENGE).flat().map((t) => t.title),
    ...FALLBACK_TASKS.map((t) => t.title),
  ];
}

/**
 * Map of old-language title → new-language title, exact library matches only.
 * Exported for tests.
 *
 * Some English titles exist in BOTH the new engine library and the legacy
 * `STARTER_TASKS_BY_CHALLENGE` with slightly different Hebrew (e.g. "Lay out
 * tomorrow's clothes" → `…למחר` (engine) vs `…לבוקר` (legacy)). We keep the
 * FIRST mapping seen — and the engine library is listed first — so the engine's
 * canonical variant wins instead of the legacy one (audit L6). Previously this
 * used last-writer-wins, so the legacy title silently overwrote the engine's.
 */
export function buildRetitleMap(newLang: 'he' | 'en'): Map<string, string> {
  const map = new Map<string, string>();
  for (const title of allLibraryTitles()) {
    const from = pickLang(title, newLang === 'he' ? 'en' : 'he');
    const to = pickLang(title, newLang);
    if (from && to && from !== to && !map.has(from)) map.set(from, to);
  }
  return map;
}

/**
 * Retitle the child's library-matching tasks to `newLang`.
 * Returns the number of rows actually updated.
 */
export async function retitleStarterTasks(childId: string, newLang: 'he' | 'en'): Promise<number> {
  const map = buildRetitleMap(newLang);

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('assigned_to', childId);

  if (error || !data) {
    if (error) console.warn('[starterTaskRetitle] tasks read failed:', error.message);
    return 0;
  }

  const stale = (data as { id: string; title: string }[]).filter((t) => map.has(t.title));
  let updated = 0;
  for (const t of stale) {
    const { data: rows, error: upErr } = await supabase
      .from('tasks')
      .update({ title: map.get(t.title) as string })
      .eq('id', t.id)
      .select('id');
    if (upErr) {
      console.warn('[starterTaskRetitle] update failed:', upErr.message);
    } else if (rows && rows.length > 0) {
      updated++;
    }
  }
  return updated;
}
