/**
 * Dirty-guard for bottom-sheet backdrop dismissal.
 *
 * The parent bonus/sticker sheets and the task add/edit modal close instantly
 * on a backdrop tap — which silently discards anything the parent had typed
 * (a bonus note, a task title). For a busy ADHD parent a stray tap costs the
 * whole message. This helper keeps the instant close for CLEAN sheets and
 * asks confirm-discard (via crossAlert — never raw Alert, per platform rule)
 * only when the sheet has unsaved input.
 *
 * Pure decision function + crossAlert side effect, extracted so the
 * dirty→ask / clean→close behavior is unit-testable with a mocked crossAlert.
 */
import { crossAlert } from '../platform';

export interface GuardedSheetCloseOpts {
  /** True when the sheet holds unsaved user input. */
  dirty: boolean;
  /** Actually dismiss the sheet (discarding its state). */
  close: () => void;
  /** i18n translate fn — keys: sheetGuard.discardTitle / keepEditing / discard. */
  t: (key: string) => string;
}

export function guardedSheetClose({ dirty, close, t }: GuardedSheetCloseOpts): void {
  if (!dirty) {
    close();
    return;
  }
  crossAlert(
    t('sheetGuard.discardTitle'),
    undefined,
    [
      { text: t('sheetGuard.keepEditing'), style: 'cancel' },
      { text: t('sheetGuard.discard'), style: 'destructive', onPress: close },
    ],
  );
}
