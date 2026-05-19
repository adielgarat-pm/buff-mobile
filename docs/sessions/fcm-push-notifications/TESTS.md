# pkg/fcm-push-notifications — TESTS

> Pass/fail criteria per phase. CC verifies each before declaring a phase complete.

## Phase 0 — Foundation

- [x] `public.notifications` schema verified via Supabase MCP — matches SPEC § Schema Changes
- [x] `pg_cron` extension confirmed installed (`installed_version: 1.6.4`)
- [x] `profiles.fcm_token` confirmed present, nullable text
- [x] `profiles.last_seen_at` confirmed ABSENT (will be added Phase 1)
- [x] `device_tokens` + `notification_pushes` tables confirmed ABSENT
- [x] Trigger function `handle_parent_sos_sent()` confirmed present (Vibe Check Phase 4a still live)
- [x] STATUS.md + TESTS.md + SPEC_SYNC.md scaffolded
- [ ] **🟡 Adi:** Firebase project + service account JSON acquired (Phase 3 blocker — does NOT block Phases 1-2, 4-8)

## Phase 1 — DB migration (`012_device_tokens.sql`)

- [ ] `device_tokens` table exists; columns + types match SPEC § Schema Changes
- [ ] `notification_pushes` table exists; columns match SPEC
- [ ] `profiles.last_seen_at` column exists, default `now()`
- [ ] `public.notifications` idempotent `CREATE TABLE IF NOT EXISTS` present (no-op on existing prod)
- [ ] `profiles.fcm_token` column DROPPED
- [ ] RLS policies enforced: `device_tokens` SELECT/INSERT/UPDATE owner-only; `notification_pushes` no public access
- [ ] Indexes present: `device_tokens (profile_id, token_type)`, `device_tokens (token)` unique
- [ ] Backfill query is idempotent (re-running migration doesn't duplicate rows)
- [ ] `supabase get_advisors` security check passes
- [ ] Supabase TypeScript types regenerated (if applicable)

## Phase 2 — Client token registration (Android, parent)

- [ ] `expo-notifications` installed (latest stable compatible with current Expo SDK)
- [ ] `app.json` plugin entry for `expo-notifications` present
- [ ] `usePushRegistration` hook unit-tested (mock the FCM token getter)
- [ ] `UStepPushPermissionPrePrompt.tsx` renders with correct HE+EN copy
- [ ] On fresh Android emulator install + parent onboarding completion: pre-prompt shown → grant → token appears in `device_tokens` with `token_type='fcm-android'`, `profile_id = parent.profile.id`
- [ ] On permission denial: graceful fallback, no token registered, app continues functioning, re-prompt eligible at next permission-relevant action
- [ ] `tsc --noEmit` clean
- [ ] No regression on existing onboarding flow

## Phase 3 — Edge Function dispatch (E1, E2, E13)

> **Blocked by Adi providing Firebase service account JSON.**

- [ ] `supabase/functions/push-notification-fanout/index.ts` deployed
- [ ] Database Webhook configured: trigger on `INSERT` on `public.notifications`
- [ ] FCM HTTP v1 OAuth2 JWT generation works in Deno
- [ ] Recipient resolution: parent_id → parent's tokens; child_id (no parent_id) → kid's tokens
- [ ] Activity-based suppression: when recipient's `last_seen_at < 5 min` → no FCM call, `notification_pushes` row inserted with `suppressed_reason='recent_activity'`
- [ ] Idempotency: webhook re-fire produces no duplicate push (`notification_pushes` PK guard)
- [ ] Dead-token cleanup: FCM 404 `UNREGISTERED` response → row deleted from `device_tokens`
- [ ] Manual SQL test: `INSERT INTO notifications (type='parent_sos', parent_id=X, family_id=Y, child_id=Z)` with parent's `last_seen_at` >5 min ago → push lands on Android emulator within 5s
- [ ] Same INSERT with parent's `last_seen_at` <5 min ago → no push, row in `notification_pushes` with suppression reason
- [ ] Edge Function logs show 200 from FCM on success

## Phase 4 — i18n + copy library

- [ ] `copy.ts` module with `{type, recipient_role, lang} → {title, body}` map
- [ ] All 6 push types covered: parent_sos, reward_redeemed, parent_engagement, family_joined (parent), kid_engagement, reward_approved (kid)
- [ ] HE + EN per type/role
- [ ] **Parent copy** passes IN-2026-05-17-01 checklist (declarative, connection-not-rescue, no rescuer verbs)
- [ ] **Kid copy** passes IN-2026-05-19-03 "body double test" (presence + autonomy-marker; no reward/task/count/progress mentions)
- [ ] `src/i18n/he.json` + `en.json` have matching keys for in-app toast variants
- [ ] `i18n:check` script clean (parity between HE + EN)

## Phase 5 — Foreground handling + tap-route

- [ ] `setNotificationHandler` configured: foreground push → suppressed tray, in-app toast shown
- [ ] `<PushToast>` component renders both parent + kid variants theme-aware
- [ ] `notificationRouter.ts` maps every type to a route + params
- [ ] Tap from foreground toast → correct route fires
- [ ] Tap from background tray → app cold-start or warm-start → correct route + params received
- [ ] No double-fire (tap doesn't trigger both tray + in-app handlers)

## Phase 6 — Kid permission flow

- [ ] ChildJoin onboarding has a post-completion hook
- [ ] `ChildJoinPushPrePrompt.tsx` shows with copy `"{buddy_name} רוצה להזכיר לך דברים — מותר?"` (friend voice per IN-2026-05-19-03)
- [ ] On grant: kid's FCM token registered in `device_tokens` with `profile_id=child_id`
- [ ] On denial: graceful, local notifications (Phase 8) still work
- [ ] Re-prompt opportunity at first parent-task assigned to that kid (if not granted)
- [ ] No regression on ChildJoin existing tests

## Phase 7 — Engagement scheduler (E5, E6)

- [ ] `migrations/013_engagement_scheduler.sql` applied
- [ ] `pg_cron` job scheduled daily 09:00
- [ ] `scan_disengaged_users()` SQL function inserts correct rows for kids @ 5d/14d and parents @ 5d+
- [ ] Cap + cooldown logic prevents duplicates (E5 max 2, E6 max 1/week, silent after 3 ignored)
- [ ] Manual SQL test: backdated `profiles.last_seen_at` (5d kid + 14d kid + 5d parent) → next scan inserts 3 rows of correct types
- [ ] Rows correctly trigger Edge Function via Database Webhook (same path as E1/E2)
- [ ] Push lands with body-doubling kid copy / declarative parent copy

## Phase 8 — In-app local notification scheduler (E7, E11)

- [ ] `useKidLocalNotifications.ts` hook implemented
- [ ] On app foreground (kid): reads today's tasks + phases from `src/types/phase.ts`
- [ ] For each phase (morning/afternoon/evening — school skipped): if `≥1 task` exists → schedule local notification at `first_task.scheduled_time + 60 min`
- [ ] Pre-fire check evaluates: task incomplete + last_seen_at < phase.start_time + no cooldown
- [ ] If kid opens app during phase BEFORE notification fires → notification cancelled
- [ ] If kid does NOT open for 3 days running in response to E7 for a phase → that phase's notifications silently skipped 3 days; auto-resumes
- [ ] Local notification copy = body-doubling per IN-2026-05-19-03:
  - morning: `"{buddy_name}: פה, מוכן/ה כשתרצה"`
  - afternoon: `"{buddy_name}: לידך, בקצב שלך"`
  - evening: `"{buddy_name} עומד/ת לידך 🌙"`
- [ ] Live verification on Android emulator: kid app installed, afternoon phase has task at 16:00, kid doesn't open → at 17:00 notification fires
- [ ] Cancellation verified: kid opens at 16:30 → no notification at 17:00

## Phase 9 — Web client stub (Expo Web, deferred verification)

- [ ] `firebase` web SDK installed (separate npm approval)
- [ ] `web/firebase-messaging-sw.js` Service Worker present
- [ ] `webPushRegistration.ts` wired behind `Platform.OS === 'web'`
- [ ] Token registration code path exists; verification deferred until Phase 2 web build is enabled
- [ ] No regression on native build

## Phase 10 — iOS design capture only

- [ ] SPEC appendix § "iOS APNs flow" complete
- [ ] No code changes
- [ ] Adi reviews when Apple dev account activates

## Phase 11 — Spec sync + closeout

- [ ] `BUFF_PRD.md §9.2` FCM line flipped to shipped
- [ ] `BUFF_FEATURE_AUDIT.md` S-01 → ✅
- [ ] `BUFF_FEATURE_PRIORITIZATION.md` F-039 + F-063 → shipped
- [ ] `BUFF_GAP_ANALYSIS.md` row updated
- [ ] `INTEGRATION_LEARNINGS.md` updated with any execution surprises (EX-1, EX-2, ...)
- [ ] STATUS.md closeout row
- [ ] Existing dashboard SOS surface snapshot test passes (no regression — `useParentNotifications` consumer unchanged)
- [ ] PR opened against main
- [ ] Build green
- [ ] Android emulator regression verified
