/**
 * i18nString — single source of truth for bilingual string handling.
 *
 * BUFF stores some user-facing strings in two language flavors:
 *
 *   1. As an in-memory `I18nString` object: `{ en: string; he: string }`
 *      — used in onboarding seed data (`STARTER_TASKS_BY_CHALLENGE`,
 *      `REWARD_PICKS`, `FALLBACK_TASKS`, `FALLBACK_REWARDS`) before being
 *      written to the DB.
 *
 *   2. As two columns on a DB row: `{ title: string; title_he: string | null }`
 *      — currently used by `store_rewards`. The `title` column holds the
 *      English/legacy value; `title_he` holds the Hebrew variant when
 *      available.
 *
 * Every read or write that picks ONE language out of these structures
 * MUST go through one of the helpers here. Direct access to `.en` / `.he`
 * (on `I18nString`) or `.title_he` (on a row) outside this file is banned
 * by an ESLint `no-restricted-syntax` rule — see `eslint.config.js`.
 *
 * Why the rule exists: the same bug class ("English default leaks into
 * Hebrew users' DB or UI") regressed twice with the same root cause and
 * no guardrail. The two fingerprints were (a) onboarding INSERT
 * hardcoding `t.title.en` in UStep5_Preview even though a `lang` variable
 * was computed inline; (b) reward SELECT omitting `title_he` even though
 * the column was populated correctly at INSERT time. Both surfaces were
 * "incomplete plumbing" — bilingual on one side, monolingual on the
 * other. Centralising the picking logic + lint-blocking direct access
 * makes future bilingual fields opt-in to correctness rather than opt-out.
 *
 * See: docs/INTEGRATION_LEARNINGS.md IN-2026-05-27-04
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * In-memory bilingual literal.
 *
 * Used in onboarding seed data and any other static content that needs to
 * be available in both languages at compile time. The Hebrew side is
 * non-optional: every literal in code is expected to be authored in both
 * languages. (Runtime DB rows are different — see `BilingualColumns`.)
 */
export type I18nString = { en: string; he: string };

/**
 * DB row shape with bilingual columns. `title_he` is optional because
 * legacy rows (created before bilingual storage) may have NULL.
 *
 * Use this shape for any read path against a table that stores both
 * languages side-by-side (today: `store_rewards`; potentially future
 * tables).
 */
export type BilingualColumns = {
  title:     string;
  title_he?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve a bilingual `{en, he}` literal to a single string for the
 * active locale.
 *
 * - Returns Hebrew when `lang` starts with "he" AND `s.he` is a
 *   non-empty string.
 * - Falls back to `s.en` otherwise.
 * - Never returns `undefined`.
 *
 * @example
 *   pickLang({ en: 'Brush teeth', he: 'לצחצח שיניים' }, 'he')   // → 'לצחצח שיניים'
 *   pickLang({ en: 'Brush teeth', he: 'לצחצח שיניים' }, 'en')   // → 'Brush teeth'
 *   pickLang({ en: 'Brush teeth', he: '' },             'he')   // → 'Brush teeth'  (empty he falls back)
 *   pickLang({ en: 'Brush teeth', he: 'לצחצח' },        'he-IL') // → 'לצחצח'      (locale variant)
 */
export function pickLang(s: I18nString, lang: string): string {
  if (lang.startsWith('he') && s.he) return s.he;
  return s.en;
}

/**
 * Resolve a DB row with bilingual columns to a single string for the
 * active locale.
 *
 * - Returns `row.title_he` when `lang` starts with "he" AND the column
 *   is a non-empty string.
 * - Falls back to `row.title` otherwise (covers both English locale and
 *   legacy rows where `title_he` is NULL).
 * - Never returns `undefined` assuming `row.title` is set (which the
 *   DB schema requires).
 *
 * @example
 *   pickI18nColumn({ title: 'Family movie',  title_he: 'ערב סרט' }, 'he') // → 'ערב סרט'
 *   pickI18nColumn({ title: 'Family movie',  title_he: null      }, 'he') // → 'Family movie'  (legacy row)
 *   pickI18nColumn({ title: 'ערב סרט',       title_he: null      }, 'he') // → 'ערב סרט'      (user-typed Hebrew in title)
 */
export function pickI18nColumn(row: BilingualColumns, lang: string): string {
  if (lang.startsWith('he') && row.title_he) return row.title_he;
  return row.title;
}

/**
 * Convert a bilingual `I18nString` literal into the DB column shape used
 * by tables that store both languages side-by-side (e.g. `store_rewards`).
 *
 * Use this at INSERT time when the target table has both `title` and
 * `title_he` columns. Spread the result directly into the row object.
 *
 * The English value is preserved verbatim into `title` (the legacy
 * column); the Hebrew value goes into `title_he`. This convention is
 * mirrored at read time by `pickI18nColumn`.
 *
 * @example
 *   const rewardRow = {
 *     family_id: familyId,
 *     ...bilingualForDb(reward.title),  // adds title + title_he
 *     emoji: reward.emoji,
 *   };
 */
export function bilingualForDb(s: I18nString): { title: string; title_he: string } {
  return { title: s.en, title_he: s.he };
}

/**
 * Infer the intended language for a child from the script their display
 * name was typed in. Used when writing per-child monolingual content (e.g.
 * onboarding starter task titles, which live in the single `tasks.title`
 * column) so a Hebrew-named child gets Hebrew tasks and a Latin-named child
 * gets English ones — independent of the app's global UI locale.
 *
 * - Any Hebrew letter present → 'he' (Hebrew wins for mixed-script names,
 *   matching the Israel-first MVP default).
 * - Otherwise any Latin letter present → 'en'.
 * - Neither (empty, digits, emoji only) → 'he' (Israel-first fallback).
 *
 * @example
 *   detectLangFromName('איתי')  // → 'he'
 *   detectLangFromName('Emi')   // → 'en'
 *   detectLangFromName('')      // → 'he'
 */
export function detectLangFromName(name: string | null | undefined): 'he' | 'en' {
  if (!name) return 'he';
  if (/[֐-׿]/.test(name)) return 'he';
  if (/[A-Za-z]/.test(name)) return 'en';
  return 'he';
}

/**
 * Minimal shape of a child profile this helper reads. Accepts the full
 * `Profile` (its `pro_settings` is `Record<string, unknown>`) as well as the
 * lighter rows fetched by EditChild / ModeContext.
 */
export type ChildLangSource = {
  pro_settings?: { language?: unknown; language_source?: unknown } | Record<string, unknown> | null;
  display_name?: string | null;
};

/**
 * Resolve the language a single child should see, in priority order:
 *
 *   1. An EXPLICIT stored language (`pro_settings.language`) — one whose
 *      `pro_settings.language_source` is NOT a machine guess. 'parent'
 *      (EditChild toggle) is explicit; legacy rows with no source predate the
 *      field and were either parent-set or deliberately data-fixed
 *      (IN-2026-06-25-01), so they are treated as explicit too — status quo.
 *      Machine-guessed values ('inferred' from onboarding name-script,
 *      'device' from a previous own-device binding) are overridable.
 *   2. `deviceLang`, when `opts.ownDevice` is set — on a child's OWN device
 *      the device locale IS the child's locale, the strongest signal we have
 *      (D-2026-07-21: fixes the Latin-name→English trap for own-device kids
 *      without reintroducing the parent-device-locale bug of IN-2026-05-29-04).
 *   3. A machine-guessed stored language (shared device has no device signal,
 *      so the onboarding guess still beats re-guessing).
 *   4. The script of the child's display name (`detectLangFromName`).
 *   5. `deviceLang` as the final fallback (no stored preference, no name).
 *
 * @example
 *   resolveChildLang({ pro_settings: { language: 'en' }, display_name: 'דני' })  // → 'en' (legacy stored wins)
 *   resolveChildLang(
 *     { pro_settings: { language: 'en', language_source: 'inferred' }, display_name: 'Gur' },
 *     'he', { ownDevice: true },
 *   )                                                                             // → 'he' (own device beats guess)
 *   resolveChildLang({ pro_settings: {}, display_name: 'איתי' })                  // → 'he' (name script)
 *   resolveChildLang({ pro_settings: null, display_name: '' }, 'en')              // → 'en' (device fallback)
 */
export function resolveChildLang(
  child: ChildLangSource,
  deviceLang: 'he' | 'en' = 'he',
  opts?: { ownDevice?: boolean },
): 'he' | 'en' {
  const ps = child.pro_settings as { language?: unknown; language_source?: unknown } | null;
  const stored = ps?.language;
  const validStored = stored === 'he' || stored === 'en' ? stored : null;
  const machineGuessed = ps?.language_source === 'inferred' || ps?.language_source === 'device';

  if (validStored && !machineGuessed) return validStored;
  if (opts?.ownDevice) return deviceLang;
  if (validStored) return validStored;

  const name = child.display_name;
  if (name && name.trim()) return detectLangFromName(name);

  return deviceLang;
}
