/**
 * Teen vs Children mode for child-authored activities (SPEC D7).
 *
 * Teen (12+) adds directly → status 'active'. Children (under 12) propose →
 * status 'proposed' for parent approval. Age band lives in
 * profiles.pro_settings.age_group ('6-8' | '9-11' | '12-14' | '15-18').
 */
export function isTeenAgeGroup(ageGroup: string | null | undefined): boolean {
  return ageGroup === '12-14' || ageGroup === '15-18';
}

/** The status + flags a child's new activity should be inserted with. */
export function childAddOptions(ageGroup: string | null | undefined): {
  status: 'active' | 'proposed';
  createdByChild: true;
} {
  return { status: isTeenAgeGroup(ageGroup) ? 'active' : 'proposed', createdByChild: true };
}
