# Concierge Call — SPEC

> **Status:** direction approved by Adi 2026-09-25 ("מאשרת"). Copy pending Adi's approval (UX-writer review done). Related: `docs/sessions/first-win/` (this is a first-win lever with its own confound).

## Why
The funnel breaks before a child's first completed task; 18 of 25 churned parents left in their first session (`VALUE_VALIDATION_2026-09.md` §5). Personal outreach works (2/2), a cold survey link doesn't (0/8), and outreach email lands in spam. There have been zero stranger signups since 2026-09-14. So the offer of help lives **inside the app**, where the parent already is.

## What (target state)
- **UStep8 (last onboarding screen):** a quiet text line + link above the community line, under the pinned "Go to Dashboard" CTA. First-time onboarding only (never in add-child flow). Never a button that competes with the main CTA.
- **Parent dashboard card** (top of the dashboard):
  - Shows only while the family has **no first win**, using the same counted sources as the First Win metric (`COUNTED_SOURCES_FILTER`).
  - Shows only during the first **14 days** after the family's first child was created.
  - Hidden until the first-win check and the dismissal check have both answered, so a family that already has wins never sees the card flash.
  - "No thanks" hides it for good on this device.
  - It disappears after the first win.
- **Link:** `concierge.bookingLink` is an i18n value, so the app language picks the calendar (same pattern as the WhatsApp community link). Currently both languages point to `https://cal.com/adi-elgarat-german-buff`; replace with per-language event links when Adi has them.
- **Capacity:** managed in Cal.com (slots and daily/weekly limits). **Kill switch:** blank the link and every surface hides. The change is instant on web and ships via OTA on Android.
- **Parent-only:** never on child screens or in View-as-Child. No pricing anywhere.

## Measurement
- Events (`onboarding_events`, free-text type, no migration): `concierge_offer_seen` (once per family and placement per session), `concierge_offer_tapped`, `concierge_offer_dismissed`. `source` holds the placement.
- **Confound control:** founder-coached families are the H3 "needs Adi" bias. `scripts/first-win-funnel.sql` puts families who tapped the offer, or whose ids Adi adds to `concierge_ids` (bookings), in a separate `concierge` audience, never `stranger`.
- **Read:** seen → tapped → booked (Cal.com) → first win ≤48h, by placement. Plus what Adi learns in the calls (the main goal).

## Out of scope / flags
- **Permanent low-key entry in Settings/Help after dismissal** (UX review): proposed, not built. Adi to decide.
- **Booking confirmation back into the app** (Cal.com webhook): not built. Bookings are tagged manually via `concierge_ids`.
- **Email deliverability** (SPF/DKIM/DMARC for buffadhd.com): separate.

## Values Check (implemented behavior)
- **Pillar 1:** n/a to the child. The call helps the parent connect the child to their own rewards.
- **Pillar 2:**
  - The copy never mentions the child, tasks, or elapsed time. There is no "still" and no "haven't".
  - "No thanks" is final. There are no badges, red styling, or countdowns.
  - It is free, and the copy says so.
- **Pillar 3:** Adi coaches the parent to do the handoff themselves; she does not do it for them (research §6 item 6). The offer fades by construction: it appears once, is gone after the first win, and is gone after 14 days.

## Copy (UX-writer reviewed 2026-09-25; pending Adi approval)
| Key | EN | HE |
|---|---|---|
| concierge.cardTitle | Want a hand setting up BUFF? | רוצים עזרה בהגדרת BUFF? |
| concierge.cardBody | A free 15-minute call with Adi, BUFF's founder and mom of a teen with ADHD. We'll set BUFF up together for your family. | שיחה של 15 דקות עם עדי, המייסדת של BUFF ואמא של נער עם ADHD. בלי עלות. נגדיר את BUFF יחד, בהתאמה למשפחה שלכם. |
| concierge.cardCta | Book a call | לקביעת שיחה |
| concierge.cardDismiss | No thanks | לא, תודה |
| concierge.opensBrowserHint (a11y) | Opens in your browser | נפתח בדפדפן |
| concierge.onboardingLine | Prefer to set it up together? Adi, BUFF's founder, offers a free 15-minute call. | מעדיפים להגדיר יחד? עדי, המייסדת של BUFF, זמינה לשיחה של 15 דקות, בלי עלות. |
| concierge.onboardingCta | Book a call with Adi → | לקביעת שיחה עם עדי ← |
