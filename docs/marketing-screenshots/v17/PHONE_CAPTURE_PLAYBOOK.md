# Marketing Screenshots — Phone Capture Playbook

> **For Adi.** Self-contained — usable from a fresh CC session.
> **Created:** 2026-05-27
> **Why phone, not emulator:** dev build on emulator has dev artifacts (RevenueCat toast, "Dev: Simulate Subscribed" toggle) that don't exist in production v16. Plus emulator Metro server kept timing out during this session.

## State at start (already done by CC)

| ✅ Ready in DB | What |
|---|---|
| Adi's family | Adi (parent), Itay, Emi, Leia |
| All names in English | renamed עדי→Adi, אמי→Emi |
| Leia data | 13 English tasks, 2180 BUFFs, BUDDY "Sparky" lvl 5 + 12-day streak, puppy skin |
| Family rewards | 7 items: Skip annoying chore (140), Family movie night (126), Be coach for a day (280), Make something with parent (294), Pizza night (350), Extra 15 min screen (600), Fun day out (700) |
| Adi.preferred_language | `en` (server-side push lang) |
| ZTest520 | deleted |

| ✅ Already designed | Where |
|---|---|
| App icon (512×512) | `assets/BUFF_LOGO_PLAY_STORE_512.png` |
| Feature graphic (1024×500) | `assets/BUFF_FEATURE_GRAPHIC_1024x500.png` |
| Listing copy (EN) | `docs/BUFF_MESSAGING.md` §5.2 + §5.3 — already pasted into Play Console |

## What's pending (this playbook)

1. Install **v16 production** on Adi's phone from Play Store internal testing
2. Switch phone system language to **English**
3. Sign in as Adi (Google OAuth)
4. Capture 6-7 representative screens
5. Send screenshots back to CC OR upload directly to Play Console listing

---

## Step 1 — Install v16 production

If already installed: skip. Otherwise:

1. On phone, open **Play Store app**
2. Sign in with the Google account that's on the BUFF internal testing list
3. Search "BUFF" — should appear with new listing name "BUFF: Habit Quest Kids & Teens" (after Play Store sync)
4. Tap **Install**
5. Verify version is **v16** (Play Store → BUFF page → "About this app" → "Version")

**If v16 doesn't appear:** check that:
- Play Console internal testing track lists v16 as the latest release
- Your Google account is in the testers list

## Step 2 — Switch phone to English

1. **Settings** → **System** → **Languages & input** → **Languages**
2. Add **English (US)** if not present
3. Drag it to the TOP (above עברית) — makes it the system default
4. **Reboot the phone** OR just close + reopen BUFF
5. Verify Android system shows in English (Settings shows "Settings" not "הגדרות")

> **Why this matters:** BUFF i18n likely reads device locale. Even though Adi's profile `preferred_language` is `en` for push, the in-app UI follows the device locale.

## Step 3 — Open BUFF + sign in

1. Open **BUFF** (launcher should say "BUFF", not "buff-mobile")
2. Sign in with **Google OAuth as Adi** (`adi.elgarat@gmail.com` — that's the account linked to the family in DB)
3. Wait for Parent Dashboard to load

### Expected — check these 4 things

- ✅ "Good morning, **Adi**" (not "עדי") at top
- ✅ Three child cards visible: **Leia**, Itay, Emi (Leia should have a buddy "Sparky" face)
- ✅ NO red error toast at the bottom
- ✅ NO "Dev: Simulate Subscribed" toggle anywhere in Settings

If you see Hebrew names ("עדי" / "אמי") — the app might be caching old data. Pull down to refresh OR force-stop the app + reopen.

If push permission pre-prompt appears within 1.2 sec — **DISMISS** it (we'll handle Hat-4 separately).

## Step 4 — Capture 6-7 screens

For each screen: **Power + Volume Down** simultaneously → screenshot saved to phone's gallery.

### Screen 1 — Parent Dashboard (the hero screen)

Where you land after sign-in. Expected to show:
- 3 child cards
- Daily progress numbers
- Add Child CTA

**Goal:** show that a parent manages multiple kids with rich BUFF balance.

### Screen 2 — Parent Tasks (Leia selected)

1. Tap **Tasks** in bottom nav
2. Tap **Leia** chip (purple)
3. Expected: 13 tasks listed by time (7:00 → 20:30)

**Goal:** show full routine structure across the day.

### Screen 3 — Manage Children

1. Tap **Settings** in bottom nav
2. Scroll down to **Family** section
3. Tap **Manage children**
4. Expected: 3 cards (Leia, Itay, Emi)

**Goal:** show multi-kid management.

### Screen 4 — Vibe Check (Gamer kid view)

1. Back to **Settings** → scroll to **Preview** section → tap **View as Child**
2. Pick **Leia** (if asked)
3. Expected: dark "How are you feeling right now?" overlay with 5 bars

**Goal:** show the Vibe Check unique feature. Bonus: dark/gamer theme.

### Screen 5 — Child Dashboard (Mint theme, with BUDDY)

1. From the Vibe Check overlay, tap **MAYBE LATER**
2. Expected: Kid dashboard with BUDDY "Sparky" hero, 2180 BUFFs visible

**Goal:** show the kid UI + BUDDY hero.

### Screen 6 — Child Rewards (the real-world prizes)

1. Tap **Shop** (or **Rewards** in Mint theme) in bottom nav
2. Expected: 7 reward cards (Skip chore 140 / Family movie 126 / Coach for a day 280 / Pizza 350 / etc.)

**Goal:** show real-world rewards (Pillar 1 differentiator vs Joon's virtual coins).

### Screen 7 (optional) — Child Tasks

1. Tap **Quests** (or **Tasks**) in bottom nav
2. Expected: today's 13 tasks listed

**Goal:** show the kid sees the same routine but in their voice.

## Step 5 — Send to CC OR upload directly

### Option A — send to CC for review
Email screenshots OR drop them in this folder:
`C:\Users\adiel\buff-mobile\docs\marketing-screenshots\v17\phone\`

CC will then:
- Review for any issues
- Crop status bar if needed
- Rename to a consistent scheme (01_parent_dashboard, etc.)
- Help you upload to Play Console

### Option B — upload directly to Play Console
Play Console → Main store listing → scroll to **Screenshots for phone** → Add screenshots → select files from phone (USB transfer OR cloud).

Order them this way (top → bottom in listing):
1. Parent Dashboard (the family hero)
2. Vibe Check Gamer (the unique feature)
3. Child Dashboard with BUDDY (the kid experience)
4. Manage Children (multi-kid)
5. Child Rewards (real-world rewards differentiator)
6. Parent Tasks (full routine)

---

## Combines with Hat-4 (push verification)

After Step 3 (sign in), if you want to also verify FCM push:
- Don't dismiss the push pre-prompt — accept it instead
- Tell CC "אישרתי"
- CC runs MCP queries per `docs/sessions/fcm-push-notifications/HAT4_PLAYBOOK.md`

You don't have to do this now — but as long as the phone has BUFF open + signed in, it's basically free to also check push.

---

## Resume prompt for a new CC session

If this session ends before you finish, paste this into a fresh CC:

```
Resume marketing screenshot capture from real phone.
Read docs/marketing-screenshots/v17/PHONE_CAPTURE_PLAYBOOK.md first.

State summary:
- Leia + 13 tasks + 2180 BUFFs already in mobile DB (gfrongfnyigxsexuofrg)
- Adi/Itay/Emi/Leia all English names in DB
- App icon + Feature graphic + listing copy already in Play Console (en-US)
- Phone screenshots are the only missing piece

User (Adi) will send 6-7 phone screenshots OR confirm upload to Play Console.
Help: review, crop status bar if needed, rename consistently, organize order.
```

---

**Lovable Publish reminder:** N/A for this work (Play Console + mobile only — no Lovable surface touched).
