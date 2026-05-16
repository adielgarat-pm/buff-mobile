# Play Console — First Internal Testing Upload

> CC-prepared materials for Phase 4. Adi-driven; CC has no Play Console API access in this package.
> Build: `2d91bc38-baac-4828-975b-da8b2fe6d1ae` (Android production AAB, versionCode 8)
> Logs: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/2d91bc38-baac-4828-975b-da8b2fe6d1ae

---

## Step 1 — Download the AAB

Once EAS Build status flips to `FINISHED`:

1. Open the build URL above
2. Click **Download** on the artifact (file extension `.aab`)
3. Save somewhere stable — e.g. `C:\Users\adiel\buff-mobile\builds\buff-v1.0.0-b8.aab`

Or via CLI:
```powershell
npx eas build:download 2d91bc38-baac-4828-975b-da8b2fe6d1ae
```

## Step 2 — Open Play Console

1. https://play.google.com/console/
2. Select the **BUFF** app (package `com.buffapp.mobile`)
3. Left sidebar → **Testing** → **Internal testing**
4. **Create new release**

## Step 3 — Upload AAB

1. **App bundles** section → drag-and-drop the `.aab` file
2. Play Console will verify the upload key fingerprint matches the registered upload key for this app
   - **If you see "wrong upload key"**: stop. The EAS-managed keystore `dG1dqozJHO (default)` differs from whatever Play Console expects. Surface to CC — we will need to either (a) switch EAS to your D-2026-05-01-06 backed-up keystore, or (b) request an upload key reset from Google (1-3 business days).
   - **If verification succeeds**: continue.
3. Wait for the AAB to finish processing (~30s-2min)

## Step 4 — Release notes

Paste the release notes below. Both languages can be added — Play Console supports multiple locales.

### Release notes — English

```
First internal release of BUFF.

BUFF is an ADHD support app for children and teens (ages 6-18). It builds intrinsic motivation through routines, a BUDDY companion that grows with the child, and real-world rewards the child chooses themselves.

Includes:
- Children Mode (ages 6-12) — guided routines with a friendly BUDDY pet
- Teen Mode (ages 13-18) — Itay-co-designed UI with optional BUDDY toggle
- Vibe Check — daily mood check-in that adapts the day's task list
- Pause Mode — parent-controlled break for vacations, illness, or hard weeks
- Hebrew + English UI
- Parent dashboard with task setup and reward approval

For internal testers only — please report issues to adi@buffadhd.com.
```

### Release notes — עברית

```
הגרסה הפנימית הראשונה של BUFF.

BUFF היא אפליקציה לתמיכה בילדים ובני נוער עם ADHD (גילאי 6-18). היא בונה מוטיבציה פנימית באמצעות שגרות יומיות, דמות BUDDY שגדלה יחד עם הילד, ופרסי חיים אמיתיים שהילד בוחר בעצמו.

הגרסה כוללת:
- מצב ילדים (6-12) — שגרות מודרכות עם BUDDY חברותי
- מצב בני נוער (13-18) — ממשק שעוצב יחד עם Itay, עם אפשרות להחביא או להציג את ה-BUDDY
- Vibe Check — צ׳ק-אין יומי שמתאים את רשימת המשימות לפי המצב
- Pause Mode — אפשרות הורית להפסקה לחופשים, מחלה או שבועות קשים
- ממשק בעברית ובאנגלית
- דשבורד להורה: הגדרת משימות ואישור פרסים

למבחני פנים בלבד — דווחי על בעיות ל-adi@buffadhd.com.
```

## Step 5 — Add testers

If the **Internal testers** list is empty:

1. **Testers** tab → **Create email list** → name it something like "BUFF Internal — Family + Beta Crew"
2. Add at minimum: `adi.elgarat@gmail.com` (yours)
3. Optionally add Itay, Emi, friends/family on Android
4. Save

## Step 6 — Save and roll out

1. **Save** the release
2. **Review release** — Play Console will run checks (target SDK, signing, content rating)
3. If checks pass → **Start rollout to Internal testing**
4. Confirm the dialog

Within ~5-15 minutes the release becomes available via the internal testing link (under "Testers" tab → "Copy link" or "Join on the web").

## Step 7 — Install and smoke test

1. Open the internal testing link on your Android phone (or Pixel_7 AVD)
2. Google Play opens → tap **Install**
3. Once installed, open BUFF
4. Sign in via Google OAuth
5. Reach the parent or child dashboard
6. Confirm: app does not crash, language switches correctly, BUDDY visible (or hidden if Teen-without-BUDDY)

If anything fails at Step 7: take a screenshot, capture the crash logs from Play Console → **Quality** → **Android vitals** → **Crashes**, and ping CC.

---

## First-release Play Console fields you may need to fill

If the listing was minimally created earlier (per D-2026-05-01-06 / your 2026-05-16 confirmation), Play Console may still require these BEFORE the first release can roll out. Quick fields and where to find them:

| Field | Required for | Source |
|---|---|---|
| Short description (80 chars) | Public store listing | Draft below |
| Full description (4000 chars) | Public store listing | Draft below |
| App icon (512×512) | Public store listing | Use a 512px PNG of `assets/BUFF_LOGO.png` |
| Feature graphic (1024×500) | Public store listing | Generate from BUFF brand kit (out of scope this package — defer) |
| Phone screenshots (min 2, 16:9 to 9:16) | Public store listing | 2-4 Pixel_7 AVD screenshots: parent dashboard, child dashboard, BUDDY screen, rewards |
| Privacy policy URL | Required if app has internet access | `https://buffadhd.com/privacy` if it exists; otherwise create a minimal one before going public |
| Content rating | Required pre-rollout | Questionnaire — for BUFF answer: violence=none, nudity=none, profanity=none, gambling=none, children-targeted=yes |
| Target audience | Required pre-rollout | Age range 6-12, 13-15, 16-17 (Play Console buckets), parental consent required |
| Data safety form | Required pre-rollout | Declare: account info (email, name), app activity (task data), all data linked to user identity, encrypted in transit (Supabase TLS) |

**Internal Testing track does NOT require all public-store fields to be filled.** Internal Testing is more permissive than Closed/Open/Production tracks. Most of the above is needed before you move to **Closed testing** or **Production** later — but you can defer them for the Internal Testing first ship.

### Short description draft (80 chars max — 79 chars)

```
ADHD support for kids and teens — routines, a buddy, and real-world rewards.
```

### Full description draft (English, ~600 chars — well under 4000 limit)

```
BUFF is the ADHD support app that builds intrinsic motivation, not screen-time loops.

Designed for children and teens ages 6-18, BUFF turns daily routines into a game with a BUDDY companion that grows alongside your child — and rewards they choose themselves from the real world, not the app.

What's inside:
• Children Mode (6-12): guided routines with a friendly BUDDY
• Teen Mode (13-18): designed with teens, with optional BUDDY toggle
• Vibe Check: daily mood check-in that adapts the day's load
• Pause Mode: one button when life hits — vacations, illness, hard weeks
• Hebrew + English

BUFF is built on three pillars: intrinsic motivation, positive coaching, independence-building. The goal isn't to keep your child engaged with our app. It's to help them outgrow needing it.
```

---

## Done?

Once Step 7 passes:
1. Reply to CC: "uploaded, installed, dashboard reaches" (or describe the failure)
2. CC will close out Phase 4 — update CLAUDE.md §Tech Stack line 226, write the new D-2026-05-16 entry in DECISIONS_LOG, tag the release, and prep the closeout commit
