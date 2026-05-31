-- pkg/dashboard-insight-declutter (2026-05-31)
-- Completes the parent notification bell: enable Supabase Realtime on the
-- notifications table so the floating bell badge live-updates.
--
-- Why this was needed:
--   useNotificationsFeed (src/hooks/useNotificationsFeed.ts) opens a
--   postgres_changes channel filtered by family_id to keep the bell badge in
--   sync after mark-as-read. The table was never added to the
--   supabase_realtime publication, so no events were ever delivered — the bell
--   badge stayed stale (still showed N after the feed was opened and all rows
--   were marked read). Device-verified 2026-05-31 on emulator-5554: badge did
--   not clear until this migration was applied.
--
-- REPLICA IDENTITY FULL: ensures family_id is present in the WAL old-row image
-- so the `family_id=eq.*` filter resolves on UPDATE (mark-read) events.
--
-- Applied to the mobile project (gfrongfnyigxsexuofrg) via Supabase MCP
-- apply_migration. No production users on this project.

alter table public.notifications replica identity full;
alter publication supabase_realtime add table public.notifications;
