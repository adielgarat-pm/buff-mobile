/**
 * sheetDismissGuard.ts — dirty-guard for bottom-sheet backdrop dismissal.
 * Feature: pkg/ux-parent-dashboard-ergo.
 *
 * Contract:
 *  - clean sheet  → closes instantly, NO alert (one-tap dismissal preserved)
 *  - dirty sheet  → crossAlert confirm-discard is shown, close does NOT run
 *                   until the parent picks "Discard"; "Keep editing" keeps it
 */
import { guardedSheetClose } from '../sheetDismissGuard';
import { crossAlert } from '../../platform';
import type { AlertButton } from '../../platform';

jest.mock('../../platform', () => ({ crossAlert: jest.fn() }));

const mockCrossAlert = crossAlert as jest.Mock;
const t = (key: string) => key; // identity translator, matches screen tests

describe('guardedSheetClose', () => {
  beforeEach(() => mockCrossAlert.mockClear());

  test('clean sheet closes immediately without asking', () => {
    const close = jest.fn();
    guardedSheetClose({ dirty: false, close, t });

    expect(close).toHaveBeenCalledTimes(1);
    expect(mockCrossAlert).not.toHaveBeenCalled();
  });

  test('dirty sheet asks confirm-discard and does NOT close yet', () => {
    const close = jest.fn();
    guardedSheetClose({ dirty: true, close, t });

    expect(close).not.toHaveBeenCalled();
    expect(mockCrossAlert).toHaveBeenCalledTimes(1);
    expect(mockCrossAlert).toHaveBeenCalledWith(
      'sheetGuard.discardTitle',
      undefined,
      expect.any(Array),
    );
  });

  test('confirming "Discard" closes; "Keep editing" is the cancel button', () => {
    const close = jest.fn();
    guardedSheetClose({ dirty: true, close, t });

    const buttons = mockCrossAlert.mock.calls[0][2] as AlertButton[];
    const keep    = buttons.find(b => b.text === 'sheetGuard.keepEditing');
    const discard = buttons.find(b => b.text === 'sheetGuard.discard');

    expect(keep?.style).toBe('cancel');
    expect(keep?.onPress).toBeUndefined(); // cancel = stay open, nothing runs
    expect(discard?.style).toBe('destructive');

    discard?.onPress?.();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
