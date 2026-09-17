import { getStateFromPath } from '@react-navigation/native';
import { linking } from '../linking';

/** Walk a nav state to its deepest active route (the screen that renders). */
function deepestRoute(state: any): any {
  let r = state?.routes?.[state.index ?? 0] ?? state?.routes?.[0];
  while (r?.state) r = r.state.routes[r.state.index ?? 0] ?? r.state.routes[0];
  return r;
}

describe('linking — smart join route (web + native parity)', () => {
  it('maps /join/:code to ChildJoin with the code param (the path the Web PWA receives)', () => {
    const state = getStateFromPath('join/ABC123', linking.config);
    expect(state).toBeTruthy();
    const route = deepestRoute(state);
    expect(route.name).toBe('ChildJoin');
    expect(route.params).toMatchObject({ code: 'ABC123' });
  });

  it('registers the https smart-link hosts (App Link buffadhd.com + Web PWA www) and the buff:// scheme', () => {
    expect(linking.prefixes).toEqual(
      expect.arrayContaining([
        'buff://',
        'https://buffadhd.com',
        'https://www.buffadhd.com',
      ]),
    );
  });

  // Shared-computer child join (bug 2026-09-17): the auth-entry deep links the
  // marketing site promises (…/RoleSelection, …/Login) and the smart join link
  // (/join/:code) must resolve on web even when a parent session is present.
  // RootNavigator now registers these screens in the parent-authed branches too;
  // this guards the path→screen contract the fix relies on.
  it('maps /RoleSelection and /Login so the marketing-site deep links resolve on a cold web load', () => {
    expect(deepestRoute(getStateFromPath('RoleSelection', linking.config)).name).toBe('RoleSelection');
    expect(deepestRoute(getStateFromPath('Login', linking.config)).name).toBe('Login');
  });
});
