/**
 * confirmExitPreview — a one-tap confirm before leaving View-as-Child
 * (pkg/first-win P1a). Exiting the child preview drops straight into the parent
 * app (settings, and anything a child shouldn't be poking at). During the
 * onboarding handoff the child is the one holding the phone, so a stray tap on
 * the "exit" affordance shouldn't silently take them out of their own screen.
 *
 * Used by the ChildTabs top strip — the single preview banner on every child
 * tab (the dashboard banners were removed as duplicates, Adi 2026-09-25). Copy
 * reviewed by a UX writer and approved by Adi 2026-09-25. The strings are
 * passed in (t) so this stays free of i18n/react imports and easy to test.
 */
import { crossAlert } from '../platform/crossAlert';

type TFn = (key: string, vars?: Record<string, unknown>) => string;

/**
 * Wrap a name in Unicode first-strong isolates (U+2068 … U+2069) so a Hebrew
 * name inside English copy (or a Latin name inside Hebrew) can't flip the
 * direction of the whole line. Works in the native Alert and on web.
 */
export function isolateName(name: string): string {
  return `\u2068${name}\u2069`;
}

export function confirmExitPreview(
  t: TFn,
  childName: string | null | undefined,
  onExit: () => void,
): void {
  // No name → a whole-sentence variant, never a parent-voiced "your child"
  // (the child may be the one reading it).
  const title = childName
    ? t('childTabs.exitConfirmTitle', { name: isolateName(childName) })
    : t('childTabs.exitConfirmTitleNoName');
  crossAlert(
    title,
    t('childTabs.exitConfirmBody'),
    [
      { text: t('childTabs.exitConfirmCancel'), style: 'cancel' },
      { text: t('childTabs.exitConfirmYes'), onPress: onExit },
    ],
    // Android: back / outside tap cancels, same as the web backdrop.
    { cancelable: true },
  );
}
