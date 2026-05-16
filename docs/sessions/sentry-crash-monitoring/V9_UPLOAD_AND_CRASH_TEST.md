# v9 Upload + Sentry Crash Test — Adi guide

> CC-prepared materials for `pkg/sentry-crash-monitoring` Phase 4 + 5.
> Build: `9e0af79f-6677-437b-9c8d-6f4287c482b2` (versionCode 9, Sentry-enabled)
> Logs: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/9e0af79f-6677-437b-9c8d-6f4287c482b2

---

## What's different in v9 vs v8

- **v8**: First AAB. No crash monitoring. Crashes show as obfuscated stack traces in Play Console Android Vitals.
- **v9**: Sentry initialized at app launch. Any unhandled error, uncaught promise, or `console.error` → captured in real-time at `https://buffadhd.sentry.io/issues/?project=4511398393348096` within ~60s. Email alert hits `adi@buffadhd.com` on each new crash signature. PII (emails, display names, IP) is scrubbed before events leave the device.

If you already published v8 to Internal Testing, upload v9 as a new release in the same track — it supersedes v8. Existing testers will get v9 as an auto-update via Play Store.

If you didn't publish v8 yet — skip v8 entirely and just publish v9.

---

## Step 1 — Verify source maps uploaded (CC checks build logs)

Once EAS Build status flips to `FINISHED`, CC will check the build logs for a line matching `Uploading source maps to Sentry` or similar. If that line is absent, source maps weren't uploaded → crashes in Sentry would still be useful but less precise (would show TS file line numbers from the bundled JS, not the original source).

CC will report this before you upload v9 to Play Console.

## Step 2 — Download the v9 AAB

```powershell
npx eas build:download 9e0af79f-6677-437b-9c8d-6f4287c482b2
```
Or open the build URL above → Download.

## Step 3 — Play Console upload

Same flow as v8 (see [PLAY_CONSOLE_FIRST_UPLOAD.md](../expo-health-and-eas-android/PLAY_CONSOLE_FIRST_UPLOAD.md) Steps 2-6).

Suggested release notes addendum (in addition to the v8 notes if applicable):

### EN

```
v9 — Internal testing release with Sentry crash monitoring enabled.

Same feature set as v8. The only change is internal: crashes and errors are now reported in real-time to our monitoring dashboard so we can fix issues faster. No personal data leaves the device — emails, names, and IP addresses are scrubbed before any event is sent.
```

### עברית

```
v9 — גרסת בדיקות פנימית עם ניטור קריסות (Sentry).

אותו פיצ'ר-סט כמו v8. השינוי היחיד פנימי: קריסות ושגיאות מדווחות עכשיו בזמן-אמת לדשבורד ניטור, כדי שנוכל לתקן בעיות מהר יותר. אין מידע אישי שעוזב את המכשיר — אימיילים, שמות וכתובות IP נחתכים לפני שכל אירוע נשלח.
```

## Step 4 — Install v9 + smoke test

1. Internal testing link → install on Pixel_7 AVD or real Android device
2. Open BUFF, sign in via Google
3. Reach the dashboard (parent or child mode)
4. Navigate a few screens — no crash should occur

If you reach this point, basic install is OK. Now we want to verify Sentry actually captures a crash.

## Step 5 — Trigger a test crash (verify Sentry capture)

Three options, pick whichever feels easiest:

### Option A — Use Sentry's "Test Event" button (zero code)

1. Open https://buffadhd.sentry.io/issues/?project=4511398393348096
2. If a banner says "We're waiting for your first event" — there's a button to **Send a test event**. Click it.
3. Within ~30s, the test event should appear in the Issues list.
4. This verifies DSN + ingestion only. Not a real app crash.

### Option B — Force a crash in the app (real app verification)

1. The simplest natural crash trigger in BUFF: try to access a screen that depends on something not yet loaded.
2. Or: turn airplane mode on, then attempt a network-dependent action (sign-in, fetch tasks). Some errors are caught silently — others propagate to Sentry as unhandled.
3. Or: kill the Supabase URL by editing `EXPO_PUBLIC_SUPABASE_URL` to invalid in eas.json + rebuild v10 (overkill for this test).

### Option C — Sentry CLI from CC (after install)

After you install v9, ping CC and we can fire a one-shot test event via `npx @sentry/cli send-event` from your laptop. This proves the auth token + project setup at minimum.

**Goal of any option:** see at least one event in https://buffadhd.sentry.io/issues/ — with readable stack trace (showing `App.tsx:XX` or other TypeScript source paths, NOT `bundle.js:YY:ZZ`).

## Step 6 — PII audit (CC + Adi together)

Once an event appears in Sentry:
1. Open the event
2. Inspect the **User** section — should be empty or scrubbed (no email, no username, no IP)
3. Inspect **Breadcrumbs** — no email addresses, no display names, no child profile names
4. Inspect **Tags** + **Contexts** — same standard

If any PII leaks through, CC tightens the `beforeSend` / `beforeBreadcrumb` hooks in App.tsx and rebuilds.

## Step 7 — Done

After Step 6 passes:
1. Ping CC: "Sentry receives events, no PII leak"
2. CC will:
   - Update CLAUDE.md §Tech Stack: Sentry now in the live observability stack
   - Add closeout STATUS row
   - Tag `pkg/sentry-crash-monitoring/v1`
   - Prep PR-merge instructions
