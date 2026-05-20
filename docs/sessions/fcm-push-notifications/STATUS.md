# pkg/fcm-push-notifications — STATUS

> Per-package progress log per CLAUDE.md § Exit Deliverables. Updated by CC at each phase exit.

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| **0: Foundation** | ✅ _passed_ | 2026-05-19 | `4239b09` | MCP schema verification + scaffolding files present | none surprising |
| **1: DB migration 012** | ✅ _passed_ | 2026-05-20 | (this commit) | Migration applied to live (gfrongfnyigxsexuofrg) via MCP `apply_migration`; `get_advisors` security check: 1 INFO (notification_pushes has RLS+no policies — by design, service-role only) + pre-existing function warnings unrelated to this migration | F-2026-05-20-01 (env separation deferred); `feedback_mobile_db_no_prod_users.md` memory |

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

## Phase 1 deliverables (this commit, 2026-05-20)

### ✅ Schema applied to live (project gfrongfnyigxsexuofrg)

- `profiles.last_seen_at` column added (TIMESTAMPTZ NOT NULL DEFAULT now())
- `public.device_tokens` table created (PK + profile_id FK + token UNIQUE + token_type CHECK + last_seen_at + created_at), index `idx_device_tokens_profile_type`, RLS enabled with 4 owner-only policies
- `public.notification_pushes` table created (notification_id PK→notifications.id, pushed_at, recipient_token_count, suppressed_reason), RLS enabled (no policies — service role only by design)
- `public.notifications` repo migration (no-op on prod via `CREATE TABLE IF NOT EXISTS`)
- `profiles.fcm_token` column DROPPED (0 non-null rows pre-migration; backfill no-op)

### ✅ Verification

- `apply_migration` returned `{"success":true}`
- `get_advisors` security check: 1 INFO-level lint on `notification_pushes` (RLS+no-policies — INTENTIONAL, service role only); pre-existing WARN-level lints on Lovable-era functions unrelated
- Repo migration file: `migrations/012_fcm_push_foundation.sql` (idempotent — `CREATE/ALTER IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP COLUMN IF EXISTS`)

### 📝 Policy update (2026-05-20)

Adi confirmed buff-mobile Supabase has no production users — CC applies migrations directly without per-action approval. Saved as `feedback_mobile_db_no_prod_users.md` + `F-2026-05-20-01` (env separation deferred).

## Next: Phase 2 — Client token registration (Android, parent path)

- `npm install expo-notifications` (pre-approved per OQ-A1)
- `app.json` plugin config
- `src/hooks/usePushRegistration.ts` — permission + register token to `device_tokens`
- `src/screens/onboarding/UStepPushPermissionPrePrompt.tsx`
- Wire into root app lifecycle for foreground re-registration
