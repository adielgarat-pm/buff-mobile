/**
 * concierge — the in-app offer of a 15-minute setup call with Adi
 * (pkg/concierge-call, approved by Adi 2026-09-25).
 *
 * Why: BUFF's funnel breaks before a child's first completed task, parents
 * often leave in their first session, and outreach email lands in spam. So the
 * offer lives inside the app, where the parent already is:
 *   - 'onboarding_complete': a quiet line on UStep8, under the main CTA.
 *   - 'dashboard': a card for families with no first win yet, during the first
 *     CONCIERGE_WINDOW_DAYS after their first child was created. It hides for
 *     good on "Not now" and disappears after the first win.
 *
 * The booking page (Cal.com) is an i18n value, so the parent's app language
 * picks the right calendar, the same way the WhatsApp community link works
 * (lib/community.ts). Capacity is managed in Cal.com itself; blanking the URL
 * hides every surface (kill switch) because only a real https URL is used.
 *
 * Measurement: families who tap this offer are coached by the founder, which
 * is exactly the H3 "needs Adi" confound. scripts/first-win-funnel.sql reports
 * them separately and keeps them out of the stranger metric.
 *
 * Parent-only. Never rendered on child screens or in View-as-Child.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logOnboardingEvent } from './onboardingFunnel';
import { openExternalUrl } from '../platform';

/** Where in the app the parent saw the offer. */
export type ConciergePlacement = 'onboarding_complete' | 'dashboard' | 'handoff_banner';

/** i18n key holding the language-appropriate booking page URL. */
export const CONCIERGE_LINK_KEY = 'concierge.bookingLink';

/** How long after the first child is created the dashboard card may show. */
export const CONCIERGE_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;
const DISMISS_KEY_PREFIX = 'buff_concierge_dismissed_v1:';

/** Only ever leave the app for a real https URL (a missing key returns the key). */
export function isValidConciergeUrl(url: string | undefined | null): url is string {
  return typeof url === 'string' && url.startsWith('https://');
}

export interface DashboardEligibility {
  url: string | undefined | null;
  isChildPreview: boolean;
  /** ISO created_at of the family's children; the earliest opens the window. */
  childCreatedAts: readonly (string | null | undefined)[];
  /** true once any child has a counted completion; null while unknown. */
  hasFirstWin: boolean | null;
  dismissed: boolean;
  /** true while the resume-handoff banner is showing: it carries the offer itself. */
  suppressed?: boolean;
  now?: number;
}

/**
 * Pure: should the standalone dashboard card render? (One card, Adi
 * 2026-09-25: when ResumeHandoffBanner is visible it carries the offer as a
 * quiet line, and this card stays hidden.) Unknown first-win state (null) hides
 * it, so a family that already has wins never sees a flash of the card.
 */
export function shouldShowDashboardOffer(e: DashboardEligibility): boolean {
  if (!isValidConciergeUrl(e.url)) return false;
  if (e.isChildPreview || e.dismissed || e.suppressed) return false;
  if (e.hasFirstWin !== false) return false;
  return isWithinConciergeWindow(e.childCreatedAts, e.now);
}

/** true during the first CONCIERGE_WINDOW_DAYS after the family's first child was created. */
export function isWithinConciergeWindow(
  childCreatedAts: readonly (string | null | undefined)[],
  now: number = Date.now(),
): boolean {
  const times = childCreatedAts
    .map((s) => (s ? Date.parse(s) : NaN))
    .filter((n) => Number.isFinite(n));
  if (times.length === 0) return false;
  return now - Math.min(...times) <= CONCIERGE_WINDOW_DAYS * DAY_MS;
}

const seenThisSession = new Set<string>();

/** Logs one exposure per (family, placement) per app session. */
export function logConciergeSeen(familyId: string | null | undefined, placement: ConciergePlacement): void {
  if (!familyId) return;
  const key = `${familyId}|${placement}`;
  if (seenThisSession.has(key)) return;
  seenThisSession.add(key);
  void logOnboardingEvent({ familyId, eventType: 'concierge_offer_seen', source: placement });
}

/**
 * Opens the booking page and records the tap. Returns false (and does nothing)
 * when the URL failed validation. Must be called synchronously from the press
 * handler (web popup rules, see openExternalUrl.web.ts).
 */
export function openConcierge(args: {
  url: string | undefined | null;
  placement: ConciergePlacement;
  familyId: string | null | undefined;
}): boolean {
  if (!isValidConciergeUrl(args.url)) return false;
  void logOnboardingEvent({
    familyId: args.familyId, eventType: 'concierge_offer_tapped', source: args.placement,
  });
  openExternalUrl(args.url);
  return true;
}

export async function isConciergeDismissed(familyId: string | null | undefined): Promise<boolean> {
  if (!familyId) return false;
  try {
    return (await AsyncStorage.getItem(DISMISS_KEY_PREFIX + familyId)) === '1';
  } catch {
    return false;
  }
}

/** "Not now" on the dashboard card: hide it for good on this device. */
export async function dismissConcierge(familyId: string | null | undefined): Promise<void> {
  if (!familyId) return;
  void logOnboardingEvent({ familyId, eventType: 'concierge_offer_dismissed', source: 'dashboard' });
  try {
    await AsyncStorage.setItem(DISMISS_KEY_PREFIX + familyId, '1');
  } catch {
    /* best-effort */
  }
}

/** Test-only reset. Never call this from app code. */
export function __resetConciergeForTests(): void {
  seenThisSession.clear();
}
