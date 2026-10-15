/**
 * uniqueTopic — realtime channel topics never collide, even in one millisecond.
 *
 * Also a regression test for the 2026-10-14 web blank screen: two
 * useFamilyMembers instances mounted in the same commit (ParentDashboardScreen
 * + CoachTrialNote, both via useSubscription) got the same Date.now() topic,
 * so supabase returned the already-subscribed channel and .on() threw.
 */
import { renderHook } from '@testing-library/react-native';
import { uniqueTopic } from '../realtimeTopic';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';

// Mimics realtime-js: channel(topic) returns the registered channel for that
// topic, and .on() throws once that channel has been subscribed.
const mockRegistry = new Map<string, { subscribed: boolean }>();
jest.mock('../../integrations/supabase/client', () => {
  const makeChannel = (topic: string) => {
    let state = mockRegistry.get(topic);
    if (!state) { state = { subscribed: false }; mockRegistry.set(topic, state); }
    const s = state;
    const chan = {
      on: () => {
        if (s.subscribed) throw new Error(`cannot add \`postgres_changes\` callbacks for realtime:${topic} after \`subscribe()\`.`);
        return chan;
      },
      subscribe: () => { s.subscribed = true; return chan; },
    };
    return chan;
  };
  const query: any = {
    select: () => query, eq: () => query, order: () => query,
    then: (res: any) => Promise.resolve({ data: [], error: null }).then(res),
  };
  return {
    supabase: {
      channel: jest.fn((topic: string) => makeChannel(topic)),
      removeChannel: jest.fn(),
      from: jest.fn(() => query),
    },
  };
});

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: 'fam-1' }),
}));

describe('uniqueTopic', () => {
  it('returns different topics for calls in the same millisecond', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const a = uniqueTopic('family-members-fam-1');
    const b = uniqueTopic('family-members-fam-1');
    expect(a).not.toBe(b);
    expect(a.startsWith('family-members-fam-1-')).toBe(true);
    now.mockRestore();
  });
});

describe('useFamilyMembers realtime', () => {
  it('two instances mounted in the same millisecond do not throw', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    expect(() => {
      renderHook(() => { useFamilyMembers(); useFamilyMembers(); });
    }).not.toThrow();
    now.mockRestore();
  });
});
