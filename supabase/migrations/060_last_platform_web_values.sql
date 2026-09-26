-- 060_last_platform_web_values.sql
--
-- Approved by Adi 2026-09-26.
--
-- The app stamps profiles.last_platform on every app foreground (bumpLastSeenAt)
-- with the fine-grained web split the web-to-native-cta SPEC asked for:
-- 'android-web' | 'ios-web' | 'desktop-web' (mobile web = convertible to native;
-- admin-web's badges.tsx already maps those values). But the CHECK added with
-- the column allows only 'web' | 'android' | 'ios', so every web heartbeat was
-- rejected — and it is ONE update, so last_seen_at never moved for any web user
-- either: engagement scans, push activity-suppression and the admin board saw
-- web parents as never active (0 of 408 profiles had a web value, 2026-09-26).
--
-- Widen the CHECK to the values the app writes; keep 'web' for any legacy row.
-- No data change: every existing value (NULL / 'android' / 'ios') stays valid.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_last_platform_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_last_platform_check
  CHECK (last_platform IS NULL OR last_platform IN
    ('android', 'ios', 'web', 'android-web', 'ios-web', 'desktop-web'));
