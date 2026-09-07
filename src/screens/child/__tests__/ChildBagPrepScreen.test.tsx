/**
 * ChildBagPrepScreen (ציוד tab) is a shell around PackingCard —
 * tomorrow-pack-inconsistency Phase 2. These tests lock the contract:
 * the tab hosts the same card the HQ dashboards render, for the same child
 * (View-as-Child preview wins), with tomorrow expanded by default.
 */

import { render } from '@testing-library/react-native';
import ChildBagPrepScreen from '../ChildBagPrepScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../../contexts/ThemeContext', () => ({
  useChildTheme: () => new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

const mockAuth = { profile: { id: 'child-1' } as { id: string } | null };
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => mockAuth }));

const mockMode = { previewChildId: null as string | null };
jest.mock('../../../contexts/ModeContext', () => ({ useMode: () => mockMode }));

const mockCard = jest.fn(() => null);
jest.mock('../../../components/PackingCard', () => ({
  __esModule: true,
  default: (props: unknown) => mockCard(props),
}));

beforeEach(() => {
  mockCard.mockClear();
  mockAuth.profile = { id: 'child-1' };
  mockMode.previewChildId = null;
});

describe('ChildBagPrepScreen — shell around PackingCard', () => {
  test('renders the title and hosts PackingCard with tomorrow expanded for the signed-in child', () => {
    const { getByText } = render(<ChildBagPrepScreen />);
    expect(getByText('bagPrep.title')).toBeTruthy();
    expect(mockCard).toHaveBeenCalledWith(expect.objectContaining({ childId: 'child-1', defaultTomorrowExpanded: true }));
  });

  test('View-as-Child preview takes precedence over the signed-in profile', () => {
    mockMode.previewChildId = 'child-2';
    render(<ChildBagPrepScreen />);
    expect(mockCard).toHaveBeenCalledWith(expect.objectContaining({ childId: 'child-2' }));
  });

  test('no profile and no preview → null childId (card renders nothing)', () => {
    mockAuth.profile = null;
    render(<ChildBagPrepScreen />);
    expect(mockCard).toHaveBeenCalledWith(expect.objectContaining({ childId: null }));
  });

  test('no day-off / counter / mark-all copy remains on the tab', () => {
    const { queryByText } = render(<ChildBagPrepScreen />);
    for (const key of ['bagPrep.tomorrowOff', 'bagPrep.noNeedToPack', 'bagPrep.itemsReady', 'bagPrep.checkAllItems', 'bagPrep.bagReady']) {
      expect(queryByText(key)).toBeNull();
    }
  });
});
