import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockMode = { isChildPreview: false };
jest.mock('../../../contexts/ModeContext', () => ({ useMode: () => mockMode }));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ familyId: 'fam-1' }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => (k === 'concierge.bookingLink' ? 'https://cal.com/adi-elgarat-german-buff' : k) }),
}));
const mockCount = { value: 0 as number | null };
jest.mock('../../../integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'is']) chain[m] = jest.fn(() => chain);
  chain.or = jest.fn(() => Promise.resolve({ count: mockCount.value, error: null }));
  return { supabase: { from: jest.fn(() => chain) } };
});
const mockOpen = jest.fn(() => true);
const mockDismiss = jest.fn(() => Promise.resolve());
const mockDismissed = { value: false };
jest.mock('../../../lib/concierge', () => {
  const actual = jest.requireActual('../../../lib/concierge');
  return {
    ...actual,
    openConcierge: (a: unknown) => mockOpen(a),
    dismissConcierge: (f: unknown) => mockDismiss(f),
    isConciergeDismissed: () => Promise.resolve(mockDismissed.value),
    logConciergeSeen: jest.fn(),
  };
});

import { ConciergeCallCard } from '../ConciergeCallCard';

const recent = [new Date(Date.now() - 2 * 86400000).toISOString()];

beforeEach(() => { jest.clearAllMocks(); mockCount.value = 0; mockDismissed.value = false; mockMode.isChildPreview = false; });

it('renders for a no-win family and books via the dashboard placement', async () => {
  const { findByTestId } = render(<ConciergeCallCard childCreatedAts={recent} />);
  fireEvent.press(await findByTestId('concierge-pick'));
  expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining({ placement: 'dashboard', familyId: 'fam-1' }));
});

it('"No thanks" hides it and records the dismissal', async () => {
  const { findByTestId, queryByTestId } = render(<ConciergeCallCard childCreatedAts={recent} />);
  fireEvent.press(await findByTestId('concierge-dismiss'));
  expect(mockDismiss).toHaveBeenCalledWith('fam-1');
  expect(queryByTestId('concierge-card')).toBeNull();
});

it('stays hidden once the family has a first win', async () => {
  mockCount.value = 3;
  const { queryByTestId } = render(<ConciergeCallCard childCreatedAts={recent} />);
  await waitFor(() => expect(queryByTestId('concierge-card')).toBeNull());
});

it('stays hidden when previously dismissed, and in View-as-Child', async () => {
  mockDismissed.value = true;
  const a = render(<ConciergeCallCard childCreatedAts={recent} />);
  await waitFor(() => expect(a.queryByTestId('concierge-card')).toBeNull());
  mockDismissed.value = false; mockMode.isChildPreview = true;
  const b = render(<ConciergeCallCard childCreatedAts={recent} />);
  await waitFor(() => expect(b.queryByTestId('concierge-card')).toBeNull());
});
