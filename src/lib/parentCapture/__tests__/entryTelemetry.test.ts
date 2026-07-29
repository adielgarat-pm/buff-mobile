/**
 * The exposure rule for the Smart Organizer entry card.
 *
 * This is the only instrumentation that can tell "parents never saw the card"
 * from "saw it and were not convinced" — and those two findings lead to opposite
 * fixes. If the counter inflates, the distinction is lost, so the dedup itself is
 * worth pinning: the dashboard re-renders on every refresh and remounts on every
 * navigation, and each of those must NOT produce a second exposure.
 */
import { shouldLogEntrySeen, __resetEntryTelemetryForTests } from '../entryTelemetry';

beforeEach(() => __resetEntryTelemetryForTests());

describe('shouldLogEntrySeen', () => {
  it('logs the first exposure of a session', () => {
    expect(shouldLogEntrySeen('fam-1')).toBe(true);
  });

  it('does not log again for the same family — a re-render is not a new exposure', () => {
    expect(shouldLogEntrySeen('fam-1')).toBe(true);
    expect(shouldLogEntrySeen('fam-1')).toBe(false);
    expect(shouldLogEntrySeen('fam-1')).toBe(false);
  });

  it('counts a co-parent on a second family separately', () => {
    expect(shouldLogEntrySeen('fam-1')).toBe(true);
    expect(shouldLogEntrySeen('fam-2')).toBe(true);
    expect(shouldLogEntrySeen('fam-1')).toBe(false);
  });

  // The card mounts before AuthContext has resolved the profile. Marking the
  // session as counted at that point would swallow the real exposure entirely.
  it('never counts a session while familyId is still unknown', () => {
    expect(shouldLogEntrySeen(null)).toBe(false);
    expect(shouldLogEntrySeen(undefined)).toBe(false);
    expect(shouldLogEntrySeen('')).toBe(false);
    // …and the real id, once it arrives, still logs.
    expect(shouldLogEntrySeen('fam-1')).toBe(true);
  });
});
