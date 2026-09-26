/**
 * Tests for InviteChildCard — the family-level "invite a child" card on the
 * Parent Dashboard.
 *
 * The regression that motivated this component: the card's Share button called
 * React Native's `Share.share()` inline, which is a silent no-op on the web
 * PWA — the exact cohort (web parents) the card exists to activate. These
 * tests guard:
 *   - Share goes through the cross-platform `shareInvite` helper, NOT Share.share
 *   - The share message carries the family code + join link (the link itself
 *     routes to the Play Store when BUFF isn't installed)
 *   - No share sheet on this browser → the parent picks WhatsApp / Email / Copy
 *   - When no share surface can be presented (shareInvite → false), the tap is
 *     never invisible: the message is copied and crossAlert confirms it
 *   - When the share surface appeared (shareInvite → true), no fallback fires
 *   - The Copy button copies just the code and flips its label
 */
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import InviteChildCard from '../InviteChildCard';
import { shareInvite } from '../../../lib/shareInvite';
import { crossAlert } from '../../../platform';
import { buildJoinUrl } from '../../../lib/buffConfig';
import { hasShareSheet } from '../../../lib/inviteSend';

// ── Mocks ──────────────────────────────────────────────────────────────────
// Echo the key plus any interpolation vars as `key(var=val)` — lets assertions
// check both the key chosen and the values passed (the placeholders live in
// en.json, not in the key itself).
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (!vars || Object.keys(vars).length === 0) return key;
      const parts = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(',');
      return `${key}(${parts})`;
    },
  }),
}));

jest.mock('../../../lib/shareInvite', () => ({
  shareInvite: jest.fn(),
}));

jest.mock('../../../lib/inviteSend', () => ({
  hasShareSheet: jest.fn(() => true),
  openInviteEmail: jest.fn(),
  openInviteWhatsApp: jest.fn(),
}));

jest.mock('../../../platform', () => ({
  crossAlert: jest.fn(),
}));

// Dynamically imported by the component (`await import('expo-clipboard')`) —
// jest module mocking intercepts the dynamic import too.
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockedShareInvite = shareInvite as jest.MockedFunction<typeof shareInvite>;
const mockedCrossAlert  = crossAlert as jest.MockedFunction<typeof crossAlert>;
const mockedSetString   = Clipboard.setStringAsync as jest.MockedFunction<typeof Clipboard.setStringAsync>;

const CODE = 'ABC123';
const EXPECTED_MESSAGE = `inviteCard.shareMessage(code=${CODE},joinUrl=${buildJoinUrl(CODE)})`;
const mockedHasShareSheet = hasShareSheet as jest.MockedFunction<typeof hasShareSheet>;

describe('InviteChildCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedShareInvite.mockResolvedValue(true);
    mockedHasShareSheet.mockReturnValue(true);
  });

  test('renders the family code and the card copy', () => {
    const { getByText } = render(<InviteChildCard familyShortCode={CODE} />);
    expect(getByText(CODE)).toBeTruthy();
    expect(getByText('inviteCard.title')).toBeTruthy();
    expect(getByText('inviteCard.shareBtn')).toBeTruthy();
  });

  test('share goes through shareInvite (cross-platform), never raw Share.share', async () => {
    const rawShareSpy = jest.spyOn(Share, 'share');
    const { getByTestId } = render(<InviteChildCard familyShortCode={CODE} />);

    fireEvent.press(getByTestId('invite-card-share'));

    await waitFor(() => expect(mockedShareInvite).toHaveBeenCalledTimes(1));
    // Message carries the family code AND the join link.
    expect(mockedShareInvite).toHaveBeenCalledWith(EXPECTED_MESSAGE);
    // The web-silent path must be gone from this component.
    expect(rawShareSpy).not.toHaveBeenCalled();
    rawShareSpy.mockRestore();
  });

  test('when the share surface appeared, no clipboard fallback and no alert', async () => {
    mockedShareInvite.mockResolvedValue(true);
    const { getByTestId } = render(<InviteChildCard familyShortCode={CODE} />);

    fireEvent.press(getByTestId('invite-card-share'));

    await waitFor(() => expect(mockedShareInvite).toHaveBeenCalled());
    expect(mockedSetString).not.toHaveBeenCalled();
    expect(mockedCrossAlert).not.toHaveBeenCalled();
  });

  test('when share is unavailable, copies the full message and confirms visibly', async () => {
    mockedShareInvite.mockResolvedValue(false);
    const { getByTestId } = render(<InviteChildCard familyShortCode={CODE} />);

    fireEvent.press(getByTestId('invite-card-share'));

    await waitFor(() => expect(mockedCrossAlert).toHaveBeenCalledTimes(1));
    // The whole invite message lands on the clipboard, not just the code —
    // the parent pastes one thing and the kid gets the link + code.
    expect(mockedSetString).toHaveBeenCalledWith(EXPECTED_MESSAGE);
    expect(mockedCrossAlert).toHaveBeenCalledWith(
      'inviteCard.shareFallbackTitle',
      'inviteCard.shareFallbackBody',
    );
  });

  test('no share sheet (desktop browser) → the parent picks WhatsApp / Email / Copy', () => {
    mockedHasShareSheet.mockReturnValue(false);
    const { getByTestId, queryByTestId } = render(<InviteChildCard familyShortCode={CODE} />);
    expect(queryByTestId('invite-chooser')).toBeNull();

    fireEvent.press(getByTestId('invite-card-share'));

    expect(mockedShareInvite).not.toHaveBeenCalled();
    expect(getByTestId('invite-via-whatsapp')).toBeTruthy();
    expect(getByTestId('invite-via-email')).toBeTruthy();
    expect(getByTestId('invite-via-copy')).toBeTruthy();
  });

  test('Copy button copies just the code and flips its label', async () => {
    // Fake timers so the 2s "Copied ✓" revert doesn't leak past the test.
    jest.useFakeTimers();
    try {
      const { getByTestId, getByText } = render(<InviteChildCard familyShortCode={CODE} />);

      fireEvent.press(getByTestId('invite-card-copy'));

      await waitFor(() => expect(mockedSetString).toHaveBeenCalledWith(CODE));
      await waitFor(() => expect(getByText('inviteCard.copiedBtn')).toBeTruthy());

      // Label reverts after the 2s flash.
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByText('inviteCard.copyBtn')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});
