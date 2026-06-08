-- pkg/notifications-hardening Phase 3 — parent-owned notification preferences (columns only).
-- Applied to gfrongfnyigxsexuofrg via MCP apply_migration (notifications_hardening_p3_preference_columns).
-- No consumer reads these yet: Edge Function enforcement + client toggle UI ship
-- together in Phase 4 (an app build), so no channel is turned off before users
-- have a control to turn it back on. Defaults preserve current behavior.

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS notif_parent_alerts     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_child_reminders   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_anchor_nudges     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_activation_nudges boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notif_self_optin boolean;  -- 13-18 own-device kid opt-in; NULL = unset

-- Channel mapping (for Phase 4 enforcement):
--   notif_parent_alerts     → parent_sos, child_suggestion, reward_redemption_requested, reward_redeemed
--   notif_anchor_nudges     → anchor_recovery
--   notif_activation_nudges → activation_nudge
--   notif_child_reminders   → kid_engagement (6-12); for 13-18 use profiles.notif_self_optin instead
