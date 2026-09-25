/**
 * confirmExitPreview — a one-tap confirm before leaving View-as-Child
 * (pkg/first-win P1a). Exiting the child preview drops straight into the parent
 * app (settings, and anything a child shouldn't be poking at). During the
 * onboarding handoff the child is the one holding the phone, so a stray tap on
 * the "exit" affordance shouldn't silently take them out of their own screen.
 *
 * Shared by every preview-exit affordance (ChildTabs strip + the two dashboard
 * banners) so the copy and behaviour stay in one place. The strings are passed
 * in (t) so this stays free of the i18n/react imports and easy to unit-test.
 */
import { crossAlert } from '../platform/crossAlert';

type TFn = (key: string, vars?: Record<string, unknown>) => string;

export function confirmExitPreview(
  t: TFn,
  childName: string | null | undefined,
  onExit: () => void,
): void {
  const name = childName ?? t('childTabs.previewChildFallback');
  crossAlert(
    t('childTabs.exitConfirmTitle', { name }),
    t('childTabs.exitConfirmBody'),
    [
      { text: t('childTabs.exitConfirmCancel'), style: 'cancel' },
      { text: t('childTabs.exitConfirmYes'), onPress: onExit },
    ],
  );
}
