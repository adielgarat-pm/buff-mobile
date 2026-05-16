# Track 4a — iOS Waitlist Copy

**Status:** `draft — awaiting Adi review`
**Target surface:** buffadhd.com/ios (or `/waitlist` — Lovable page)
**Deploys via:** Lovable editor → Adi clicks "Publish → Update"
**Drafted:** 2026-05-16 by CC on `claude/busy-euclid-e43458`

---

## What this page is for

Visitors who hear about BUFF (from the migration email cohort, advisor outreach, organic discovery) but use **iPhones** and can't install the Android beta. They need to know:
1. BUFF exists, it's Android-first, that's deliberate
2. iOS is real — coming, not abandoned
3. Leave their email so we tell them when iOS ships

**Not a sales page.** Honesty over hype. The cohort knows Adi personally; this page can't sound corporate.

---

## Page structure — single screen, no scroll required

```
[BUFF logo — violet B + lime bolt]

HERO HEADLINE
    EN: "BUFF is on Android first."
    HE: "BUFF זמינה קודם באנדרואיד."

SUB-LINE (smaller, violet-soft)
    EN: "iOS is coming. Leave your email and we'll tell you the day it ships."
    HE: "iOS בדרך. תשאירי לנו מייל ונודיע ביום שזה יוצא."

[EMAIL INPUT FIELD]   [SUBMIT BUTTON]
    EN button: "Notify me"
    HE button: "תעדכנו אותי"

----- divider -----

WHY ANDROID FIRST (3 lines, plain text)
    EN:
    > We started with the families who needed BUFF most — and 96% of them
    > were on Android. iOS engineering starts after Android beta is solid.
    > No timeline promises we can't keep.

    HE:
    > התחלנו עם המשפחות שהכי הזדקקו ל-BUFF — ו-96% מהן היו באנדרואיד.
    > הפיתוח ל-iOS יתחיל אחרי שגרסת הביתא לאנדרואיד יציבה.
    > אין כאן הבטחות תאריך שלא נוכל לעמוד בהן.

----- divider -----

FOOTER (small)
    EN: "Until they don't need us."
    HE: "עד שהם כבר לא יזדקקו לנו."

    Built by a mom of a teen with ADHD.
    adi@buffadhd.com
```

---

## Design notes for Lovable

- **Match buffadhd.com palette already in use:** violet-primary (`#8b5cf6`) for the submit button, lavender-bg (`#F4F0FA`) canvas, lime-bolt (`#A8E63E`) accent if needed (sparingly — see Spaceship Test in BUFF_BRAND.md §7.7).
- **Typography:** Heebo (already on the site, Hebrew-strong).
- **Hebrew first** (Israel cohort is primary audience), English version reachable via existing site lang toggle.
- **Email capture goes to the same destination as the main site signup** — Adi to confirm where that lands (Mailchimp? Lovable form? Google Sheet?).
- **No "Get the Android app" CTA on this page.** Different audience. Don't bait-and-switch iOS users to download Android.

---

## What this page is NOT

- ❌ A sales pitch for BUFF (they already know — they came here)
- ❌ A feature list (HOW — violates Adi's WHY/WHAT-first memory)
- ❌ A timeline ("coming Q4!" — we don't know, we won't lie)
- ❌ A "join the waitlist for *early access*" growth-hack — they get notified when it ships, that's it
- ❌ Cross-promotion to the Lovable POC (separate Supabase, frozen, would confuse the iOS audience)

---

## Open questions (small)

| Q | Default if no answer | Notes |
|---|---|---|
| Where does the email capture land? | Existing Lovable form / Mailchimp list | Adi knows |
| Should we collect "iPhone model" in addition to email? | No — adds friction, low signal | Could add later if iOS engineering wants it |
| Do we name a rough timeline ("H2 2026"...)? | No timeline. "We'll tell you when it ships." | Per BRAND voice — no promises we can't keep |
| Hebrew or English by default for the iOS audience? | Hebrew (96% of cohort is IL per PRD §4.3) | Site lang toggle handles the rest |

---

## Values Check (per BUFF_VALUES.md mandate)

| Pillar | Question | Answer |
|---|---|---|
| Intrinsic Motivation | Q1 — does this copy lead with what the *parent* values? | Yes — "told you the day it ships" respects their time over our marketing cadence |
| Intrinsic Motivation | Q2 — avoid extrinsic carrots? | Yes — no "early access" / "exclusive" gimmickry |
| Intrinsic Motivation | Q3 — child as stakeholder? | N/A (parent-only page) |
| Positive Coaching | Q1 — no failure framing? | Yes — "iOS coming" not "iOS missing" |
| Positive Coaching | Q2 — no surveillance / pressure? | Yes — single email field, no behavioral tracking |
| Positive Coaching | Q3 — calm, not urgent? | Yes — Spaceship Test passes (no countdown, no FOMO) |
| Independence-Building | Q1 — does this build long-term trust? | Yes — honesty about Android-first is the trust play |
| Independence-Building | Q2 — does this scaffold without creating dependency? | N/A (waitlist, not product) |
| Independence-Building | Q3 — outgrow framing visible? | Yes — footer carries the mission tagline |

**All 9 pass.** Ready for Adi review.

---

## After review

If approved:
1. Adi pastes copy into Lovable editor
2. Confirms email destination wired up
3. Clicks "Publish → Update"
4. Tests the form from a phone before sending migration email
