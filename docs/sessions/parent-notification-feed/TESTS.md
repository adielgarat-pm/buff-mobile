# pkg/parent-notification-feed — TESTS

> Pass/fail criteria per phase. CC verifies each before declaring a phase complete.

## Phase 0 — Foundation

- [x] Branch created off pkg/fcm-push-notifications (FCM infra present for combined APK)
- [x] STATUS / TESTS / SPEC_SYNC scaffolded
- [x] Schema verified — public.notifications + RLS policies allow parent UPDATE is_read

## Phase 1 — Generalized hook + refactor

- [ ] `src/hooks/useNotificationsFeed.ts` created
- [ ] Returns: ordered list, unread count, mark-as-read mutations, mark-all-as-read mutation, realtime updates
- [ ] `src/hooks/useParentNotifications.ts` becomes a thin selector on `useNotificationsFeed`
- [ ] **Dashboard SOS surface snapshot test** passes — `useParentNotifications` return shape unchanged for `ParentDashboardScreen` consumer
- [ ] `tsc --noEmit` clean
- [ ] `jest` 79+ tests still passing

## Phase 2 — Header bell + badge

- [ ] `src/components/parent/ParentNotificationBell.tsx` created
- [ ] `src/navigation/ParentTabs.tsx` integrated — `headerRight` shows bell across all 5 tabs
- [ ] Numeric unread badge (max "99+"), theme-accent color (not red)
- [ ] Hidden when count = 0 or when parent has 0 children (OQ-B15)
- [ ] Accessibility label

## Phase 3 — NotificationFeedScreen

- [ ] `src/screens/parent/NotificationFeedScreen.tsx` + new route in ParentNav stack
- [ ] `src/components/parent/NotificationRow.tsx` — type icon + child name + body + relative time + unread dot
- [ ] `src/components/parent/NotificationEmptyState.tsx` — calm, no buddy face, "All caught up — quiet for now" / "אין הודעות חדשות — שקט כרגע"
- [ ] `src/lib/notificationTimeBuckets.ts` — date → "Today" / "Yesterday" / "This week" / "Older"
- [ ] Sticky section headers
- [ ] Initial fetch 50 rows; no pagination v1
- [ ] Equal-weight rows (no SOS amplification — OQ-B13)

## Phase 4 — Per-type tap-to-route

- [ ] Reuse `src/lib/notificationRouter.ts` from pkg/fcm-push-notifications (already created)
- [ ] Row tap → `resolveRouteAction({type, entity_id, child_id})` → navigate
- [ ] Per-type destinations verified:
  - parent_sos → ParentDashboard + scroll to child card
  - reward_redeemed → ParentRewards
  - task_completed → ParentTasks (with child filter if supported)
  - quest_milestone → ParentDashboard (fallback)
  - family_joined → ParentDashboard

## Phase 5 — Mark-as-read interactions

- [ ] Tap row → optimistic `is_read=true` locally + async `UPDATE notifications`
- [ ] Optimistic rollback on RLS denial / network failure
- [ ] "Mark all as read" header button → bulk UPDATE
- [ ] Dashboard SOS dot does NOT clear via mark-all (per EX-3 lock from Vibe Check)
- [ ] Realtime: bell badge decrements without manual refresh

## Phase 6 — i18n + copy review

- [ ] HE + EN i18n keys for: bell a11y label, screen title, mark-all-read, section headers (Today/Yesterday/This week/Older), empty state, per-type row titles/bodies
- [ ] Parent voice (declarative + connection-not-rescue per IN-2026-05-17-01)
- [ ] `i18n:check` clean

## Phase 7 — Closeout

- [ ] STATUS row per phase
- [ ] BUFF_FEATURE_AUDIT.md adds row for parent notification feed → ✅ Shipped
- [ ] PRD decision surfaced to Adi (Phase 11 of this package): add §7 entry for unified feed OR mark out-of-PRD
- [ ] INTEGRATION_LEARNINGS for any surprises
- [ ] tsc + jest + i18n all green
- [ ] Push branch to origin
- [ ] APK test (combined with pkg/fcm-push-notifications)
- [ ] PR opened
