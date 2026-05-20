# `pkg/fcm-push-notifications` SPEC

**Status:** `draft — awaiting Adi review; ready to spawn a CC session once approved`
**Slug:** `pkg/fcm-push-notifications`
**Branch:** `pkg/fcm-push-notifications` (off `main`)
**Sibling package:** `pkg/parent-notification-feed` (independent; either can ship first)
**Target release:** `beta-2026-06-01`
**Source spec:** `BUFF_PRD.md §9.2` (FCM line) · `BUFF_FEATURE_AUDIT.md S-01` · `BUFF_FEATURE_PRIORITIZATION.md F-039, F-063` · `INTEGRATION_LEARNINGS.md` IN-2026-05-17-01 (parent declarative copy), IN-2026-05-17-03 (3-package sequencing), **IN-2026-05-19-01** (FCM HTTP v1 as single cross-platform backend — locked), **IN-2026-05-19-02** (generic + activity-based gating — locked), **IN-2026-05-19-03** (kid push = presence + autonomy-marker only — locked)
**Drafted:** 2026-05-19 by CC on `pkg/notification-spec` planning branch
**Plan file:** `C:\Users\adiel\.claude\plans\refactored-mixing-lamport.md`

---

## Why this exists

Today a row in `public.notifications` is visible to the parent only when the app is in the foreground. The Lovable web POC's #1 churn root cause was parents/kids forgetting to return to the app — without push, the app loses its loop. FCM is `Must Have | MVP` per F-039 + F-063; AUDIT S-01 says "Keep + Expand" with the note "PWA push unreliable → native FCM required".

**This package is part of the unified-codebase migration.** End state is **one codebase** (`buff-mobile`) running across Android (now), Expo Web (Phase 2, F-073 — replaces `buffadhd.com` / Lovable web), and iOS (later). The cross-platform notification mechanism specified here — **FCM HTTP v1 as a single server-side delivery pipeline** with platform-specific client registration — is precisely what makes Lovable retirement possible without losing the push loop on web.

The trigger pattern from `migrations/011_parent_sos_notification_trigger.sql` already produces the source-of-truth rows. This package builds **the outside-the-app delivery pipeline** on top of those rows — without changing the table, without touching the trigger pattern, and without writing anything new to the schema.

Pillar-2 risk is the highest in this package: push notifications are the canonical alarm-design surface. Every copy string and every type-enablement decision in this SPEC is justified against the Pillar-2 questions explicitly.

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| `public.notifications` table | ✅ exists in live DB (per `migrations/011`); ❌ no repo migration | Phase 1 backfills an idempotent `CREATE TABLE IF NOT EXISTS` migration |
| `migrations/011_parent_sos_notification_trigger.sql` | ✅ shipped 2026-05-17 (pkg/daily-vibe-check Phase 4a) | Source of `parent_sos` rows. Do not modify. |
| `profiles.fcm_token` column | ✅ exists, unused | Migrated and dropped in Phase 1 (replaced by `device_tokens` table) |
| `useParentNotifications` hook | ✅ shipped (pkg/daily-vibe-check Phase 4b) | Out of scope here; bell + feed package owns the in-app surface |
| Firebase project + FCM HTTP v1 service account JSON | ❓ verify with Adi at Phase 0 | Required for Edge Function dispatch. If not yet created, Phase 0 spawns it (or surfaces to Adi). |
| Apple Developer account | ❌ not active | iOS = Phase 7 design-only; no code/cert work |
| EAS Build / EAS Submit | ❓ Adi pending DevEx session | Not blocking — `expo-notifications` works in Expo Go for dev; only production push requires EAS Build with proper credentials |

---

## Goal

Deliver a row in `public.notifications` (or a scheduler-triggered event) as a system-level push notification to the relevant recipient — parent OR kid — across Android (now), Expo Web (Phase 2-ready), and iOS (deferred — design-only). Voice per recipient: parent = declarative/connection-not-rescue (IN-2026-05-17-01); kid = presence + autonomy-marker only (IN-2026-05-19-03).

After this merges — see § Event × Channel Matrix below for the full event list. Headlines:
- Parent push: SOS (E1), reward redemption (E2), parent-disengagement reminder (E6), family member joined (E13)
- Kid server push: BUDDY presence after 5 days of no-open (E5), reward-approved-by-parent (E9) — gated on kid permission
- Kid local notifications (in-app, not server push): per-phase task reminders (E7), BUDDY V0 nudges (E11)
- Activity-based suppression: skip push if recipient's `last_seen_at` < 5 min (IN-2026-05-19-02)
- Foreground app: tray push suppressed; in-app toast shown
- Web build (Phase 2): same flow with `firebase/messaging` + Service Worker → same `device_tokens` table

---

## Values Check

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1 — would the kid want this without virtual reward? | ✅ All v1 kid-side push (E5, E7, E9, E11) is **presence + autonomy-marker only**, never mentions rewards/tasks/BUFFs/count/progress (IN-2026-05-19-03). Even with no reward system, a kid would value a friend (BUDDY) saying hi — intrinsically pleasant, not transactional. |
| Intrinsic Motivation | 2 — closer to kid's chosen real reward? | ✅ Parent-side: `reward_redeemed` push tells the parent the kid **earned the real reward they chose** (PRD §6.3). Reinforces the intrinsic loop. Kid-side E9 ("parent approved something you asked for"): does NOT name the reward — kid knows what they asked for; the push doesn't pull ownership of the reward to the app. |
| Intrinsic Motivation | 3 — "I want to" vs "I have to"? | ✅ Every kid copy operates in **body-doubling voice** (IN-2026-05-19-03; BUFF_BUDDY_SYSTEM.md line 25): present, non-judgmental, non-prompting. "{buddy_name}: פה, מוכן/ה כשתרצה" reduces task-initiation activation barrier without taking ownership of the motivation. The kid's "I want to" remains intact. |
| Positive Coaching | 1 — no shame / failure framing? | ✅ All v1 push types are positive or neutral. No `task_missed`, no `streak_broken`, no `task_late`. Two checklists enforced before PR: declarative (IN-2026-05-17-01) for parent copy + presence+autonomy (IN-2026-05-19-03) for kid copy. |
| Positive Coaching | 2 — empathy if child fails? | ✅ Failure events do not push in v1. `parent_sos` is a connection signal, not a failure signal. E5 (kid disengagement) is non-judgmental — "{buddy_name}: כאן כשתרצה" — not "we miss you" or "we noticed you're absent". |
| Positive Coaching | 3 — no suffering mechanic? | ✅ No sad-buddy push. "{buddy_name} חיכה לך" is explicit anti-pattern. BUDDY emotional state is fully decoupled from push. |
| Independence-Building | 1 — more capable without app? | ✅ Push opens connection moments (parent ↔ kid, or BUDDY ↔ kid as friend). E5/E7 cadences are conservative and back off silently — the app never escalates when ignored. |
| Independence-Building | 2 — kid has voice? | ✅ Kid initiates `parent_sos` and `reward_redeemed`. Kid never sees parent's `is_read` state, never sees if parent received the push, no "ההורה ראה" indicator. Kid push (E5, E9) goes TO kid — kid doesn't surveil parent's response loop. |
| Independence-Building | 3 — in 6 months still needed? | 🟡 Push is permanent infrastructure; frequency should drop as families graduate. Per-type opt-out (v1.1) lets a family reduce push as they progress. E5/E7 silent cooldowns already enforce "if you don't want it, we stop". |

**Values Check: ✅ all 9 pass** (1 yellow on a long-tail UX concern, not blocking).

---

## Goals

1. **Server-side dispatch** — Edge Function `push-notification-fanout` triggered by Database Webhook on `notifications` INSERT; reads recipient's tokens from a new `device_tokens` table; calls FCM HTTP v1; logs success/failure per token.
2. **Client registration (Android)** — `expo-notifications` install + plugin + `usePushRegistration` hook that requests permission via a pre-prompt screen, then stores the resulting FCM token in `device_tokens` with `token_type='fcm-android'`.
3. **Client registration (Web)** — `firebase/messaging` web SDK + `web/firebase-messaging-sw.js` Service Worker; same `device_tokens` table, `token_type='fcm-web'`. Wired behind `Platform.OS === 'web'` so it's a no-op on native.
4. **Client registration (iOS) — design-only** — SPEC appendix captures the APNs flow + `expo-notifications` iOS plugin config + cert/profile requirements. No code.
5. **Per-recipient copy library** — TypeScript module in the Edge Function with `{type, recipient_role, lang} → {title, body}`. HE primary, EN fallback. **Parent-side** copy: declarative + connection-not-rescue + observational per IN-2026-05-17-01. **Kid-side** copy: presence + autonomy-marker only — NEVER mention rewards/tasks/BUFFs/count/progress per IN-2026-05-19-03.
6. **Foreground handling** — `setNotificationHandler` suppresses tray push when the app is in foreground; an in-app toast surfaces the same content; tap behavior identical.
7. **Tap-to-route** — `Notifications.addNotificationResponseReceivedListener` reads `data.type + data.entity_id + data.child_id` and routes to the correct screen.
8. **Permission UX (Android 13+)** — pre-prompt screen before the system `POST_NOTIFICATIONS` request, framed around value ("Get a heads-up when {child} shares") not around the app's need.
9. **Hebrew + English i18n** for all push copy. Brand voice per `BUFF_BRAND.md §6` (Coach for parent; friend voice for BUDDY-to-kid). Two checklists enforced before PR: IN-2026-05-17-01 (parent) + IN-2026-05-19-03 (kid). No failure framing anywhere; no quantification on kid-side.
10. **Token lifecycle** — re-register on app foreground + on version bump. Prune tokens with `last_seen_at` older than 90 days (deferred cleanup job — v1.1).
11. **Spec sync** — close F-039, F-063, S-01 in their canonical docs; PRD §9.2 line on FCM marked shipped.

---

## Non-goals

- ❌ **`task_completed` push (E3).** High-volume; Pillar-2 alarm-design risk. Insert row → visible in bell+feed only. Revisit v1.1 with daily batching.
- ❌ **`quest_milestone` push (E4).** **Verified 2026-05-19:** no live emitter in code — `notification.milestone.*` i18n keys exist (Lovable legacy) but 0 consumers; `useParentNotifications.ts:11` only mentions in a comment. Treat as stale. Feed renders if rows appear; never push.
- ❌ **Push on parent-initiated actions to parent themselves (E8, E10).** Redundant — parent did the action and saw the result inline.
- ❌ **Vibe Check completion push (E14).** Observation, not event.
- ❌ **`has_own_device` derivation.** Replaced by activity-based suppression (IN-2026-05-19-02).
- ❌ **Per-type opt-out UI for parent.** v1.1.
- ❌ **In-app quiet-hours UI / scheduler.** v1 respects Android system DND only.
- ❌ **Custom notification channels / sounds / actions.** v1.1.
- ❌ **iOS native build / signing / TestFlight.** Captured as design in Phase 7; no code; revisit when Apple dev account is active.
- ❌ **Rich payload (image, big-text, inline-reply).** Minimal payload only.
- ❌ **`profiles.fcm_token` retention.** Migrated and dropped.
- ❌ **Backporting the ~396 historical notification rows into pushes.** These predate active mobile development (buff-mobile's own Lovable-era snapshot, not migrated data). Database Webhook fires only on new INSERTs going forward; historical rows render in the in-app feed (sister package) but never push.
- ❌ **Migrating data from the live Lovable Supabase project.** No data migration exists or is planned — the 2 active Lovable users self-migrate by re-onboarding in the mobile app (per `project_lovable` memory, 2026-05-19). This SPEC assumes net-new users in the unified codebase.
- ❌ **Touching Lovable infra.** Separate Supabase project; no MCP access; sunset when Expo Web ships.

---

## Event × Channel Matrix

Locked 2026-05-19 (Adi planning session). Canonical list of which events propagate to which output channel in v1. Adding/removing events requires explicit Adi sign-off.

| # | Event | Trigger source | Push → parent device | Parent bell¹ | Push → kid device² | Local notification³ |
|---|---|---|---|---|---|---|
| E1 | Kid presses SOS in Low Power | child_vibes trigger `011` | ✅ (suppressed if parent active <5 min) | ✅ existing | ❌ N/A | — |
| E2 | Kid redeems reward | reward redemption insert | ✅ (suppressed if parent active) | ✅ | ❌ N/A | — |
| E3 | Kid completes a task | task completion insert | ❌ **locked off** | ✅ silent (feed only) | ❌ | — |
| ~~E4~~ | ~~quest_milestone~~ | stale — no live emitter (verified) | ❌ | 🟡 render if appears | ❌ | — |
| E5 | Kid not opened 5+ days | scheduled function (pg_cron / scheduled Edge Function) | ❌ | ❌ | ✅ BUDDY presence copy, max 2 per absence | — |
| E6 | Parent not opened 5+ days | scheduled function | ✅ connection-not-rescue copy, max 1/week | ❌ | ❌ N/A | — |
| E7 | **POST first-task-missed body-double nudge** | in-app scheduler (POST trigger — fires 60 min after first phase task's scheduled time, only if task still incomplete AND kid hasn't opened app in phase) | ❌ | ❌ | ❌ | ✅ morning/afternoon/evening (school skipped); max 1/phase/day; 3-day silent cooldown; **body-doubling voice** |
| E8 | Parent assigns task | parent action | ❌ (parent did it) | ❌ | ❌ — kid sees in UI | — |
| E9 | Parent approves reward redemption | parent action | ❌ (parent did it) | ❌ | ✅ positive, low frequency | — |
| E10 | Parent toggles Pause Mode | parent action | ❌ | ❌ | ❌ — kid sees in UI | — |
| E11 | BUDDY V0 general nudge | time-based, in-app | ❌ | ❌ | ❌ | ✅ very limited (Pillar 2) |
| E12 | Subscription / payment update | RevenueCat webhook | 🟡 v1.1 separate transactional channel | ❌ | ❌ N/A | — |
| E13 | Family member joined | invite flow | ✅ | ✅ | ❌ N/A | — |
| E14 | Vibe Check completed | child_vibes insert | ❌ (observation, not event) | ❌ | ❌ | — |

¹ Owned by sister package `pkg/parent-notification-feed`. This SPEC ensures rows land in `public.notifications` correctly; rendering is the sibling's responsibility.
² Only fires if kid has registered an FCM token (i.e., used the app on a device with permission granted).
³ Local = client-side `expo-notifications` scheduling. No FCM, no server. Works on any device the kid uses the app on.

### Channels at a glance

| Channel | Events | Implementation |
|---|---|---|
| **Server push → parent** (FCM) | E1, E2, E6, E13 | Edge Function reads row / scheduler event, formats per-type copy, sends FCM HTTP v1 |
| **Parent bell** (in-app feed) | E1, E2, E3, E4 (legacy render), E13 | Sibling package — this SPEC only ensures rows land |
| **Server push → kid** (FCM) | E5, E9 | Same Edge Function; routes by recipient profile_id (resolves to kid's tokens) |
| **Local notification → kid** | E7, E11 | Client-side scheduling; no FCM, no server |

### Voice rules (locked)

**Parent push** — declarative + connection-not-rescue (IN-2026-05-17-01):
- ✅ "{kid} רצה/רצתה לשתף — יום של אנרגיה נמוכה" (HE) / "{kid} wanted to share — low energy today" (EN)
- ❌ "{kid} needs you now" (rescuer mode)
- ❌ "{kid} is late on 3 tasks" (alarm framing)

**Kid push (server + local)** — **body-doubling voice** per IN-2026-05-19-03 (BUDDY = virtual body double per `BUFF_BUDDY_SYSTEM.md` line 25). Presence + autonomy-marker only; **NEVER** mention rewards/tasks/BUFFs/count/progress. Every copy must pass the **"body double test"**: *would a body double say this?* — see IN-2026-05-19-03 for the full checklist.

Canonical templates:
- ✅ "{buddy_name}: פה, מוכן/ה כשתרצה" / "{buddy_name}: here, ready when you are" — **E5 default + E7 morning**
- ✅ "{buddy_name}: לידך, בקצב שלך" / "{buddy_name}: with you, at your pace" — **E7 afternoon**
- ✅ "{buddy_name} עומד/ת לידך 🌙" / "{buddy_name} standing by 🌙" — **E7 evening**
- ✅ "{buddy_name} לידך. בלי לחץ." / "{buddy_name} with you. no pressure." — **E5 rotation**

Anti-patterns (auto-fail at PR review):
- ❌ "{reward} עוד מחכה לך" — extrinsic, converts intrinsic motivation
- ❌ "{buddy_name} מוכן/ה ל-2 דברים" — quantification
- ❌ "{buddy_name} חיכה לך" — subtle pressure / sad-buddy adjacency
- ❌ "יש לך משימה" / "you have a task" — directly mentions tasks
- ❌ "בוא תיכנס" / "come back" — prompts action, not presence

### Gating (locked — IN-2026-05-19-02)

**Generic delivery + 2-stage activity-based suppression**. NOT `has_own_device`-gated.

1. **Always insert row** to `public.notifications` (regardless of platform/device state)
2. **Edge Function before FCM call:** check recipient's `device_tokens.last_seen_at` — if < 5 min, skip push (in-app surface is showing)
3. **Client-side:** `setNotificationHandler` suppresses tray push when app foreground; in-app toast instead

### Cadence (locked)

| Event | Trigger condition | Cadence | Stop condition |
|---|---|---|---|
| E5 (kid disengagement) | `last_seen_at` of kid ≥ 5 days | 1st push at 5d → 2nd at 14d (only if 1st not opened) | After 2nd, silent. Counter resets on next open. |
| E6 (parent disengagement) | `last_seen_at` of parent ≥ 5 days | Max 1 per week | Silent if 3 consecutive pushes ignored |
| E7 (kid phase reminder — POST) | (a) Phase has ≥1 task; (b) First task's `scheduled_time + 60 min` has passed; (c) Task still `completed_at IS NULL`; (d) Kid's `last_seen_at` is before phase start (didn't open in current phase). All four AND'd. | Fires once when conditions met; max 1 per phase per day; school phase always skipped | 3-day silent cooldown for that phase if kid hasn't opened in response 3 days running |
| E11 (BUDDY local) | Defined by BUDDY V0 internal logic | Very limited per Pillar 2 | — |

---

## Behavior Contract

**Scenario A: Kid presses SOS in Low Power Mode**
1. `child_vibes.parent_sos_sent` flips false→true
2. Trigger `011` inserts row in `notifications` (`type='parent_sos'`, `parent_id`, `child_id`, `entity_id=child_vibes.id`)
3. Database Webhook fires → Edge Function receives INSERT payload
4. Edge Function reads parent's `device_tokens` (all rows for `profile_id=parent_id`)
5. For each token: pick payload format by `token_type`, call FCM HTTP v1, log result
6. Parent's device(s) receive push: `"{kid} wanted to share — low energy today"` (HE/EN per profile.lang)
7. Parent taps push → app opens, routes to dashboard, scrolls to that child card

**Scenario B: Kid redeems reward**
1. (Existing Lovable-era flow inserts `notifications` row `type='reward_redeemed'`)
2-5. Same as Scenario A
6. Push copy: `"{kid} בחר/ה את הפרס: {reward}"` (HE) / `"{kid} chose the reward: {reward}"` (EN)
7. Tap → ParentRewards tab

**Scenario C: App is in foreground when push fires**
1. FCM still delivers
2. `setNotificationHandler` suppresses tray notification
3. In-app toast (top of screen, theme-aware) surfaces `title + body`
4. Tap → same route as background tap; toast dismisses

**Scenario D: Parent has 2 devices (phone + tablet)**
1. Phase 2 registration on each device → 2 rows in `device_tokens` (same `profile_id`, different `token`)
2. Edge Function fans out to both; both devices ring

**Scenario E: Permission denied on first ask**
1. `usePushRegistration` records denial state
2. Token not registered; app continues functioning
3. On next app foreground after a permission-relevant action (e.g., child profile creation), pre-prompt re-shown with copy "Get a heads-up when {child} shares — turn on in Settings"
4. Parent taps "Open Settings" → deep-link to app notification settings
5. After parent re-enables, next foreground → token registered

**Scenario F: Token rotates (rare; FCM does it on its own)**
1. Old token still in `device_tokens`
2. On next foreground, fresh token requested from FCM SDK
3. `usePushRegistration` upserts (same `profile_id`, different `token`); old row's `last_seen_at` stale
4. Edge Function still tries old token → FCM responds 404 (`UNREGISTERED`) → Edge Function deletes the dead row
5. Next push goes only to fresh token

**Scenario G: Web user (Phase 2)**
1. `Platform.OS === 'web'` → conditional `firebase/messaging` initialization
2. Service Worker registered at `/firebase-messaging-sw.js`
3. Permission requested via web API
4. Token registered in `device_tokens` with `token_type='fcm-web'`
5. Edge Function picks the FCM web payload variant for this token; push lands as a browser/PWA notification

**Scenario H: iOS (Phase 10, design-only)**
- Documented in SPEC appendix. No runtime path until Apple dev account active.

**Scenario I: Kid disengagement push (E5)**
1. pg_cron fires daily at 09:00; `scan_disengaged_users()` SQL function runs
2. For each kid profile with `last_seen_at ≥ 5 days` AND no E5 push in last 14 days → insert `notifications` row with `type='kid_engagement'`, `child_id=<kid>`, `parent_id=NULL` (kid-recipient)
3. Database Webhook fires → Edge Function
4. Recipient resolution: row has `child_id` and no `parent_id` → recipient = kid → read kid's `device_tokens`
5. Suppression check: skip if kid's `last_seen_at < 5 min` (rare for a disengaged kid but defensive)
6. Push fires with copy `"{buddy_name}: כאן כשתרצה."` (HE) / `"{buddy_name}: here when you want."` (EN) — Pillar-1 lens (no reward/task mentions)
7. If kid opens the app → counter resets (no 14d second push)
8. If kid does NOT open within 14 days → second push fires; after that, silent until next app open

**Scenario J: Parent disengagement push (E6)**
1. Same pg_cron job; finds parent profiles with `last_seen_at ≥ 5 days` AND no E6 push in last 7 days
2. Insert row with `type='parent_engagement'`, `parent_id=<parent>`, optional `child_id` if a specific child has activity since last parent visit
3. Recipient = parent; Edge Function dispatches
4. Push fires with declarative connection copy (Phase 4 locks exact text against IN-2026-05-17-01)
5. Max 1 per 7-day window; if 3 consecutive pushes ignored → silent until parent opens

**Scenario K: Parent approves reward redemption (E9 → kid push)**
1. Parent taps "approve" in ParentRewards on a kid's pending redemption
2. Parent action creates a `reward_redeemed` row scoped to PARENT in the existing flow (this is E2 → push to parent — but the parent did it themselves, so suppressed by activity, parent gets no push)
3. **Additional row inserted** with `type='reward_approved'`, `child_id=<kid>`, `parent_id=NULL` → kid is recipient
4. Edge Function dispatches to kid's `device_tokens`
5. Push copy: `"{buddy_name}: ההורה אישר/ה משהו שביקשת 🎉"` (HE) / `"{buddy_name}: parent said yes to something you asked for 🎉"` (EN) — does NOT name the reward (Pillar-1)
6. Kid taps → opens app, navigates to rewards screen, sees the approved reward

**Scenario L: POST first-task-missed body-double nudge (E7)**
1. Kid app open → `useKidLocalNotifications` reads today's tasks + `src/types/phase.ts`
2. For each phase (morning/afternoon/evening — school skipped): find the first task in the phase (ordered by `scheduled_time`)
3. Schedule a local notification at `first_task.scheduled_time + 60 min` via `expo-notifications.scheduleNotificationAsync`
4. Each scheduled notification has a check-callback registered (or is paired with a foreground cancellation on app-open)
5. At fire time, the local notification's pre-fire check evaluates:
   - `first_task.completed_at IS NULL`? (still incomplete)
   - `kid.last_seen_at < phase.start_time`? (kid hasn't opened in this phase)
   - 3-day cooldown not active for this phase?
   - If ALL true → notification fires with **body-doubling copy**: `"{buddy_name}: פה, מוכן/ה כשתרצה"` (HE morning) / `"{buddy_name}: לידך, בקצב שלך"` (HE afternoon) / `"{buddy_name} עומד/ת לידך 🌙"` (HE evening)
   - If ANY false → notification silently cancelled (kid is engaged → no need; kid is on cooldown → respect)
6. If kid opens app during phase BEFORE notification fires → notification cancelled
7. If kid does NOT open for 3 days running in response to E7 → that phase's notifications silently skipped for 3 days; auto-resumes after
8. **No notification ever mentions the task itself** (Pillar-1 / body-doubling test) — the body-double presence is the nudge, the kid's autonomy decides what to do with it

---

## Schema Changes

**New table — `device_tokens`** (Phase 1 migration `012_device_tokens.sql`):

| Column | Type | Default / Check | Notes |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | |
| `profile_id` | `uuid` | fk → `profiles.id`, ON DELETE CASCADE | recipient |
| `token` | `text` | UNIQUE, not null | FCM/APNs/Web token |
| `token_type` | `text` | `CHECK IN ('fcm-android', 'fcm-ios', 'fcm-web')`, not null | drives payload format in Edge Function |
| `last_seen_at` | `timestamptz` | default `now()` | updated on every foreground re-register |
| `created_at` | `timestamptz` | default `now()` | |

**Indexes:**
- `(profile_id, token_type)` for the fan-out query
- `token` already UNIQUE for upsert-on-conflict

**RLS:**
- `SELECT`: owner only (`profile_id = auth.uid()`)
- `INSERT/UPDATE`: owner only
- Edge Function uses service-role key, bypasses RLS for the fan-out read

**Drop column** — `profiles.fcm_token` (same migration):
1. `INSERT INTO device_tokens (profile_id, token, token_type) SELECT id, fcm_token, 'fcm-android' FROM profiles WHERE fcm_token IS NOT NULL` (backfill, even though audit says it's unused — defensive)
2. `ALTER TABLE profiles DROP COLUMN fcm_token`

**New column — `profiles.last_seen_at`** (Phase 1, same migration):

| Column | Type | Default | Notes |
|---|---|---|---|
| `last_seen_at` | `timestamptz` | `now()` | Updated by client on every app foreground for both parent + kid profiles. Source-of-truth for engagement-suppression check (E5/E6 scheduler) and the activity-suppression check in Edge Function. |

Reason for using `profiles.last_seen_at` (not `device_tokens.last_seen_at` alone): kids may not have an FCM token (permission denied) but still use the app; we still need to know they're active. Parents may have multiple devices; we want the latest seen across all.

**New table — `notification_pushes`** (Phase 1, same migration; idempotency guard per OQ-A18):

| Column | Type | Default | Notes |
|---|---|---|---|
| `notification_id` | `uuid` PK | — | FK → `notifications.id`, ON DELETE CASCADE |
| `pushed_at` | `timestamptz` | `now()` | When Edge Function successfully dispatched |
| `recipient_token_count` | `int` | — | How many tokens fanned out to (audit) |
| `suppressed_reason` | `text` | NULL | NULL = pushed; otherwise: `recent_activity` / `no_tokens` / `permission_denied` / etc. |

Edge Function checks `notification_pushes.notification_id` before dispatch — if exists → no-op (idempotent on webhook retry).

RLS: no public access; Edge Function uses service-role key.

**Backfill — `public.notifications`** (same migration, defensive):
- The live DB has the table but no repo migration. Phase 1 emits an idempotent `CREATE TABLE IF NOT EXISTS notifications (...)` matching the verified schema, so a fresh `supabase db reset` reproduces production.
- No data migration; existing rows stay.

**No changes to:**
- `notifications` table columns (locked — Lovable parity; "no new column writes" constraint per IN-2026-05-17-03 architecture)
- `child_vibes` (untouched by this package)
- The `parent_sos` trigger 011 (untouched)
- `families` (untouched)

---

## Files Likely Touched

- `migrations/012_device_tokens.sql` — **new** (Phase 1; includes `device_tokens` + `notification_pushes` idempotency table + `notifications` idempotent capture + drop `profiles.fcm_token`)
- `migrations/013_engagement_scheduler.sql` — **new** (Phase 7; pg_cron + `scan_disengaged_users()` SQL function)
- `package.json` — **edit** (Phase 2: `expo-notifications`; Phase 9: `firebase` web SDK — separate npm approval)
- `app.json` — **edit** (Phase 2: `expo-notifications` plugin; Phase 9: web config)
- `src/hooks/usePushRegistration.ts` — **new** (Phase 2 parent; extended Phase 6 for kid)
- `src/hooks/useKidLocalNotifications.ts` — **new** (Phase 8; per-phase scheduling)
- `src/screens/onboarding/UStepPushPermissionPrePrompt.tsx` — **new** (Phase 2; parent path)
- `src/screens/onboarding/ChildJoinPushPrePrompt.tsx` — **new** (Phase 6; kid path, friend-voice copy)
- `src/lib/notificationRouter.ts` — **new** (Phase 5; shared with `pkg/parent-notification-feed`)
- `supabase/functions/push-notification-fanout/index.ts` — **new** (Phase 3)
- `supabase/functions/push-notification-fanout/copy.ts` — **new** (Phase 4; parent + kid voice tables)
- `supabase/functions/push-notification-fanout/fcm.ts` — **new** (Phase 3; FCM HTTP v1 OAuth2 + send)
- `supabase/functions/push-notification-fanout/suppression.ts` — **new** (Phase 3; activity-based suppression logic)
- `src/i18n/he.json`, `src/i18n/en.json` — **edit** (Phase 4: per-recipient copy; Phase 8: local-notification copy)
- `web/firebase-messaging-sw.js` — **new** (Phase 9)
- `src/lib/webPushRegistration.ts` — **new** (Phase 9)
- `src/App.tsx` or root provider — **edit** (Phase 2: wire `usePushRegistration` + `useKidLocalNotifications` to foreground lifecycle)

---

## CC defaults applied (Adi may override at any phase plan review)

These are pre-committed CC decisions. If Adi disagrees with any default during a phase plan review, the SPEC row gets updated in the same commit that implements the alternative — no silent drift.

| ID | Question | CC default | Rationale (confidence) |
|---|---|---|---|
| **OQ-A0** ⭐ | Push gating principle (foundational — read first) | **Generic delivery + 2-stage activity-based suppression** (Edge Function: skip if recipient `last_seen_at < 5 min`; client: foreground suppression via `setNotificationHandler`). NOT `has_own_device`-gated. | HIGH. Locked 2026-05-19 (IN-2026-05-19-02). Adi reframed the original device-aware gate as brittle/opaque. Activity-based achieves the same UX without flag derivation. **This shapes every other OQ.** |
| **OQ-A1** | FCM client library on mobile (Android + iOS) | **`expo-notifications`** | HIGH. Expo managed workflow; one config plugin; supports Android (FCM) and iOS (APNs via FCM) with the same code. `@react-native-firebase/messaging` would require ejecting/prebuild + a major native dep for no MVP-justified payload features. |
| **OQ-A2** | Web push client | **`firebase/messaging` web SDK + Service Worker at `web/firebase-messaging-sw.js`** | HIGH. `expo-notifications` does not issue FCM web tokens; the only path to FCM-on-web is the Firebase JS SDK. Backend unchanged (FCM HTTP v1 routes by token type). |
| **OQ-A3** | Push delivery backend (DB row → FCM) | **Supabase Edge Function** triggered by **Database Webhook** on `notifications` INSERT | HIGH. Per-type copy/routing/quiet-hours logic belongs in TypeScript, not PL/pgSQL. Observable logs, retry/backoff in code, easy to iterate. `pg_net` trigger would force every copy change to be a migration. |
| **OQ-A4** | Permission timing (Android 13+ `POST_NOTIFICATIONS`) | **Parent:** just-in-time + pre-prompt after onboarding completion. **Kid (own-device, after ChildJoin):** pre-prompt `"{buddy_name} רוצה להזכיר לך דברים — מותר?"`. If denied → local notifications only (E7, E11 still work) | MEDIUM-HIGH. Cold prompts denied ~40-60%; just-in-time with value framing ~75% acceptance. Kid prompt uses friend-voice. |
| **OQ-A5** | Token storage | **New `device_tokens` table** as specified in § Schema Changes | HIGH. `profiles.fcm_token` is one-token-per-user; one parent has phone + tablet + web. Type tag drives Edge Function payload selection. `last_seen_at` enables stale-token pruning. |
| **OQ-A6** | Token refresh policy | **Re-register on every app foreground + on app version bump** | HIGH. FCM tokens rotate (rare but real). Foreground re-registration is cheap and idempotent. Version bump catches cached-token edge cases. |
| **OQ-A7** | Kid-side push scope in v1 | **Server push:** E5 (kid disengagement, BUDDY presence copy) + E9 (parent approved reward, positive). Gated on kid permission. **Local notifications:** E7 (per-phase, BUDDY friend-voice) + E11 (BUDDY V0). Per IN-2026-05-19-03, kid copy is presence + autonomy-marker only — never reward/task/count/progress mentions. | MEDIUM-HIGH. Replaces the original "no kid push" position after Adi locked the cross-platform unified pipeline + the Pillar-1 kid-copy convention. Local notifications **are** in this package (not deferred to a follow-up). |
| **OQ-A8** | Which events propagate to which channels | **See § Event × Channel Matrix above.** Headline: parent push for E1, E2, E6, E13; kid push for E5, E9; local for E7, E11; locked off for E3, E8, E10, E14; stale for E4; v1.1 for E12. | HIGH. Matrix is the canonical answer; matrix-row decisions are individually justified there. |
| **OQ-A9** | Copy convention enforcement | **All copy keys reviewed against IN-2026-05-17-01 checklist before PR**: declarative voice / observational / no rescuer verbs / preserves privacy / kid agency framed | HIGH. Pillar 2 / Pillar 3 risk surface. Reference: existing parent_sos HE copy `"{name} רצה/רצתה לשתף — יום של אנרגיה נמוכה"` (Adi-approved 2026-05-17). |
| **OQ-A10** | Quiet hours | **Respect Android system DND only (default FCM behavior)**; no in-app quiet-hours setting in v1 | MEDIUM. Per-user quiet hours is a settings expansion + scheduler logic. v1 trusts OS DND. Revisit v1.1 only if real-user complaints. |
| **OQ-A11** | Foreground behavior | **Suppress tray push when app is open**; show theme-aware in-app toast instead via `setNotificationHandler` | HIGH. Standard pattern; prevents double-surfacing the same event. Tap on toast = same route as tap on tray push. |
| **OQ-A12** | Notification payload shape | **Minimal**: `{ notification: { title, body }, data: { type, entity_id, child_id, family_id } }`. No images, no actions in v1 | HIGH. Tap handler reads `data.type + data.entity_id` and routes via shared `notificationRouter`. Smaller payload = better reliability + smaller cost. |
| **OQ-A13** | What happens to `profiles.fcm_token` | **Migrate-and-drop**: copy non-null values into `device_tokens` as `token_type='fcm-android'`, then `ALTER TABLE DROP COLUMN` in same migration | MEDIUM-HIGH. Column is unused today (audit). Defensive backfill = net-zero data loss even if a stray code path was writing it. Cleaner schema going forward. |
| **OQ-A14** | `public.notifications` repo migration (Adi flag from plan) | **Phase 1 emits an idempotent `CREATE TABLE IF NOT EXISTS notifications (...)`** matching the live schema, so a fresh `supabase db reset` reproduces production | MEDIUM-HIGH. Currently the table exists only in live DB — environment reproduction risk. Defensive idempotent migration captures it. |
| **OQ-A15** | Edge Function language / runtime | **Deno + TypeScript** (Supabase default) | HIGH. Native to Supabase Edge Functions. No alt considered. |
| **OQ-A16** | FCM auth approach | **OAuth2 service account JWT** via Deno's standard JWT lib, cached for the function lifetime | HIGH. FCM HTTP v1 mandates OAuth2 (legacy server-key endpoint is deprecated). Service account JSON stored as `FCM_SERVICE_ACCOUNT_JSON` env secret. |
| **OQ-A17** | Trigger mechanism: Database Webhook vs Realtime client subscription in the Edge Function | **Database Webhook** | MEDIUM-HIGH. Webhooks are server-to-server, no long-lived connection, simpler retry semantics. Realtime would require the Edge Function to hold a subscription — anti-pattern for stateless functions. |
| **OQ-A18** | Idempotency guard | **Edge Function checks `processed_at` column on `notifications`** OR a separate `notification_pushes` audit log; if a row was already pushed, no-op | MEDIUM. Webhooks can re-fire on retry. Either add `processed_at` (touches table schema — Pillar of "no new column writes") OR a separate `notification_pushes(notification_id PK, pushed_at)` table. **Pick the second** to honor the "no new column writes" constraint. Adi to confirm at Phase 0. |
| **OQ-A19** | Language selection per push | **Read `profiles.preferred_language` (already exists) of the recipient**; default 'he' | HIGH. Lovable parity. |
| **OQ-A20** | If parent has 0 devices registered | **Edge Function logs "no devices" and exits 200**. Row stays in `notifications` for the in-app feed (sister package) to pick up | HIGH. Push is best-effort; in-app surface is the resilient floor. |
| **OQ-A21** | E5 / E6 scheduler — `pg_cron` vs scheduled Edge Function | **`pg_cron` once daily at 09:00 local-default** (BUFF target market is IL — single TZ for v1) calling a SQL function that scans for inactive users + inserts notification rows; Edge Function picks up via Database Webhook as normal | MEDIUM. `pg_cron` is the simplest reliable scheduler in Supabase. Scheduled Edge Function would also work but adds a second scheduling primitive. Re-evaluate when international users land. |
| **OQ-A22** | E5 cadence + copy | **Cadence:** 5 days → 14 days → silent. Counter resets on app open. Cap 2 per absence period. **Copy (body-doubling):** Default `"{buddy_name}: פה, מוכן/ה כשתרצה"` / `"{buddy_name}: here, ready when you are"`. Rotation: `"{buddy_name} לידך. בלי לחץ."` / `"{buddy_name} with you. no pressure."` | HIGH (cadence locked 2026-05-19); HIGH (copy locked via body-doubling lens — IN-2026-05-19-03 amended). Adi: "אנחנו רוצים להיות לא שיפוטיים". |
| **OQ-A23** | E7 — trigger + phases + copy | **Trigger (POST):** fires `first_task.scheduled_time + 60min` IF task still incomplete AND kid hasn't opened in phase. **Phases:** morning + afternoon + evening; **school skipped**. Max 1/phase/day; 3-day silent cooldown if no opens. **Copy (body-doubling):** morning `"{buddy_name}: פה, מוכן/ה כשתרצה"` · afternoon `"{buddy_name}: לידך, בקצב שלך"` · evening `"{buddy_name} עומד/ת לידך 🌙"`. **Copy NEVER mentions the task** (Pillar-1 / body double test). | HIGH. Locked 2026-05-19 (Adi: changed from PRE/fixed-time to POST/conditional; chose 60 min grace; locked body-doubling voice). The trigger does the "personalized timing" work; the copy stays pure body-double presence. |
| **OQ-A24** | Kid permission flow | **At end of ChildJoin onboarding (after kid completes setup), pre-prompt:** `"{buddy_name} רוצה להזכיר לך דברים — מותר?"` → if yes, OS prompt; if no, local-only mode. Re-prompt opportunity at first task assigned by parent (if not granted) | MEDIUM-HIGH. ChildJoin is the only kid-controlled flow; that's the right insertion point. Friend-voice copy aligns with IN-2026-05-19-03. |
| **OQ-A25** | E9 copy (kid gets "parent approved reward") | **HE:** `"{buddy_name}: ההורה אישר/ה משהו שביקשת 🎉"` · **EN:** `"{buddy_name}: parent said yes to something you asked for 🎉"`. **Does NOT name the reward** (avoid reward-mention per IN-2026-05-19-03; kid will see in app on open). | MEDIUM. Compromise: must convey "something positive happened" to motivate open, without naming what (Pillar 1). The reward name is in the in-app view, not the push. |
| **OQ-A26** | E13 copy (parent gets "new family member joined") | **HE:** `"{new_member_name} הצטרף/ה למשפחה 👋"` · **EN:** `"{new_member_name} joined the family 👋"` | HIGH. Declarative, no rescuer mode. |

---

## Decisions added during execution

(Empty; populated by CC during implementation, mirroring the EX-1..EX-5 pattern from `pkg/daily-vibe-check`.)

---

## Proposed Phased Chunks

| # | Phase | Chunks | Exit criteria |
|---|---|---|---|
| **0** | Foundation | Verify Firebase project + service account; verify `notifications` live schema; verify `pg_cron` extension availability (Phase 6); create STATUS/TESTS/SPEC_SYNC; lock OQ-A18 (audit table) with Adi | SPEC + folder verified; service account JSON exists or Adi creates it; `pg_cron` confirmed available |
| **1** | DB — `device_tokens` migration + idempotency table + `notifications` repo capture + drop `profiles.fcm_token` | `migrations/012_device_tokens.sql`; `notification_pushes` idempotency table; RLS policies; backfill query; types regen | `supabase list_tables` shows new tables; `profiles.fcm_token` absent |
| **2** | Client token registration (Android) — parent path | `expo-notifications` install + `app.json` plugin; `usePushRegistration.ts` hook; `UStepPushPermissionPrePrompt.tsx` parent screen; integration into root app lifecycle | Fresh install → parent grants via pre-prompt → token in `device_tokens` as `fcm-android` |
| **3** | Edge Function — dispatch core (E1, E2, E13) | `supabase/functions/push-notification-fanout/index.ts`; `fcm.ts` (OAuth2 + send); recipient resolution (parent vs kid); activity-based suppression (`last_seen_at < 5 min` check); per-token error handling; dead-token cleanup | Manual INSERT to `notifications` (type=parent_sos) → push within 5s on emulator with parent active >5 min ago; if parent active <5 min → no push, row still present |
| **4** | i18n + per-type copy library — parent voice + kid voice | `supabase/functions/push-notification-fanout/copy.ts` with `{type, recipient_role, lang} → {title, body}` for E1, E2, E6, E13 (parent) + E5, E9 (kid); `src/i18n/he.json`+`en.json` for in-app toast variants; **declarative checklist** (IN-2026-05-17-01) + **kid Pillar-1 checklist** (IN-2026-05-19-03) reviewed per key | Copy reviewed against both checklists; all 6 push types per locale + role |
| **5** | Foreground handling + tap-route | `setNotificationHandler` for foreground suppression; theme-aware `<PushToast>` component (parent + kid variants); `notificationRouter.ts` mapping `data.type` → navigation action; integration in `App.tsx` | Foreground push → no tray, toast shown; tap on toast → correct route; background tap → correct deep link |
| **6** | Kid permission flow + token registration for kid (own-device path) | `usePushRegistration` extended for kid role; ChildJoin onboarding post-completion pre-prompt screen (friend-voice copy); kid-side `device_tokens` row with `profile_id=child_id` | Kid completes ChildJoin → pre-prompt → grants → token registered with kid profile_id |
| **7** | Engagement scheduler (E5, E6) — `pg_cron` + scan function | `migrations/013_engagement_scheduler.sql` with: (a) pg_cron job once daily 09:00; (b) SQL function `scan_disengaged_users()` inserts `notifications` rows for kids @ 5d/14d and parents @ 5d+; (c) cap+cooldown logic in SQL | Manual SQL test: backdated profile `last_seen_at` triggers row insert; row triggers Edge Function dispatch as normal |
| **8** | E7 + E11 in-app local notification scheduler (kid) — **POST trigger + body-doubling** | `useKidLocalNotifications.ts` hook that, on each app foreground, schedules per-phase notifications via `expo-notifications.scheduleNotificationAsync` at `first_task.scheduled_time + 60min`; pre-fire condition check (task incomplete AND `last_seen_at < phase.start_time` AND no cooldown); cancellation when kid opens during phase or completes task; 3-day cooldown state per phase; **body-doubling copy** per IN-2026-05-19-03 | On emulator: kid app installed, afternoon phase has 1 task at 16:00, kid doesn't open + doesn't complete → at 17:00 (16:00 + 60min) local notification fires with `"{buddy_name}: לידך, בקצב שלך"`. If kid opens at 16:30 → notification cancelled. |
| **9** | Web client stub (Expo Web) | `firebase` web SDK install (separate npm approval); `web/firebase-messaging-sw.js`; `webPushRegistration.ts` behind `Platform.OS === 'web'`; token registers as `fcm-web` | Phase 2 web build (when active) registers; Edge Function dispatches FCM web variant (deferred verification until web enabled) |
| **10** | iOS design capture only | SPEC appendix § "iOS APNs flow" with: `expo-notifications` iOS plugin config, Apple Push Services cert generation, FCM cert upload, APNs key vs cert decision, sandbox vs production env | No code; SPEC appendix complete |
| **11** | Spec sync + tests + STATUS + INTEGRATION_LEARNINGS + PR | STATUS row per phase; flip `BUFF_FEATURE_AUDIT.md` S-01 → ✅; flip `BUFF_FEATURE_PRIORITIZATION.md` F-039 + F-063 → shipped; `BUFF_PRD.md §9.2` FCM line → shipped; `BUFF_GAP_ANALYSIS.md` rows; INTEGRATION_LEARNINGS for surprises; open PR | PR opened, build green, regression on dashboard SOS surface passes |

---

## Exit Deliverables — SPEC_SYNC matrix

(Will move into `SPEC_SYNC.md` at Phase 0.)

| Phase | Canonical doc update | What changes |
|---|---|---|
| 0 | Session `STATUS.md`, `TESTS.md`, `SPEC_SYNC.md` | scaffolded |
| 1 | None (DB migration only) | — |
| 2 | `app.json`, `package.json` | `expo-notifications` plugin + dep |
| 3 | None (new Edge Function + suppression module) | — |
| 4 | `src/i18n/he.json`, `src/i18n/en.json` | per-recipient (parent + kid) push copy + permission pre-prompt copy |
| 5 | None (new client modules) | — |
| 6 | None (ChildJoin extension + new kid pre-prompt screen) | — |
| 7 | None (new migration `013_engagement_scheduler.sql`) | — |
| 8 | None (new kid local-notifications hook) | — |
| 9 | `app.json` (web config), `package.json` (firebase web SDK) | web setup |
| 10 | SPEC appendix only | iOS design notes |
| 11 | `BUFF_PRD.md` §9.2 FCM line → shipped; `BUFF_FEATURE_AUDIT.md` S-01 → ✅; `BUFF_FEATURE_PRIORITIZATION.md` F-039 + F-063 → shipped; `BUFF_GAP_ANALYSIS.md` row; `INTEGRATION_LEARNINGS.md` if surprises; `STATUS.md` closeout | per row |

---

## Risks

- **`pg_cron` extension may not be enabled** on the Supabase project. Phase 0 verifies via `list_extensions`. If absent → Adi enables (Supabase UI toggle) before Phase 7. Fallback: Supabase scheduled Edge Function.
- **`last_seen_at` field doesn't exist yet** on `device_tokens` (we're creating it in Phase 1) OR on `profiles` for engagement suppression — Phase 1 must add both. The Edge Function (Phase 3) and engagement scan (Phase 7) both depend on this.
- **Kid permission flow during ChildJoin** — ChildJoin onboarding flow currently has no post-completion hook. Phase 6 must extend it without regressing the existing ChildJoin tests.
- **Phase 7 scheduler logic in SQL is complex** (cap+cooldown per kid per event type). Alternative: move the cap/cooldown logic to the Edge Function (read scheduler trigger row → check history table → decide push). Phase 7 plan reviews this.
- **Firebase project setup is a prerequisite Adi may not have done yet.** If no Firebase project exists, Phase 0 cannot complete. Mitigation: Phase 0 first action = check via MCP/web for FCM creds; if absent, stop and ask Adi.
- **Database Webhook reliability.** Supabase webhooks can drop on heavy load or function cold start. Mitigation: `notification_pushes` idempotency table allows safe retries; v1.1 adds a sweeper that finds un-pushed rows older than X seconds and retries.
- **FCM HTTP v1 OAuth2 token generation in Deno** — Deno JWT libs are usable but not as turnkey as Node. Mitigation: Phase 3 includes a small Deno-compatible JWT signer; existing community recipes for Supabase Edge Function + FCM exist; reference at Phase 3 plan.
- **Permission denial in production** — Android 13+ denial rates are high if cold-prompted. Mitigation: OQ-A4 just-in-time + pre-prompt; v1.1 settings deep-link.
- **`expo-notifications` + Expo Go vs EAS Build** — push notifications in Expo Go (dev) use Expo's push service, which adds a routing hop. Production EAS builds use FCM directly. Test plan must distinguish dev (Expo Go) from production (EAS) — both should work, but token format differs.
- **iOS deferral risk** — when Apple dev account activates, the Phase 7 appendix must still be accurate. Mitigation: SPEC appendix lists exact steps + dates referenced docs; periodic skim during Sonnet 4.5+ era.
- **Sibling-package regression** — `useParentNotifications` (pkg/daily-vibe-check Phase 4b) MUST NOT regress. Mitigation: Phase 11 closeout verification includes the dashboard SOS surface snapshot test.
- **Cross-platform constraint stability** — Adi's "same mechanism" requirement was clarified during planning (2026-05-19) and locked to FCM HTTP v1 as the single backend. This unification is THE work that retires Lovable web push. If the decision shifts (e.g., separate web push provider), this SPEC needs revision *and* the unified-codebase plan is set back.
- **Web push has poor iOS Safari support** (only iOS 16.4+ PWA, limited). When Phase 2 Expo Web ships and replaces `buffadhd.com`, iOS Safari users get partial coverage until native iOS lands. Mitigation: surfaced in Phase 6 readme; acceptable transient state for MVP.

---

## Appendix A — iOS APNs design (Phase 10, design-only)

Captured 2026-05-20 during pkg/fcm-push-notifications execution. NO code yet — Apple Developer account is not active. When Adi activates the account, this appendix becomes the implementation checklist.

### A.1 Prerequisites (Adi action items)

1. **Apple Developer account** — Apple Developer Program enrollment (annual fee, ~$99)
2. **Bundle identifier** — already declared: `com.buff.mobile` (per `app.json`)
3. **App ID** — register at https://developer.apple.com/account/resources/identifiers — match the bundle id; enable **Push Notifications** capability
4. **APNs Authentication Key** — Apple recommends this over per-app certificates (one key works for all your apps). Generate at developer.apple.com → Keys → "+" → Apple Push Notifications service (APNs) → Download `.p8` file + record Key ID + Team ID

### A.2 Firebase ↔ APNs bridge

We use Firebase Cloud Messaging as the unified backend (IN-2026-05-19-01). FCM forwards iOS pushes to APNs:

1. Firebase Console → Project Settings → Cloud Messaging tab
2. Under "Apple app configuration":
   - Upload the `.p8` APNs Authentication Key
   - Enter Key ID + Team ID
3. Verify by sending a test FCM message from console → app

### A.3 expo-notifications iOS config

Add to `app.json` `expo.ios` section (when ready):

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.buff.mobile",
  "infoPlist": {
    "UIBackgroundModes": ["remote-notification"]
  },
  "entitlements": {
    "aps-environment": "production"
  }
}
```

The `expo-notifications` plugin already in `app.json` (added Phase 2) handles the rest.

### A.4 EAS Build config

For iOS production builds:
- `eas.json` `production` profile needs `"ios": { "distribution": "store" }`
- EAS Submit / TestFlight requires App Store Connect API key (separate Adi setup)
- Provisioning profile auto-managed by EAS (just needs Apple Developer creds)

### A.5 Differences from Android

| Aspect | Android (now) | iOS (when active) |
|---|---|---|
| Token type | `fcm-android` | `fcm-ios` (FCM-routed APNs token) |
| Permission prompt | Android 13+ POST_NOTIFICATIONS | iOS APNs prompt (since iOS 8, always required) |
| Foreground behavior | Same `setNotificationHandler` | Same (cross-platform via Expo) |
| Sandbox vs production | N/A | Dev builds use sandbox; production uses production APNs. EAS handles via `aps-environment` entitlement |
| Notification channels | Required (Android 8+) | Not applicable (iOS uses categories / interruption levels) |
| Badge update | Manual via `setBadgeCountAsync` | Manual same; aps payload also supports `badge` |
| Sound | Per-channel | Per-notification `sound` field |

### A.6 No code changes expected to `usePushRegistration`

The hook already does `getTokenType()` returning `'fcm-ios'` on iOS. `expo-notifications.getExpoPushTokenAsync()` works cross-platform. The only deployment work is the Adi-side credentials.

### A.7 Open questions to surface when iOS activates

- **APNs key vs certificate** — recommend key (one for all apps + no expiry)
- **Sandbox push for TestFlight** — iOS uses production APNs for TestFlight (counter-intuitive but documented)
- **Notification Service Extension** — for rich payloads (images, mutable content). Defer to v1.1.
- **Critical Alerts** — bypass DND. NOT enabling for BUFF (Pillar 2 — alarm-design risk).

### A.8 Test plan (when iOS activates)

- Fresh install → onboard parent → pre-prompt → grant → token registered with `token_type='fcm-ios'`
- Send test via Firebase Console → tray push appears
- Send via Edge Function (same dispatch path) → tray push appears
- Foreground app → no tray, in-app toast (same as Android)
- Tap from background → app opens, correct route
- Web build (already shipped by then) → simultaneous push delivery across both

---

## Brief for the receiving session

Paste this as the first message when you spin up a new CC session for this package:

```
Plan Mode. You are picking up pkg/fcm-push-notifications.

Read FIRST:
- CLAUDE.md
- docs/WORKFLOW.md
- docs/BUFF_VALUES.md (the 3 pillars + Values Check)
- docs/BUFF_PRD.md §2.2 (65% shared device), §9.2 (FCM target in tech stack)
- docs/BUFF_FEATURE_AUDIT.md S-01 (push, Keep + Expand)
- docs/BUFF_FEATURE_PRIORITIZATION.md F-039, F-063 (MVP push)
- docs/INTEGRATION_LEARNINGS.md IN-2026-05-17-01 (declarative copy
  convention — parent push), IN-2026-05-17-03 (3-package
  sequencing), **IN-2026-05-19-01** (FCM HTTP v1 as single
  cross-platform backend — locked), **IN-2026-05-19-02** (gating =
  generic + activity suppression, NOT device-aware — locked),
  **IN-2026-05-19-03** (kid push = presence + autonomy-marker
  only, no reward/task/count mentions — locked)
- docs/sessions/fcm-push-notifications/SPEC.md (this SPEC — read all,
  including all OQ-A0..A26 defaults; **OQ-A0 is the foundational
  gating principle**; A21-A26 are the engagement + kid permission
  decisions locked 2026-05-19; you may surface override at Adi sign-off
  per phase, but the IN-2026-05-19-XX principles are locked, not OQs)
- docs/sessions/daily-vibe-check/SPEC.md § "Decisions Locked" (the
  template you're mirroring — esp. the "Decisions added during execution"
  pattern)
- migrations/011_parent_sos_notification_trigger.sql (the trigger that
  produces the rows you'll be pushing)
- src/hooks/useParentNotifications.ts (the existing in-app read pattern
  — DO NOT modify in this package; sibling pkg/parent-notification-feed
  owns it)
- app.json + package.json + eas.json (current state — verify before
  installing expo-notifications)

Before proposing chunks:
- Verify Firebase project exists + service account JSON is available
  (MCP can't do this — ask Adi at Phase 0 start). If absent, STOP and
  surface to Adi.
- Verify `public.notifications` live schema matches what's in this SPEC
  (use Supabase MCP `list_tables`).
- Verify `profiles.fcm_token` column still exists and is still empty (or
  near-empty). If non-empty rows exist, backfill query must preserve
  them.

Branch off main as pkg/fcm-push-notifications. No code until Adi
approves Phase 0. Chunk-by-chunk discipline per CLAUDE.md.

New dep approvals required in advance:
- `expo-notifications` (Phase 2) — pre-approved in this SPEC
- `firebase` web SDK (Phase 6) — separate approval at Phase 6 plan time

Hard product principles (NEVER PROPOSE):
- Login UX for child users (memory `feedback_kids_never_login`)
- Push notifications without checking Pillar 2 (no alarm-design copy)
- Read receipts / "ההורה ראה" patterns (Pillar 3)
- task_completed push in any phase (locked off — E3)
- quest_milestone push (stale — E4)
- Kid-side push copy that mentions rewards/tasks/BUFFs/count/progress
  (IN-2026-05-19-03 — converts intrinsic motivation to extrinsic).
  All kid copy must pass the "body double test" — would a virtual body
  double say this? See IN-2026-05-19-03 amendment 2026-05-19 +
  `docs/BUFF_BUDDY_SYSTEM.md` line 25 for the canonical body-double
  framing. Templates: "{buddy_name}: פה, מוכן/ה כשתרצה" / "with you,
  at your pace" / "standing by".
- Device-aware gating via `has_own_device` derivation (IN-2026-05-19-02
  — use activity-based suppression instead)
- Sad-buddy / pressure framing (e.g., "BUDDY חיכה לך")
- Alternative push backends (OneSignal, Pusher, etc.) — FCM HTTP v1
  is locked per IN-2026-05-19-01

The sibling package pkg/parent-notification-feed reads the SAME table.
DO NOT modify its hook (`useParentNotifications.ts`); both packages
must be able to ship in either order. If you need to refactor that
hook, flag to Adi as scope creep.
```
