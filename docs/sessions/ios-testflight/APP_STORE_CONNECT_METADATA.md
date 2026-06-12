# App Store Connect — TestFlight Metadata (BUFF iOS, Phase 1)

> Prep doc so the moment the Apple Developer account is verified, the App Store Connect
> app record + TestFlight submission can be filled in one pass. Phase 1 = TestFlight,
> **payments hidden** (no IAP). Reuses already-approved Play Store copy.
> Source anchors: `docs/BUFF_MESSAGING.md`, `docs/sessions/play-store-listing/EOD_2026-05-27.md`.

---

## 0. KEY DECISION — NOT in Apple's "Kids Category" ✅ DECIDED (Adi, 2026-06-11)

**Decision: stay OUT of the Kids Category. Everything is parent-controlled.** Apple's Kids
Category bans third-party data SDKs (BUFF uses Sentry, even PII-scrubbed) and adds strict
review; BUFF's model is parents create the account and kids never log in, so it lists as a
**regular app positioned as a parent's tool**.

---

## 1. App record

| Field | Value |
|-------|-------|
| Bundle ID | `com.buff.mobile` (already in app.json) |
| App Name | `BUFF — ADHD Routine Coach` (EN) — `BUFF_MESSAGING.md:208` |
| Primary language | English (US) — English-first market |
| SKU | `buff-mobile-ios` (free text, internal) |

## 2. App information / listing

- **Subtitle (30 chars):** `ADHD routine coach for kids` *(derive; confirm)*
- **Promotional text (170):** `The ADHD app your kid grows out of. Real rewards, not virtual coins. Built for ages 6–18, co-designed with a teen who actually has ADHD.` — `BUFF_MESSAGING.md:261`
- **Description:** paste the EN full description from `BUFF_MESSAGING.md` (lines 217–256). *Do not retype here — keep canonical source single.*
- **Keywords:** adhd, kids, teens, routine, chores, rewards, focus, executive function, parenting, habits
- **Category:** Primary **Education**, Secondary **Health & Fitness** ✅ DECIDED (Adi, 2026-06-11).
- **Support URL:** https://buffadhd.com (confirm a reachable page)
- **Marketing URL:** https://buffadhd.com
- **Support / contact email:** adi@buffadhd.com — (`INTEGRATION_LEARNINGS.md`, user memory)

## 3. Age rating (Apple questionnaire)

All "objectionable content" answers = **None** → expected rating **4+**. Target audience
6–18. No violence, no mature content, no gambling, no unrestricted web, no user-generated
public content.

## 4. App Privacy ("nutrition label")

> Answer these in App Store Connect → App Privacy. Based on actual code (Supabase auth,
> Sentry PII-scrubbed, RevenueCat). **Data Used to Track You: NONE. No ads. No data sold.**

| Data type | Collected? | Linked to identity? | Purpose | Notes |
|-----------|-----------|--------------------|---------|-------|
| Email address (Contact Info) | Yes (parents) | Yes | App Functionality (auth) | Children use internal `@buff.app` ids, not real emails |
| Purchase history | Yes | Yes | App Functionality | via RevenueCat (Android only in Phase 1; iOS IAP off) |
| Crash data / Diagnostics | Yes | **No** | App Functionality / diagnostics | Sentry with `beforeSend` stripping email/username/ip; emails regex-redacted — `BUFF_DECISIONS_LOG.md:37-38` |
| Coarse/precise location | No | — | — | none collected — `BUFF_MESSAGING.md:235` |
| Usage/analytics, advertising | No | — | — | no Segment/Mixpanel/Firebase-Analytics/ads SDKs |

- **Privacy Policy URL:** https://adielgarat-pm.github.io/buff-docs/legal/privacy-policy.html
  — `play-store-listing/EOD_2026-05-27.md:90`. ⚠️ **Verify it loads + mentions iOS** (it
  was written for Android). If it says "Android" only, update wording before submit.

## 5. TestFlight — beta details

- **Beta App Description:**
  > BUFF is a routine coach for kids and teens with ADHD. Parents set up the family;
  > kids complete missions and earn real rewards. This TestFlight build is the first iOS
  > release — premium features are unlocked free during the beta.
- **What to Test (notes to testers):**
  1. Sign in as a parent (Google, or email + password).
  2. Add a child and complete onboarding.
  3. Open a child view (View-as-Child) and complete a mission.
  4. Confirm no "upgrade / premium" wall appears anywhere (premium is free on iOS beta).
  5. Report any layout issues (notch / safe-area), crashes, or Hebrew/English text problems.
- **Feedback email:** adi@buffadhd.com
- **Export compliance:** already handled in app.json (`ITSAppUsesNonExemptEncryption=false`)
  → no per-upload prompt.

### Internal vs external testing
- **Internal testers** (up to 100, App Store Connect users): **NO Apple review** → instant.
  Use this first to get the family iPhone smoke done immediately.
- **External testers** (public link / >100): needs a one-time **Beta App Review** (~1 day) +
  the fields below.

### Beta App Review info (external only)
- **Demo account:** provide a test parent login (email + password) so Apple's reviewer can
  enter the app without Google OAuth. *(Create a throwaway parent account before submit.)*
- **Contact:** Adi / adi@buffadhd.com
- **Review notes:** "Kids never log in — parents create the family and use View-as-Child.
  Payments are intentionally disabled in this iOS beta. Sign in with Apple is offered
  alongside Google and email/password (satisfies Guideline 4.8)."

---

## 6. Apple Review Guideline compliance (audited 2026-06-11)

| Guideline | Verdict | Internal TF | External TF | App Store |
|-----------|---------|:---:|:---:|:---:|
| 3.1.1 — no external payment / paywall fully hidden on iOS | PASS | ✅ | ✅ | ✅ |
| 4.8 — login: native **Sign in with Apple** beside Google + email/password | **DONE** 2026-06-12 | ✅ | ✅ | ✅ |
| 1.4.1 / 1.3 — no medical claims (disclaimer present) | PASS | ✅ | ✅ | ✅ |
| 5.1.1 — privacy / permission strings | PASS | ✅ | ✅ | ✅ |
| 2.1 — iOS RC crash risk (refreshRC) | **FIXED** `b8d17e4` | ✅ | ✅ | ✅ |
| 5.1.1(v) — in-app **account deletion** | **DONE** `81abb5c` | ✅ | ✅ | ✅ |

**All audited guidelines now PASS.** Account deletion shipped: `delete_my_account` RPC
(migration 021, applied) + a Danger-Zone "Delete account" row with destructive confirm.
Sole parent → deletes the whole family + all members' auth logins; co-parent/child →
deletes only the caller's profile. FK-ordering verified via an isolated ROLLBACK dry-run.
Nothing else blocks External TestFlight / App Store on the guideline side.

## 7. Open items before submit (checklist)
- [ ] Apple account verified (Pending as of enrollment) → then run `ACCOUNT_DAY_RUNBOOK.md`
- [x] Category = Education + Health & Fitness — Adi 2026-06-11
- [x] Stay OUT of Kids Category — Adi 2026-06-11
- [ ] Confirm subtitle wording — Adi
- [x] Verify privacy-policy URL loads and covers iOS — CC 2026-06-12 (loads; mentions Apple
      App Store + account deletion; optional polish: name "Sign in with Apple" explicitly)
- [ ] Create a throwaway demo parent account (only if doing external testing)
- [x] **Account deletion** — shipped `81abb5c` (Apple 5.1.1(v) satisfied)
- [x] **Sign in with Apple** — shipped 2026-06-12 (native button, iOS-only; Supabase
      provider toggle is Step 1 of the runbook)
- [x] **Alpha-free iOS icon** — `assets/BUFF_LOGO-IOS.png` wired to `ios.icon`
