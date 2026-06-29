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
});
