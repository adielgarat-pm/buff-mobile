/**
 * InviteSendPanel — the invite on UStep8_Complete follows the chosen access
 * path (Adi's web run 2026-09-26: the screen showed only a code).
 *   - own_phone   → share sheet first; Copy link
 *   - home_device → email first; Share another way; Copy link
 *   - tonight     → no send button until "Or send it now"
 *   - no share sheet → WhatsApp / Email / Copy chooser
 *   - the child's message uses the child's grammatical gender
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import InviteSendPanel from '../InviteSendPanel';
import { shareInvite } from '../../../../lib/shareInvite';
import { hasShareSheet, openInviteEmail } from '../../../../lib/inviteSend';
import { logOnboardingEvent } from '../../../../lib/onboardingFunnel';
import { buildJoinUrl } from '../../../../lib/buffConfig';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (!vars || Object.keys(vars).length === 0) return key;
      const parts = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(',');
      return `${key}(${parts})`;
    },
  }),
}));
jest.mock('../../../../lib/shareInvite', () => ({ shareInvite: jest.fn() }));
jest.mock('../../../../lib/inviteSend', () => ({
  hasShareSheet: jest.fn(() => true),
  openInviteEmail: jest.fn(),
  openInviteWhatsApp: jest.fn(),
}));
jest.mock('../../../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(undefined) }));

const mockedShare    = shareInvite as jest.MockedFunction<typeof shareInvite>;
const mockedHasSheet = hasShareSheet as jest.MockedFunction<typeof hasShareSheet>;
const mockedEmail    = openInviteEmail as jest.MockedFunction<typeof openInviteEmail>;
const mockedLog      = logOnboardingEvent as jest.MockedFunction<typeof logOnboardingEvent>;

const CODE = 'BTTTAZ';
const URL  = buildJoinUrl(CODE);
const base = { childName: 'Noa', code: CODE, familyId: 'fam-1', childId: 'child-1' };

beforeEach(() => {
  jest.clearAllMocks();
  mockedShare.mockResolvedValue(true);
  mockedHasSheet.mockReturnValue(true);
});

it('own phone: the primary button opens the share sheet with the child message, and confirms', async () => {
  const onSent = jest.fn();
  const { getByTestId, getByText } = render(<InviteSendPanel {...base} mode="own_phone" gender="girl" onSent={onSent} />);

  expect(getByText('onboarding.invite.phonePrimary(name=Noa)')).toBeTruthy();
  fireEvent.press(getByTestId('invite-primary'));

  await waitFor(() => expect(mockedShare).toHaveBeenCalledWith(`onboarding.invite.message_f(name=Noa,joinUrl=${URL},code=${CODE})`));
  await waitFor(() => expect(getByTestId('invite-sent')).toBeTruthy());
  expect(onSent).toHaveBeenCalled();
  expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'invite_sent', method: 'share' }));
  expect(getByTestId('invite-code')).toBeTruthy();   // code stays as the fallback
});

it('home computer: the primary button opens an email with subject + message', () => {
  const { getByTestId, getByText } = render(<InviteSendPanel {...base} mode="home_device" gender="boy" onSent={jest.fn()} />);

  expect(getByText('onboarding.invite.homePrimary')).toBeTruthy();
  expect(getByTestId('invite-share')).toBeTruthy();
  fireEvent.press(getByTestId('invite-primary'));

  expect(mockedEmail).toHaveBeenCalledWith(
    'onboarding.invite.emailSubject(name=Noa)',
    `onboarding.invite.message_m(name=Noa,joinUrl=${URL},code=${CODE})`,
  );
  expect(mockedShare).not.toHaveBeenCalled();
  expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({ method: 'email' }));
});

it('copy link puts the join link on the clipboard', async () => {
  const { getByTestId, getByText } = render(<InviteSendPanel {...base} mode="own_phone" onSent={jest.fn()} />);
  fireEvent.press(getByTestId('invite-copy'));
  await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(URL));
  await waitFor(() => expect(getByText('onboarding.invite.linkCopied')).toBeTruthy());
});

it('no share sheet on this browser: the parent picks WhatsApp / Email / Copy', () => {
  mockedHasSheet.mockReturnValue(false);
  const { getByTestId } = render(<InviteSendPanel {...base} mode="own_phone" onSent={jest.fn()} />);
  fireEvent.press(getByTestId('invite-primary'));
  expect(mockedShare).not.toHaveBeenCalled();
  expect(getByTestId('invite-via-whatsapp')).toBeTruthy();
  expect(getByTestId('invite-via-email')).toBeTruthy();
});

it('tonight: no send button until "Or send it now"', () => {
  const { getByTestId, queryByTestId, getByText } = render(<InviteSendPanel {...base} mode="tonight" onSent={jest.fn()} />);
  expect(getByText('onboarding.invite.tonightSub')).toBeTruthy();
  expect(queryByTestId('invite-primary')).toBeNull();

  fireEvent.press(getByTestId('invite-send-now'));
  expect(getByTestId('invite-primary')).toBeTruthy();
});
