# pkg/fcm-push-notifications — STATUS

> Per-package progress log per CLAUDE.md § Exit Deliverables. Updated by CC at each phase exit.

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| **0: Foundation** | 🟡 _in_progress_ | 2026-05-19 | (this commit) | Phase 0 has no app-code tests; verification = MCP schema checks + SPEC + folder structure present | none surprising yet |

## Legend

- `_pending_` — not started
- `_in_progress_` — plan approved, CC mid-phase
- `_passed_` — phase done, tests passed
- `_failed_` — tests failed, rework before continuing
- `_blocked_` — waiting on external (Adi review, Firebase setup, etc.)

## Phase 0 deliverables (this commit)

### ✅ Verified via Supabase MCP (2026-05-19)

**`public.notifications` table** matches SPEC exactly:
- Columns: `id, family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read, created_at`
- 396 rows (Lovable-era buff-mobile snapshot)
- RLS enabled
- FKs to `families` + `profiles` ✓
- Default `type='reward_redeemed'` ✓
- No repo migration — confirmed; Phase 1 will emit idempotent `CREATE TABLE IF NOT EXISTS`

**`public.profiles` columns** (relevant subset):
- `fcm_token` ✅ exists, `text`, nullable → Phase 1 migrate-and-drop
- `preferred_language` ✅ exists, default `'en'` → used for per-language copy in Edge Function (OQ-A19)
- `role` ✅ check constraint `'parent' | 'child'` → used for recipient routing in Edge Function
- `family_id` ✅ exists → used for fan-out
- **`last_seen_at` ❌ MISSING** → Phase 1 will add (used for activity-based suppression + engagement scheduler)

**`public.child_vibes` trigger 011** still active:
- Function `public.handle_parent_sos_sent()` exists in DB (verified via `pg_proc` query)
- Applied 2026-05-17 (per migration 011 header)

**Extensions installed:**
- `pg_cron 1.6.4` ✅ → Phase 7 scheduler unblocked
- `pgcrypto 1.3` ✅ → for `gen_random_uuid()`
- `vault 0.3.1` ✅ → could be used for FCM service account secret storage
- `pg_net 0.20.0` ❌ not installed — OK, we use Edge Function (OQ-A3) not pg_net trigger

### ✅ Verified absence (will be created in Phase 1)

- `public.device_tokens` table — DOES NOT EXIST
- `public.notification_pushes` table — DOES NOT EXIST

### ✅ Verified stale

- `quest_milestone` (E4) — 0 functions/triggers in DB matching the pattern → confirms "stale" verdict in SPEC § Non-goals

### 📁 Discovered, not in SPEC

- **`public.push_subscriptions` table** (0 rows) — Lovable-era PWA Web Push subscription store. Standard Web Push API format (endpoint/p256dh/auth_key). NOT FCM. Out of scope for this package; we use `device_tokens` (new) for FCM tokens. push_subscriptions can be dropped in a later cleanup migration; v1 leaves it alone.
- **`public.email_logs` table** (76 rows) — Lovable-era email send log. Not related to this package; mentioned only for completeness.

### 🟡 Pending Adi (Firebase setup — Phase 3 blocker)

**Phase 3 (Edge Function `push-notification-fanout`) cannot start without:**
1. **Firebase project created** for buff-mobile
2. **Service account JSON** with `Firebase Cloud Messaging API` permission
3. JSON stored as Supabase Edge Function secret `FCM_SERVICE_ACCOUNT_JSON`

Phases 1, 2, 4, 5, 6, 7, 8 (DB + client + i18n + scheduler + permission) can proceed WITHOUT Firebase. Once Adi provides the service account, Phase 3 unblocks.

**Action item for Adi:**
- Create Firebase project at https://console.firebase.google.com/ (if not already done)
- Link Android app: package name `com.buffapp.mobile` (from `app.json`)
- Link iOS app (Phase 10 design-only — can defer): bundle id `com.buff.mobile`
- Enable FCM API in Google Cloud Console
- Generate service account JSON: Project Settings → Service accounts → Generate new private key
- Provide the JSON content; CC will store as Edge Function secret

## Phase 0 closeout

- ✅ Branch `pkg/fcm-push-notifications` created off the planning branch HEAD (which includes the merged SPECs + main)
- ✅ Schema + extensions + existing-function verification completed via Supabase MCP
- ✅ STATUS.md (this file), TESTS.md, SPEC_SYNC.md scaffolded
- ✅ Firebase setup flagged as Phase 3 blocker; Phases 1, 2, 4-8 can proceed in parallel meanwhile
- ❌ No `src/` code touched (per phase contract)
- 🟡 Awaiting Adi: Firebase service account JSON (Phase 3 prerequisite)

## Next: Phase 1 — DB layer

Proceeding immediately. Migration `012_device_tokens.sql` will create:
- `device_tokens` table + RLS
- `notification_pushes` idempotency table + RLS
- `profiles.last_seen_at` column
- `notifications` idempotent capture (`CREATE TABLE IF NOT EXISTS`)
- Backfill of `profiles.fcm_token` → `device_tokens` (defensive, even though column is empty)
- Drop `profiles.fcm_token`
