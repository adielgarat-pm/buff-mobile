# Hat-4 Playbook — Notifications on Real Android Device

> **Status:** queued for Adi · created 2026-05-26 · resumes 2026-05-27+
> **Context:** PR #58 (FCM client + dispatch) merged 2026-05-20 + PR #96 (anchor_recovery copy fix) opened 2026-05-26. Edge Function deployed as v9 ACTIVE. Code path is complete end-to-end but **0 device tokens have ever been registered** — no Hat-4 verification has happened yet.

## State at pause (2026-05-26)

| What | Where | State |
|---|---|---|
| FCM client code in production AAB | AAB v10 (shipped 2026-05-25 via PR #85) | ✅ shipped — no rebuild needed |
| FCM Edge Function | `supabase/functions/push-notification-fanout` v9 | ✅ ACTIVE (sha `49ea1558`) |
| Database Webhook on `notifications` INSERT | Supabase Dashboard | ✅ wired (per fcm STATUS Phase 3) |
| FCM service account JSON secret | Supabase Edge Function env | ✅ set 2026-05-20 |
| `anchor_recovery` push copy | This PR (#96) | ✅ deployed to v9 |
| `device_tokens` rows for Adi | live DB `gfrongfnyigxsexuofrg` | ❌ 0 rows — **this is what Hat-4 fixes** |
| PR #96 merge | GitHub | ⏳ open, waiting on Hat-4 sign-off |

## Why Hat-4 is the blocker

The pipeline records 363 push attempts over the last 14 days; all suppressed (`no_tokens` × 275, `unknown_type` × 87, `no_recipient_profile` × 1). Until at least one real device + permission grant lands a row in `device_tokens`, the feature has never delivered a push to a human.

## Prerequisites (already true — verify only)

- Phone: Android 13+ with Google Play Services (required for FCM)
- Account: Google account that is added to BUFF internal testing on Play Console
- Network: stable internet (FCM requires)
- BUFF: not currently installed OR signed out

## Step 1 — Install via Play Store internal testing

1. Open Play Store on the phone (the app, not web)
2. Search "BUFF" — should appear if your test account is in the internal testing list
3. Install

**If not visible:** ask CC to verify internal testing is published on Play Console for the test account email.

**Alternative:** USB-connect the phone + `npx expo run:android` for a dev build. FCM still works with `expo-notifications` in a dev build.

## Step 2 — Open + sign in as Parent + wait for pre-prompt

1. Launch BUFF
2. Sign in via Google OAuth **as parent role** (not child — kid voice prompt differs)
3. Wait for ParentDashboard to render
4. ~1.2 sec after dashboard renders, a modal appears:

> **Title:** להישאר מעודכן/ת
> **Body:** כשהילד/ה מבקש/ת לשתף או מסיים/ת משהו, נעדכן אותך בלי להעיר את כל הבית.
> **CTA:** להפעיל התראות
> **Secondary:** אולי אחר כך

5. Tap **להפעיל התראות** (NOT "אולי אחר כך" — that flag is session-scoped and the modal won't reappear this session)
6. Android system permission dialog appears → tap **Allow**

**Pre-prompt source:** `src/components/NotificationGate.tsx` + `src/screens/onboarding/PushPermissionPrePrompt.tsx` (handles both `audience='parent'` and `audience='kid'`).

## Step 3 — CC verifies the token landed

Tell CC: **"אישרתי, תבדוק token"**. CC runs:

```sql
SELECT profile_id, token_type, last_seen_at, created_at
FROM public.device_tokens
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** at least one row with Adi's parent profile_id, `token_type='fcm-android'`, `last_seen_at` within seconds of now.

**If no row:** Play Services failed to mint a token. Force-stop the app + reopen + tap CTA again. If still nothing — CC inspects `src/lib/pushTokens.ts` for the failure path.

## Step 4 — First push test (SOS)

Two paths — pick whichever is faster on your end.

### Path A (fast, MCP-driven) — CC injects the row

Tell CC: **"תייצר SOS לבדיקה"**. CC runs:

```sql
INSERT INTO public.notifications (family_id, parent_id, child_id, type, child_name, entity_id, entity_name)
VALUES (
  '<your family_id>',
  '<your parent profile_id>',
  '<one of your kid profile_ids>',
  'parent_sos',
  '<kid display name>',
  gen_random_uuid(),  -- placeholder entity_id
  ''
);
```

Database Webhook fires → Edge Function calls FCM → push lands on Adi's phone within 5 sec.

### Path B (E2E real) — kid presses SOS

1. ParentDashboard → tap "צפה כילד" (View-as-Child P-08) on a kid card
2. In ChildApp → Low Power Mode → tap SOS
3. Switch back to parent context
4. Wait ≤5 sec for the push

### Expected push content

- **Title:** `{kid name} רצה/רצתה לשתף`
- **Body:** `יום של אנרגיה נמוכה`
- **Tap target:** ParentDashboard with the SOS dot lit on that kid's card

## Step 5 — anchor_recovery push (NEW from PR #96)

This is the copy that didn't exist before today. Worth a dedicated check.

Tell CC: **"תייצר anchor_recovery"**. CC runs:

```sql
INSERT INTO public.notifications (family_id, parent_id, child_id, type, child_name, entity_id, entity_name)
VALUES (
  '<your family_id>',
  '<your parent profile_id>',
  '<one of your kid profile_ids>',
  'anchor_recovery',
  '<kid display name>',
  null,
  ''
);
```

### Expected push content

- **Title:** `{kid name} לקח/ה הפסקה`
- **Body:** `יש שתי הצעות עדינות לפתיחה מחדש`
- **Voice check:** declarative + connection-not-rescue. Should NOT feel like an alarm. If the body reads as "you missed X days" or "your kid is behind" — Pillar-2 fail, return to copy review.

## Step 6 — Behavior trio

### A. Foreground suppression
1. Keep BUFF open in foreground
2. CC pushes another SOS
3. **Expected:** NO tray notification. Instead: in-app toast (theme-aware, top of screen)

### B. Background / lockscreen
1. Lock the phone
2. CC pushes SOS
3. **Expected:** notification appears on lockscreen with full title + body. Unlock + tap → app opens to ParentDashboard

### C. Tap-to-route
1. From tray (background) → tap the SOS notification
2. **Expected:** BUFF opens directly to ParentDashboard, the SOS dot is visible on the relevant kid's card, the bell badge increments

## Diagnostic tree if something breaks

| Symptom | Likely cause | CC action |
|---|---|---|
| Modal never appears | Already granted earlier OR not parent role | Check `Notifications.getPermissionsAsync()` status; verify `profile.role === 'parent'` |
| Tap Allow → no token row | Play Services issue | Force-stop + reopen; inspect `src/lib/pushTokens.ts` `getPushToken()` |
| Token exists but no push arrives | Webhook didn't fire | CC runs `mcp__supabase__get_logs service=edge-function` |
| Push arrives in English | `profile.preferred_language` ≠ 'he' | CC: `UPDATE profiles SET preferred_language='he' WHERE id=…` |
| Push fires twice | Idempotency guard failed | Diagnostic only — check `notification_pushes` for double entry |
| Foreground shows tray push | `setNotificationHandler` not registered | CC inspects `src/lib/notificationHandler.ts` |
| Push body shows literal `{name}` | copy interpolation broke | CC inspects Edge Function `copyForType` |

## After Hat-4 passes — close out

1. Merge PR #96
2. Update `docs/sessions/fcm-push-notifications/STATUS.md` — add Phase 11 closeout row with Adi sign-off date + device model
3. CLAUDE.md Open FLAGs — remove the "pkg/fcm-push-notifications MVP-critical pending Hat-4" line
4. Save a memory: `feedback_hat4_passed_fcm` so future sessions know FCM is verified end-to-end
5. **Lovable Publish reminder:** N/A — no Lovable surface touched
6. Optional v1.1 follow-ups (none blocking):
   - Cron scoping to beta cohort only (Lovable ghosts)
   - iOS push (when Apple Dev account active)
   - Web push (when Expo Web Phase 2 ships)
   - Per-type opt-out for parent
   - Permission-denial recovery (deep-link to Settings)

## Quick-resume prompt for tomorrow (paste into a new CC session)

```
Resume Hat-4 verification for the FCM notifications feature. Read first:
- docs/sessions/fcm-push-notifications/HAT4_PLAYBOOK.md (this file)
- docs/sessions/fcm-push-notifications/STATUS.md
- supabase/functions/push-notification-fanout/index.ts (current dispatcher)

Branch state: pkg/fcm-polish (PR #96 open). Edge Function already deployed
to v9 ACTIVE. No code work needed — Hat-4 is device-only verification by Adi.

CC role today:
- Run MCP queries to confirm token registration after Adi grants permission
- Inject test rows for parent_sos + anchor_recovery on Adi's command
- Diagnose any failures via get_logs + execute_sql
- Update STATUS.md + memory after sign-off
- Do NOT modify any client code unless Hat-4 reveals a bug
```
