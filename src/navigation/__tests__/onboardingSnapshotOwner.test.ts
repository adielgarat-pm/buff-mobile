/**
 * Regression (2026-09-24): the web resume snapshot lives in browser storage,
 * not per account. Parent B signing up on a browser where parent A had stopped
 * mid-onboarding was offered "Pick up where you left off with <A's child>".
 */
import * as fs from 'fs';
import * as path from 'path';
import { snapshotBelongsTo, type OnboardingSnapshot } from '../onboardingRoutes';

const snap = (uid?: string): OnboardingSnapshot => ({
  route: 'UStep3_Challenges',
  params: { childName: 'KidA' } as OnboardingSnapshot['params'],
  t: Date.now(),
  uid,
});

describe('snapshotBelongsTo', () => {
  it('offers the snapshot back to its owner', () => {
    expect(snapshotBelongsTo(snap('parent-a'), 'parent-a')).toBe(true);
  });
  it('never to another parent on the same device', () => {
    expect(snapshotBelongsTo(snap('parent-a'), 'parent-b')).toBe(false);
  });
  it('treats unowned (pre-fix) snapshots and missing users as foreign', () => {
    expect(snapshotBelongsTo(snap(undefined), 'parent-a')).toBe(false);
    expect(snapshotBelongsTo(snap('parent-a'), null)).toBe(false);
    expect(snapshotBelongsTo(null, 'parent-a')).toBe(false);
  });
});

describe('RootNavigator wiring', () => {
  const root = fs.readFileSync(path.join(__dirname, '..', 'RootNavigator.tsx'), 'utf8');
  it('stamps saved snapshots with the user and filters the resume offer by it', () => {
    expect(root).toMatch(/uid:\s+userIdRef\.current/);
    expect(root).toMatch(/snapshotBelongsTo\(restoredSnap, user\?\.id\)/);
  });
});
