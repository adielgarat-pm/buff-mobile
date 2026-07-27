/**
 * community — the one door to the BUFF parent WhatsApp community.
 *
 * There are two groups (Hebrew and English) and the correct one is chosen by
 * the app's ACTIVE LANGUAGE, not the device locale. That happens for free:
 * the invite URL is itself an i18n value (`philosophy.community.link`), so
 * call sites pass `t('philosophy.community.link')` and i18next resolves the
 * right group. No `language === 'he' ? … : …` ternary anywhere — that pattern
 * is what leaked device locale into child screens before (see the i18n
 * three-sources lesson).
 *
 * The copy for every surface (`philosophy.community.title` / `.insight` /
 * `.buttonText`) already existed and was already translated; it was written
 * for the Philosophy screen and never rendered.
 *
 * WhatsApp tells us nothing about who joined, so the click-out is the only
 * signal we will ever have. It is logged fire-and-forget per placement.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logOnboardingEvent } from './onboardingFunnel';
import { openExternalUrl } from '../platform';

/** Where in the app the parent found the community. */
export type CommunityPlacement = 'settings' | 'philosophy' | 'onboarding_complete';

/** i18n key holding the language-appropriate WhatsApp invite URL. */
export const COMMUNITY_LINK_KEY = 'philosophy.community.link';

/**
 * A missing/mis-keyed translation makes i18next return the KEY itself, and
 * handing "philosophy.community.link" to the OS opens nothing (native) or a
 * bogus relative navigation (web). Only ever leave the app for a real https URL.
 */
export function isValidCommunityUrl(url: string | undefined | null): boolean {
  return typeof url === 'string' && url.startsWith('https://');
}

interface OpenArgs {
  /** Resolved from `t(COMMUNITY_LINK_KEY)` at the call site. */
  url: string;
  placement: CommunityPlacement;
  /** RLS scope for the click event; the event is skipped without it. */
  familyId: string | null | undefined;
}

/**
 * Opens the community group and records the click. Returns false (and does
 * nothing) when the URL failed validation, so a call site can stay quiet
 * rather than pretending it opened something.
 */
export function openCommunity({ url, placement, familyId }: OpenArgs): boolean {
  if (!isValidCommunityUrl(url)) return false;

  void logOnboardingEvent({
    familyId,
    eventType: 'community_link_clicked',
    source:    placement,
  });

  openExternalUrl(url);
  return true;
}

/**
 * One-shot flag for the post-onboarding invite (Surface C). That moment is
 * shown once per device and never again — an invitation that reappears every
 * time a parent adds a child reads as nagging, and the end of onboarding is
 * also where the activation-critical "Go to Dashboard" tap lives.
 *
 * Storage failures resolve to "already seen" so a broken read can never turn
 * the invite into something that shows on every visit.
 */
const INVITE_SEEN_KEY = 'buff.communityInviteSeen';

export async function hasSeenCommunityInvite(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(INVITE_SEEN_KEY)) === '1';
  } catch {
    return true;
  }
}

export async function markCommunityInviteSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(INVITE_SEEN_KEY, '1');
  } catch {
    /* a one-shot flag is not worth failing a flow over */
  }
}
