/**
 * ChildJoinScreen — parent-session guard (2026-10-08, family c717 churn case).
 *
 * A signed-in parent who opened the join link on their own phone was silently
 * swapped into the kid's session. The screen now asks first; hand-back
 * (autoFind) and signed-out visitors keep the old behaviour.
 */
import { render, fireEvent } from '@testing-library/react-native';
import ChildJoinScreen from '../ChildJoinScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const mockNavigate = jest.fn();
const mockReset = jest.fn();
let mockRouteParams: { code?: string; autoFind?: boolean } | undefined;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
    getState: () => ({ routeNames: ['ParentApp', 'ChildJoin'] }),
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

let mockProfile: { role: string; family_id: string; display_name: string } | null;
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ signIn: jest.fn(), refreshProfile: jest.fn(), profile: mockProfile }),
}));

const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });
jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => mockRpc(...a), auth: { signUp: jest.fn(), signOut: jest.fn() } },
}));

const mockLog = jest.fn();
jest.mock('../../../lib/onboardingFunnel', () => ({
  logOnboardingEvent: (a: unknown) => mockLog(a),
}));

jest.mock('../../../platform', () => ({ crossAlert: jest.fn() }));

const PARENT = { role: 'parent', family_id: 'fam-1', display_name: 'Marina' };

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = { code: 'ABC123' };
  mockProfile = PARENT;
});

describe('ChildJoinScreen parent guard', () => {
  it('shows the guard to a signed-in parent and logs it', () => {
    const { getByTestId, queryByText } = render(<ChildJoinScreen />);
    expect(getByTestId('join-parent-guard')).toBeTruthy();
    expect(queryByText('auth.familyCodeLabel')).toBeNull();
    expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'join_page_viewed', familyId: 'fam-1', variant: 'parent_guard',
    }));
  });

  it('"Keep me signed in" returns to the parent home, not RoleSelection', () => {
    const { getByTestId } = render(<ChildJoinScreen />);
    fireEvent.press(getByTestId('join-guard-keep'));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'ParentApp' }] });
    expect(mockNavigate).not.toHaveBeenCalledWith('RoleSelection');
    expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'join_parent_guard_choice', variant: 'keep',
    }));
  });

  it('"Switch" continues to the family-code step', () => {
    const { getByTestId, getByText, queryByTestId } = render(<ChildJoinScreen />);
    fireEvent.press(getByTestId('join-guard-switch'));
    expect(queryByTestId('join-parent-guard')).toBeNull();
    expect(getByText('auth.familyCodeLabel')).toBeTruthy();
    expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'join_parent_guard_choice', variant: 'switch',
    }));
  });

  it('Back on the code step sends a signed-in parent home, not to RoleSelection', () => {
    const { getByTestId, getByText } = render(<ChildJoinScreen />);
    fireEvent.press(getByTestId('join-guard-switch'));
    fireEvent.press(getByText('auth.back'));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'ParentApp' }] });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('hand-back (autoFind) skips the guard', () => {
    mockRouteParams = { code: 'ABC123', autoFind: true };
    const { queryByTestId } = render(<ChildJoinScreen />);
    expect(queryByTestId('join-parent-guard')).toBeNull();
  });

  it('in-app entry with no link code (Welcome "my kid joins here") skips the guard', () => {
    mockRouteParams = undefined;
    const { queryByTestId, getByText } = render(<ChildJoinScreen />);
    expect(queryByTestId('join-parent-guard')).toBeNull();
    expect(getByText('auth.familyCodeLabel')).toBeTruthy();
  });

  it('a signed-out visitor sees the code step as before', () => {
    mockProfile = null;
    const { queryByTestId, getByText } = render(<ChildJoinScreen />);
    expect(queryByTestId('join-parent-guard')).toBeNull();
    expect(getByText('auth.familyCodeLabel')).toBeTruthy();
    fireEvent.press(getByText('auth.back'));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });
});
