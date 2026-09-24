/**
 * "Grown-up sign-in" / "Hand back to {name}" note (UX review 2026-09-24).
 */
import { isFreshHandBack } from '../handBack';

const now = Date.UTC(2026, 8, 24, 12);
const note = (over: Record<string, unknown> = {}) => ({ childName: 'Emi', familyCode: 'ABC123', t: now - 60_000, ...over });

describe('isFreshHandBack', () => {
  it('accepts a recent note with a name and a 6-char code', () => {
    expect(isFreshHandBack(note(), now)).toBe(true);
  });
  it('expires after 12h', () => {
    expect(isFreshHandBack(note({ t: now - 12 * 3600_000 - 1 }), now)).toBe(false);
  });
  it('rejects malformed notes (no name, bad code, future time, null)', () => {
    expect(isFreshHandBack(note({ childName: '' }), now)).toBe(false);
    expect(isFreshHandBack(note({ familyCode: 'ABC' }), now)).toBe(false);
    expect(isFreshHandBack(note({ t: now + 60_000 }), now)).toBe(false);
    expect(isFreshHandBack(null, now)).toBe(false);
  });
});
