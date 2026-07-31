/**
 * The exposure rule for the Activities & gear entry card.
 *
 * A parallel of the Smart Organizer's entryTelemetry test, guarding the same
 * property on a SEPARATE Set: the dashboard re-renders on every refresh and
 * remounts on every navigation, and none of those may produce a second
 * exposure. The separate Set is the whole point — it must not share state with
 * the capture card, or whichever rendered first would swallow the other's
 * exposure. That independence is covered by each module owning its own test.
 */
import {
  shouldLogActivitiesEntrySeen,
  __resetActivitiesEntryTelemetryForTests,
} from '../entryTelemetry';

beforeEach(() => __resetActivitiesEntryTelemetryForTests());

describe('shouldLogActivitiesEntrySeen', () => {
  it('logs the first exposure of a session', () => {
    expect(shouldLogActivitiesEntrySeen('fam-1')).toBe(true);
  });

  it('does not log again for the same family — a re-render is not a new exposure', () => {
    expect(shouldLogActivitiesEntrySeen('fam-1')).toBe(true);
    expect(shouldLogActivitiesEntrySeen('fam-1')).toBe(false);
    expect(shouldLogActivitiesEntrySeen('fam-1')).toBe(false);
  });

  it('counts a co-parent on a second family separately', () => {
    expect(shouldLogActivitiesEntrySeen('fam-1')).toBe(true);
    expect(shouldLogActivitiesEntrySeen('fam-2')).toBe(true);
    expect(shouldLogActivitiesEntrySeen('fam-1')).toBe(false);
  });

  // The card mounts before AuthContext has resolved the profile. Marking the
  // session as counted at that point would swallow the real exposure entirely.
  it('never counts a session while familyId is still unknown', () => {
    expect(shouldLogActivitiesEntrySeen(null)).toBe(false);
    expect(shouldLogActivitiesEntrySeen(undefined)).toBe(false);
    expect(shouldLogActivitiesEntrySeen('')).toBe(false);
    // …and the real id, once it arrives, still logs.
    expect(shouldLogActivitiesEntrySeen('fam-1')).toBe(true);
  });
});
