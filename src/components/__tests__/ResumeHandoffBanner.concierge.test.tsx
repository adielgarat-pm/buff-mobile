/** pkg/concierge-call — the handoff banner carries the call offer (one card). */
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => (k === 'concierge.bookingLink' ? 'https://cal.com/adi-elgarat-german-buff' : k) }),
}));
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ familyId: 'fam-1' }) }));
jest.mock('../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));
jest.mock('../../lib/shareInvite', () => ({ shareInvite: jest.fn(() => Promise.resolve()) }));
const mockRows = { value: [] as { child_id: string }[] };
jest.mock('../../integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  chain.select = jest.fn(() => chain);
  chain.in = jest.fn(() => Promise.resolve({ data: mockRows.value, error: null }));
  chain.eq = jest.fn(() => chain);
  return { supabase: { from: jest.fn(() => chain) } };
});
const mockConcierge = { hasFirstWin: false as boolean | null, dismissed: false };
jest.mock('../../hooks/useConciergeState', () => ({
  useConciergeState: () => ({ ...mockConcierge, dismiss: jest.fn() }),
}));
const mockOpen = jest.fn(() => true);
jest.mock('../../lib/concierge', () => {
  const actual = jest.requireActual('../../lib/concierge');
  return { ...actual, openConcierge: (a: unknown) => mockOpen(a), logConciergeSeen: jest.fn() };
});

import ResumeHandoffBanner from '../ResumeHandoffBanner';

const child = (daysAgo: number) => ({
  childId: 'c1', displayName: 'Noa', avatar: '', created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  tasksCompleted: 0, tasksTotal: 3, totalBalance: 0, accessMode: null,
});

beforeEach(() => { jest.clearAllMocks(); mockRows.value = []; mockConcierge.hasFirstWin = false; mockConcierge.dismissed = false; });

it('shows the call line inside the banner in the first 14 days and books via handoff_banner', async () => {
  const onVisible = jest.fn();
  const { findByTestId } = render(<ResumeHandoffBanner familyChildren={[child(2)]} familyShortCode="NOA123" onVisibleChange={onVisible} />);
  fireEvent.press(await findByTestId('handoff-concierge'));
  expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining({ placement: 'handoff_banner', familyId: 'fam-1' }));
  await waitFor(() => expect(onVisible).toHaveBeenLastCalledWith(true));
});

it('no call line after the 14-day window (banner itself still shows)', async () => {
  const { findByText, queryByTestId } = render(<ResumeHandoffBanner familyChildren={[child(20)]} familyShortCode="NOA123" />);
  await findByText('resumeHandoff.cta');
  expect(queryByTestId('handoff-concierge')).toBeNull();
});

it('no call line after "No thanks", or once the family has a counted win (sibling)', async () => {
  mockConcierge.dismissed = true;
  const a = render(<ResumeHandoffBanner familyChildren={[child(2)]} familyShortCode="NOA123" />);
  await a.findByText('resumeHandoff.cta');
  expect(a.queryByTestId('handoff-concierge')).toBeNull();
  mockConcierge.dismissed = false; mockConcierge.hasFirstWin = true;
  const b = render(<ResumeHandoffBanner familyChildren={[child(2)]} familyShortCode="NOA123" />);
  await b.findByText('resumeHandoff.cta');
  expect(b.queryByTestId('handoff-concierge')).toBeNull();
});

it('reports null until detection resolves, then the answer', async () => {
  const onVisible = jest.fn();
  render(<ResumeHandoffBanner familyChildren={[child(2)]} familyShortCode="NOA123" onVisibleChange={onVisible} />);
  expect(onVisible.mock.calls[0][0]).toBeNull();
  await waitFor(() => expect(onVisible).toHaveBeenLastCalledWith(true));
});

it('reports not visible once the child has activated', async () => {
  mockRows.value = [{ child_id: 'c1' }];
  const onVisible = jest.fn();
  render(<ResumeHandoffBanner familyChildren={[child(2)]} familyShortCode="NOA123" onVisibleChange={onVisible} />);
  await waitFor(() => expect(onVisible).toHaveBeenLastCalledWith(false));
});
