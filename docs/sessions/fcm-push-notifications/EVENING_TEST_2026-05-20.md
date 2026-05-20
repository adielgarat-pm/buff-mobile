# Evening test — pkg/fcm-push-notifications (2026-05-20)

> What Adi can verify tonight, and what's still blocked on Firebase setup.

## TL;DR

10 phases complete. Everything **except the actual server push delivery** (Phase 3) is testable now.

Phase 3 unblocks the moment Adi pastes the Firebase service account JSON. After that, end-to-end push (parent_sos, reward_redeemed, family_joined, kid_engagement, etc.) works.

## Branch

`pkg/fcm-push-notifications` — 4 commits ahead of `pkg/notification-spec`:
- `4239b09` Phase 0 (foundation)
- `1e77088` Phase 1 (migration 012 — DB schema)
- `278d3c7` Phases 2/4/5/6/8 (client + i18n + body-doubling local)
- `94473eb` Phases 7+9+10 (engagement scheduler + web stub + iOS docs)

To pull locally:
```
git checkout pkg/fcm-push-notifications
git pull origin pkg/fcm-push-notifications
```

## What's deployed to live Supabase (gfrongfnyigxsexuofrg)

Two migrations applied:
1. **Migration 012** — `device_tokens` table, `notification_pushes` idempotency table, `profiles.last_seen_at` column, `profiles.fcm_token` dropped
2. **Migration 013** — `scan_disengaged_users()` function + `pg_cron` daily job at 06:00 UTC

Both verified via MCP `apply_migration` returning `{success: true}` + `get_advisors` security check clean.

## Tests Adi can run tonight

### Test 1 — Schema verification (MCP, 30 sec)

Run in Supabase SQL editor OR ask CC to run via MCP:

```sql
-- Should return 3 rows: device_tokens, notification_pushes, profiles (with last_seen_at)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('device_tokens', 'notification_pushes');

-- Should return: TRUE
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles' AND column_name='last_seen_at'
) AS last_seen_at_exists;

-- Should return: FALSE (column was dropped)
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles' AND column_name='fcm_token'
) AS fcm_token_exists;

-- Should return: 1 row, jobname='scan_disengaged_users_daily', schedule='0 6 * * *'
SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'scan_disengaged%';
```

### Test 2 — App boot (no regression)

`npm run web` should still launch cleanly. ParentDashboard SOS dot still works (Vibe Check Phase 4b preserved — the `useParentNotifications` hook untouched in this package).

### Test 3 — Pre-prompt modal (Android emulator or device)

1. Build dev: `npx expo run:android` (or `eas build --profile development --platform android`)
2. Install on device → sign in as a parent
3. Within ~1.2 sec of dashboard render → modal appears:
   - Title: **"להישאר מעודכן/ת"** (HE) / "Stay in the loop" (EN)
   - Body: **"כשהילד/ה מבקש/ת לשתף או מסיים/ת משהו, נעדכן אותך בלי להעיר את כל הבית."**
   - CTA: **"להפעיל התראות"** + dismiss: "אולי אחר כך"
4. Tap "להפעיל התראות" → Android system permission dialog
5. Tap "Allow" → behind the scenes:
   - `usePushRegistration` calls `Notifications.getExpoPushTokenAsync()`
   - Token upserted into `public.device_tokens` with `token_type='fcm-android'`, `profile_id` = your parent profile id
6. Verify via MCP:
   ```sql
   SELECT profile_id, token_type, last_seen_at FROM public.device_tokens
   ORDER BY created_at DESC LIMIT 5;
   ```

### Test 4 — Dismiss path

1. Fresh install → sign in as parent → modal appears
2. Tap "אולי אחר כך"
3. Modal disappears; flag set in-memory (session-scoped only — kills app + reopen → modal returns until granted)

### Test 5 — Kid voice pre-prompt (View-as-Child or kid device)

1. Switch to kid (via View-as-Child P-08 OR sign in via ChildJoin)
2. Modal title becomes **"BUDDY רוצה להזכיר לך דברים"** + body **"BUDDY פה כשתרצה. אפשר להפעיל התראות שקטות, אם בא לך."**
3. Friend voice, body-doubling — verify nothing mentions rewards/tasks/BUFFs

### Test 6 — last_seen_at lifecycle

1. Bring app to background → wait 1 minute → bring to foreground
2. `usePushRegistration` calls `bumpLastSeenAt(profileId)`
3. Verify via MCP:
   ```sql
   SELECT id, role, last_seen_at FROM public.profiles
   WHERE id = '<your profile id>';
   -- last_seen_at should be within seconds of now()
   ```

### Test 7 — Engagement scheduler dry-run (no push expected without Phase 3)

```sql
-- Run the scan function manually (would normally run at 06:00 UTC daily)
SELECT * FROM public.scan_disengaged_users();
-- Returns (kid_engagement_inserts, parent_engagement_inserts)
-- Expected: (0, 0) tonight because all profiles just had last_seen_at bumped today

-- To force-test: backdate one parent and re-run
-- UPDATE public.profiles SET last_seen_at = now() - INTERVAL '6 days'
--   WHERE id = '<some parent profile id>';
-- SELECT * FROM public.scan_disengaged_users();
-- Should return (0, 1). Check the new row:
-- SELECT * FROM public.notifications WHERE type='parent_engagement' ORDER BY created_at DESC LIMIT 5;
```

### Test 8 — Local notification (E7 body-doubling) — kid device

If a kid profile has a task scheduled today in afternoon phase (16:00-18:00):

1. Open kid app at 16:00 → `useKidLocalNotifications` reads tasks + schedules notification at 17:00 (task_time + 60min)
2. Close the app
3. At 17:00 → if task still incomplete AND kid hasn't opened during afternoon → tray push fires
4. Push title: **"BUDDY"**, body: **"לידך, בקצב שלך"** (HE) / "with you, at your pace" (EN)
5. If kid opens before 17:00 → notification cancelled (next foreground will reschedule)

To force-test without waiting: set system time forward OR manually call `Notifications.scheduleNotificationAsync` from dev tools.

## What's still blocked

### 🔴 Phase 3 — Edge Function dispatch

**Cannot test end-to-end FCM push without:**
1. Firebase project created
2. Service account JSON
3. `FCM_SERVICE_ACCOUNT_JSON` secret in Supabase Edge Functions
4. Edge Function `push-notification-fanout` deployed
5. Database Webhook on `public.notifications` INSERT → Edge Function URL

**Once Adi provides Firebase JSON, CC can complete Phase 3 in ~30-60 min:**
- Write the Edge Function (Deno/TypeScript)
- Deploy via `supabase functions deploy`
- Configure Database Webhook
- Test E1 (SOS push) end-to-end on emulator

### 🔴 Phase 11 — Closeout PR

Will land after:
- Phase 3 complete + verified
- Adi evening test signs off
- Canonical doc updates (PRD §9.2 + AUDIT S-01 + GAP_ANALYSIS) — CC executes
- Adi pending edits: CLAUDE.md Open FLAGs + BUFF_BRAND.md §6 (body-doubling voice template)

## Adi pending action items

1. **Firebase setup + service account JSON** — see CC message earlier this evening for step-by-step
2. **CLAUDE.md § Open FLAGs** — add `pkg/fcm-push-notifications` + `pkg/parent-notification-feed` as MVP-critical (CC doesn't touch CLAUDE.md unilaterally)
3. **BUFF_BRAND.md §6** — optional: add body-doubling voice template per IN-2026-05-19-03 (can defer to Phase 11)
4. **Evening verification** — run Tests 1-8 above; report any unexpected behavior

## What to look out for during testing

- ✅ **Expected:** modal appears on first parent dashboard load after fresh install
- ✅ **Expected:** modal does NOT appear if permission already granted (token re-registers silently)
- ✅ **Expected:** modal returns next session if user dismissed without granting
- ⚠️ **Watch for:** Android emulator without Google Play Services — `getExpoPushTokenAsync` will fail; use a real device OR a Pixel emulator image WITH Google Play
- ⚠️ **Watch for:** Expo Go vs EAS Build difference — in Expo Go, the token is an Expo push token (routed via expo's push service); in EAS Build, it's a native FCM token. Both work with the Edge Function path (Phase 3 will normalize)
- ⚠️ **Watch for:** Hebrew RTL rendering on the modal — should be right-aligned with the X/Y buttons stacked

## How to roll back if something is broken

Migrations 012 + 013 are reversible. CC can write migration 014 that:
- Re-adds `profiles.fcm_token` column (will be empty — original data was 0 rows)
- Drops `device_tokens` + `notification_pushes` tables
- Drops `scan_disengaged_users` function + unschedules cron job
- Drops `profiles.last_seen_at` column

Code rollback: `git revert 94473eb 278d3c7 1e77088` reverts all FCM-package commits and brings the app back to pre-FCM state (planning branch only). The `pkg/notification-spec` SPECs stay untouched.

---

**Built and tested by:** CC (Claude Code, autonomous mode per Adi 2026-05-20)
**Branch ready for Adi review:** `pkg/fcm-push-notifications`
**Next session:** Phase 3 (Edge Function) — paste Firebase JSON in chat to unblock
