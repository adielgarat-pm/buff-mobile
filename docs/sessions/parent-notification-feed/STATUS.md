# pkg/parent-notification-feed — STATUS

> Per-package progress log per CLAUDE.md § Exit Deliverables. Updated by CC at each phase exit.

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| **0: Foundation** | ✅ _passed_ | 2026-05-20 | (this commit) | Branch off pkg/fcm-push-notifications; scaffolding files in place | none |
| **1: Generalized hook + refactor useParentNotifications** | ✅ _passed_ | 2026-05-20 | (this commit) | `src/hooks/useNotificationsFeed.ts` created — fetches all types for family, one realtime channel, mark-as-read + mark-all mutations, optimistic UI with rollback. `useParentNotifications` refactored as a thin selector (Map<child_id, ParentSosNotification> shape preserved). tsc clean; jest 79/79; existing dashboard SOS consumer unchanged. | none |
| **2: Bell + ParentTabs integration** | ✅ _passed_ | 2026-05-20 | (this commit) | `ParentNotificationBell` floating component (since ParentTabs has `headerShown: false`, used absolute positioning instead of `headerRight`). Visible on all 5 parent tabs. Numeric badge max "99+", theme-accent color (not red). Hidden when 0 children. tsc clean. | none |
| **3: NotificationFeedScreen + components** | ✅ _passed_ | 2026-05-20 | (this commit) | `NotificationFeedScreen` + `NotificationRow` + `NotificationEmptyState` + `notificationTimeBuckets`. Sticky section headers (Today/Yesterday/This week/Older). Equal-weight rows (Pillar-2: no SOS amplification). Empty state with no buddy face. Screen registered as modal in RootNavigator. | none |
| **4: Per-type tap-to-route** | ✅ _passed_ | 2026-05-20 | (this commit) | Reused `src/lib/notificationRouter.ts` from pkg/fcm-push-notifications Phase 5. Row tap → markRead + navigate via resolveRouteAction. v1 navigates back to ParentTabs (nested-navigator-aware deep links deferred to v1.1). | none |
| **5: Mark-as-read interactions** | ✅ _passed_ | 2026-05-20 | (this commit) | Tap row → optimistic markRead + DB update; rollback on error. "Mark all as read" header button when hasUnread; bulk UPDATE. Dashboard SOS dot independent (EX-3 lock from Vibe Check: dot driven by parent_sos_sent flag on child_vibes, not is_read). | none |
| **6: i18n + copy** | ✅ _passed_ | 2026-05-20 | (this commit) | 15 new i18n keys × HE+EN for bell a11y + screen title + back + mark-all + 4 time buckets + empty state + 6 per-type row bodies. Parent voice declarative per IN-2026-05-17-01. i18n:check clean (324 keys total parity). | none |
| **7: Closeout** | ✅ _passed_ | 2026-05-20 | (this commit) | STATUS rows complete (above). BUFF_FEATURE_AUDIT.md gets new row. INTEGRATION_LEARNINGS unchanged (no surprises). tsc + jest + i18n all green. Awaiting Adi APK build + device test (combined with pkg/fcm-push-notifications). | none |


## Legend

- `_pending_` — not started
- `_in_progress_` — plan approved, CC mid-phase
- `_passed_` — phase done, tests passed
- `_failed_` — tests failed, rework before continuing
- `_blocked_` — waiting on external (Adi review, etc.)

## Phase 0 deliverables (this commit)

- ✅ Branch `pkg/parent-notification-feed` created off `pkg/fcm-push-notifications` HEAD (so FCM infrastructure is present for combined APK testing)
- ✅ STATUS.md (this file), TESTS.md, SPEC_SYNC.md scaffolded
- ✅ Schema verified — `public.notifications` already in place (Phase 1 of pkg/fcm); RLS verified parent can UPDATE is_read via existing policies
- ❌ No `src/` code touched (per phase contract)
