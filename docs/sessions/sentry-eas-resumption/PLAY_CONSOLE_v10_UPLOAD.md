# Play Console — v10 AAB Upload Guide (Internal Testing)

> Adi-side runbook for Phase 5 of pkg/sentry-eas-resumption.
> CC produced this; Adi executes in Play Console UI.

**Build ID:** `c9aa1828-8495-45ac-8365-3153e6e864cb` ✅ FINISHED 2026-05-25 (8m 35s)
**AAB artifact:** https://expo.dev/artifacts/eas/qUkBTuTYYccCZjUm1kSd1t.aab (expires 2026-06-24 — 30 days)
**Target track:** Internal Testing
**App ID:** `com.buffapp.mobile`
**versionCode:** 10 (auto-incremented by EAS from 9)
**Keystore:** `dG1dqozJHO (default)` — same as the v8 build attempt from 2026-05-16

---

## Pre-flight (5 min)

1. Confirm the build finished successfully:
   - Open https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/c9aa1828-8495-45ac-8365-3153e6e864cb
   - Status should show **Finished** (green checkmark)
   - If **Errored** → STOP, ping CC, do not upload anything
2. Download the AAB:
   - Click **Download** on the EAS build page
   - File will be `application-<hash>.aab`, ~30-50 MB
   - Save somewhere you can find it (Downloads is fine)
3. Confirm you're logged into the right Google Play Console account:
   - https://play.google.com/console
   - Account should be the one that owns `com.buffapp.mobile`
   - If you see "no apps yet" — wrong Google account, switch

---

## Upload steps (10 min)

### 1. Navigate to the right app

Play Console → All apps → **buff-mobile** (the one with package name `com.buffapp.mobile`).

### 2. Internal testing → Create new release

Left sidebar → **Testing** → **Internal testing** → **Create new release**

> If this is the very first internal-testing release ever, Play will walk you through track setup first (tester email list, opt-in URL). Per Adi's confirmation 2026-05-16, the listing already exists, so this should be a "new release" not "set up track."

### 3. App Bundle upload

In the **App bundles** section:
- Click **Upload**
- Select the AAB you downloaded
- Wait for Play to validate the bundle (~30s)
- **Fingerprint check:** Play will validate that the signing key matches the upload key it has on file. If it complains about mismatch → STOP, ping CC. We expect it to match because we re-used keystore `dG1dqozJHO` from the v8 attempt.

### 4. Release name

Play auto-fills "10 (1.0.0)" or similar — leave as-is.

### 5. Release notes

Paste these into the **Release notes** section. Languages: **English (United States)** and **Hebrew**. If your console only shows one language slot, paste both blocks separated by a blank line.

**English (United States) — copy/paste:**

```
What's new since v8:
• Yesterday Recap on Parent Dashboard — see at a glance how each kid did yesterday
• Anchor Recovery — auto-cleanup of stale anchors so morning routines stay focused
• Teen Mode: new Me & Buddy screen + Buddy hero on dashboard
• Parent notification feed (bell icon)
• Daily Vibe Check
• Push notifications via FCM
• Multiple timetable import + parser fixes (groups, days, format detection)
• Globe icon for language switcher

Behind the scenes:
• Sentry crash monitoring (no PII captured) for faster bug fixes
```

**Hebrew — copy/paste:**

```
מה חדש מאז v8:
• "אתמול" בדאשבורד ההורה — סקירה מהירה איך כל ילד עבר את היום אתמול
• ניקוי אנקרים אוטומטי — בקרים פחות עמוסים
• Teen Mode: מסך "אני וה-Buddy" + Buddy hero בדאשבורד
• פיד התראות להורה (פעמון)
• Vibe Check יומי
• Push notifications דרך FCM
• תיקונים מרובים ב-import של מערכת שעות (קבוצות, ימים, זיהוי פורמט)
• Globe icon למתג שפה

מאחורי הקלעים:
• ניטור קריסות Sentry (ללא PII) לתיקוני באגים מהירים
```

### 6. Review and roll out

- Click **Next** at the bottom
- **Review** screen: should show all green checkmarks, no errors
- Click **Start rollout to Internal testing**
- Confirm in the dialog
- **Wait 5-10 min** for Google to process the release (small spinner near the version number — wait until it's gone)

### 7. Copy the internal-testing link

- Once processed: **Testers** tab inside Internal testing
- Find **How testers join your test** → there's an opt-in URL like `https://play.google.com/apps/internaltest/4701408295...`
- Copy this URL — you'll send it to the WhatsApp group on 2026-06-01

---

## Install + smoke test (5 min)

1. On your Android device:
   - Make sure you're signed into the same Google account that's on the testers list for Internal testing
   - Open the opt-in URL from step 7
   - Tap **Become a tester** → opt in
   - Wait ~1 min, then tap **Download it on Google Play** (or open Play Store and search for buff-mobile)
2. Install v10 from Play Store
3. Open the app:
   - Reach the dashboard
   - Open at least 2-3 screens (Parent Dashboard, Teen Mode if available, Settings)
   - No crashes expected
4. Report back to CC: "v10 installed, dashboard reachable"

---

## Optional smoke crash (Sentry verification)

If you want to validate end-to-end that Sentry captures crashes from v10:

**Option A — manual smoke crash (requires CC to add a hidden affordance first):**
- This requires a one-off code change CC will guide you through if you choose this path. Skip for now unless you want belt-and-suspenders verification before sending the WhatsApp link.

**Option B — wait for a real event:**
- Sentry will capture any real crash that happens during your smoke test + the beta group's usage
- Login to https://buffadhd.sentry.io with `adi@buffadhd.com`
- Look at project `react-native` → Issues
- First event from the beta group typically lands within minutes of someone using v10

**PII audit (if any event lands):**
- Open the event JSON
- Search for `@` — should only appear inside `"[email]"` literal in breadcrumb messages, not real email addresses
- Search for any child name from your testing data (Etay, Emi, Itay, Mattan, Leia) — should be absent
- If any PII slips through → ping CC immediately, we tighten the scrubbers

---

## What CC will do after you confirm install + dashboard reachable

- Update STATUS.md → Phase 5 passed
- Update INTEGRATION_LEARNINGS.md → IN-2026-05-25-XX (lost-work pattern + mitigation)
- Update BUFF_DECISIONS_LOG.md → 2 D entries (Sentry re-adoption + work-loss root cause)
- Update CLAUDE.md §Tech Stack + §Open FLAGs
- F-2026-05-05-01 marked Resolved
- `git tag pkg/sentry-eas-resumption/v1`
- Open PR to main
- After merge: Verify-Before-Delete Protocol on the branch
- Sentry post-deploy regression check 15+ min after merge

You don't need to do anything for the closeout — just merge the PR when you see it.
