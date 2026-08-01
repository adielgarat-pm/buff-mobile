/**
 * Tests for evaluateSafeSurface — the pure predicate gating the OTA restart
 * toast (Layer 3). Each guard is exercised independently, plus the happy path.
 */
import { evaluateSafeSurface, SafeSurfaceInputs, SAFE_ROUTE } from '../safeSurface';

const SAFE: SafeSurfaceInputs = {
  routeName: SAFE_ROUTE,
  viewMode: 'parent',
  isChildPreview: false,
  isPauseActive: false,
  isForeground: true,
  settled: true,
  celebrating: false,
};

describe('evaluateSafeSurface', () => {
  test('safe on a settled, foreground parent tab shell', () => {
    expect(evaluateSafeSurface(SAFE)).toEqual({ safe: true });
  });

  test.each<[string, Partial<SafeSurfaceInputs>, string]>([
    ['backgrounded', { isForeground: false }, 'background'],
    ['not settled yet', { settled: false }, 'settling'],
    ['pause mode active', { isPauseActive: true }, 'pause_mode'],
    ['view-as-child', { isChildPreview: true }, 'view_as_child'],
    ['child mode', { viewMode: 'child' }, 'child_mode'],
    ['celebration in flight', { celebrating: true }, 'celebrating'],
  ])('suppresses when %s', (_label, override, reason) => {
    expect(evaluateSafeSurface({ ...SAFE, ...override })).toEqual({ safe: false, reason });
  });

  test('suppresses over a modal/editor/paywall (route != ParentApp)', () => {
    expect(evaluateSafeSurface({ ...SAFE, routeName: 'Paywall' })).toEqual({
      safe: false,
      reason: 'route:Paywall',
    });
    expect(evaluateSafeSurface({ ...SAFE, routeName: 'EditChild' }).safe).toBe(false);
    expect(evaluateSafeSurface({ ...SAFE, routeName: 'ChildApp' }).safe).toBe(false);
    expect(evaluateSafeSurface({ ...SAFE, routeName: null })).toEqual({
      safe: false,
      reason: 'route:none',
    });
  });

  test('foreground/settle take precedence over a safe route', () => {
    // ordering: a backgrounded parent tab still reports "background", not safe.
    expect(evaluateSafeSurface({ ...SAFE, isForeground: false }).reason).toBe('background');
  });
});
