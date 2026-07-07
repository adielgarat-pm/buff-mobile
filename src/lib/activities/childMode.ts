/**
 * Child-authored activities (SPEC D7, revised 2026-07-07 — noaa-behavior-spec D3-A).
 *
 * Packing/gear a child adds for themselves now posts DIRECTLY (status 'active')
 * for ALL ages — there is no parent approval gate. A forgotten swimsuit is not a
 * parent-veto matter, and the buried, undiscoverable approval strip was the root
 * of Noa's "I don't understand where the parent approves this" report. The parent
 * still SEES every child-added activity in ActivitiesScreen (transparency, not
 * control). Age band still lives in profiles.pro_settings.age_group
 * ('6-8' | '9-11' | '12-14' | '15-18'); isTeenAgeGroup is retained for other
 * mode-aware UI and the open age-threshold decision (D5).
 */
export function isTeenAgeGroup(ageGroup: string | null | undefined): boolean {
  return ageGroup === '12-14' || ageGroup === '15-18';
}

/** The status + flags a child's new activity is inserted with — always active (D3-A). */
export function childAddOptions(): { status: 'active'; createdByChild: true } {
  return { status: 'active', createdByChild: true };
}
