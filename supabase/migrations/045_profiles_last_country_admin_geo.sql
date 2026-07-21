-- 045_profiles_last_country_admin_geo.sql
--
-- Country on the admin tester board (pkg/admin-country).
--
-- 1. profiles.last_country — ISO 3166-1 alpha-2 region code from the DEVICE
--    locale (expo-localization), stamped by bumpLastSeenAt() on every app
--    foreground alongside last_seen_at. Device-settings based, NOT IP
--    geolocation (privacy posture: no IP lookups for a children's app).
--    Nullable; existing rows stay NULL until the user opens an updated app.
--
-- 2. get_admin_tester_board() — expose two family-level geo/platform fields:
--      country       = most recently seen non-null last_country in the family
--      last_platform = most recently seen non-null last_platform in the family
--                      ('android' | 'ios' | 'android-web' | 'ios-web' |
--                       'desktop-web'; finer-grained than families.platform,
--                       which stays the canonical signup-source column)
--
-- Additive only: old admin UI ignores the new JSON keys; no existing-user
-- impact (new nullable column, no defaults, no backfill).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_country text;

COMMENT ON COLUMN public.profiles.last_country IS
  'ISO 3166-1 alpha-2 device-locale region (e.g. IL, US), stamped on app foreground by bumpLastSeenAt(). Device settings, not IP geo.';

CREATE OR REPLACE FUNCTION public.get_admin_tester_board(p_since date DEFAULT '2026-05-20'::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH cohort_families AS (
    SELECT f.id, f.name, f.created_at, f.preferred_language, f.short_code, f.platform
    FROM families f
    WHERE f.created_at >= p_since
       OR EXISTS (
         SELECT 1 FROM profiles p
         WHERE p.family_id = f.id AND p.role = 'child'
           AND p.pro_settings ? 'onboarding_data'
           AND COALESCE(p.is_deleted, false) = false
       )
  ),
  child_json AS (
    SELECT
      p.family_id,
      jsonb_build_object(
        'id', p.id,
        'name', p.display_name,
        'age_group', p.pro_settings->>'age_group',
        'gender', p.pro_settings->>'gender',
        'language', p.pro_settings->>'language',
        'created_at', p.created_at,
        'onboarding', p.pro_settings->'onboarding_data',
        'balance', COALESCE((
          SELECT cv.total_balance FROM credit_vault cv
          WHERE cv.child_id = p.id ORDER BY cv.updated_at DESC NULLS LAST LIMIT 1
        ), 0),
        'tasks', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', t.id, 'title', t.title, 'category', t.category,
            'time', t.time, 'credits', t.credits, 'icon', t.icon,
            'created_at', t.created_at,
            'proposed_by_child', COALESCE(t.proposed_by_child, false),
            'is_system_generated', COALESCE(t.is_system_generated, false)
          ) ORDER BY t.created_at)
          FROM tasks t WHERE t.assigned_to = p.id
        ), '[]'::jsonb),
        'rewards', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', r.id, 'title', r.title, 'title_he', r.title_he,
            'emoji', r.emoji, 'size', r.size,
            'credits_needed', r.credits_needed,
            'is_redeemed', r.is_redeemed,
            'proposed_by_child', COALESCE(r.proposed_by_child, false)
          ) ORDER BY r.created_at)
          FROM store_rewards r WHERE r.child_id = p.id
        ), '[]'::jsonb),
        'completions_total', COALESCE((
          SELECT count(*) FROM daily_progress dp
          WHERE dp.child_id = p.id AND dp.completed = true AND dp.revoked_at IS NULL
        ), 0),
        'completions_by_day', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('date', d.day, 'count', d.cnt))
          FROM (
            SELECT COALESCE(dp.completed_at, dp.created_at)::date AS day, count(*) AS cnt
            FROM daily_progress dp
            WHERE dp.child_id = p.id AND dp.completed = true AND dp.revoked_at IS NULL
              AND COALESCE(dp.completed_at, dp.created_at) >= (now() - interval '21 days')
            GROUP BY COALESCE(dp.completed_at, dp.created_at)::date
          ) d
        ), '[]'::jsonb),
        'first_active', (
          SELECT min(COALESCE(dp.completed_at, dp.created_at)) FROM daily_progress dp
          WHERE dp.child_id = p.id AND dp.completed = true AND dp.revoked_at IS NULL
        ),
        'last_active', (
          SELECT max(COALESCE(dp.completed_at, dp.created_at)) FROM daily_progress dp
          WHERE dp.child_id = p.id AND dp.completed = true AND dp.revoked_at IS NULL
        )
      ) AS cj
    FROM profiles p
    WHERE p.role = 'child'
      AND COALESCE(p.is_deleted, false) = false
      AND p.family_id IN (SELECT id FROM cohort_families)
  ),
  family_json AS (
    SELECT
      f.id, f.name, f.created_at, f.preferred_language, f.short_code,
      -- Canonical platform = families.platform (signup-capture from migration
      -- 021, backfilled on app-open for the pre-instrumentation cohort).
      f.platform AS platform,
      -- Geo + live platform (045): most recently seen non-null value across
      -- the family's profiles. last_seen_at moves with the same client write
      -- that stamps these, so it is the right recency key.
      (SELECT pp.last_country FROM profiles pp
        WHERE pp.family_id = f.id AND pp.last_country IS NOT NULL
          AND COALESCE(pp.is_deleted, false) = false
        ORDER BY pp.last_seen_at DESC NULLS LAST LIMIT 1) AS country,
      (SELECT pp.last_platform FROM profiles pp
        WHERE pp.family_id = f.id AND pp.last_platform IS NOT NULL
          AND COALESCE(pp.is_deleted, false) = false
        ORDER BY pp.last_platform_at DESC NULLS LAST LIMIT 1) AS last_platform,
      (SELECT pp.display_name FROM profiles pp
        WHERE pp.family_id = f.id AND pp.role = 'parent'
        ORDER BY pp.created_at LIMIT 1) AS parent_name,
      (SELECT u.email FROM profiles pp JOIN auth.users u ON u.id = pp.user_id
        WHERE pp.family_id = f.id AND pp.role = 'parent' AND pp.user_id IS NOT NULL
        ORDER BY pp.created_at LIMIT 1) AS parent_email,
      -- Billing: a real payer has premium_until set (RevenueCat), a granted
      -- tester has a lifetime flag. Family-scoped (any member counts).
      (SELECT max(pp.premium_until) FROM profiles pp
        WHERE pp.family_id = f.id
          AND COALESCE(pp.is_deleted, false) = false) AS premium_until,
      COALESCE((SELECT bool_or(
          COALESCE(pp.is_lifetime_access, false) OR COALESCE(pp.is_lifetime_founding, false))
        FROM profiles pp
        WHERE pp.family_id = f.id
          AND COALESCE(pp.is_deleted, false) = false), false) AS has_lifetime,
      COALESCE(
        jsonb_agg(cj.cj ORDER BY cj.cj->>'created_at') FILTER (WHERE cj.cj IS NOT NULL),
        '[]'::jsonb
      ) AS children
    FROM cohort_families f
    LEFT JOIN child_json cj ON cj.family_id = f.id
    GROUP BY f.id, f.name, f.created_at, f.preferred_language, f.short_code, f.platform
  )
  SELECT jsonb_agg(to_jsonb(fj) ORDER BY fj.created_at DESC)
  INTO result
  FROM family_json fj;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;
