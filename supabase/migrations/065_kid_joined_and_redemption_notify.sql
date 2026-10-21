-- 065 — pkg/anchor-routine-onboarding M1: measure "kid on board" + fix the
-- reward-request notification recipient.
--
-- 1) kid_joined event (server-side, platform-agnostic)
--    A child "joins" when their profile gets its own auth user
--    (profiles.user_id NULL -> NOT NULL, today via link_child_profile). Until now
--    nothing recorded WHEN that happened, so "kid on board within 48h" — the
--    strongest signal in the 2026-10-20 sustained-families analysis — could not
--    be measured. A trigger writes onboarding_events.kid_joined once per child.
--    The insert is wrapped so a telemetry failure can never block the link.
--
-- 2) notify_parent_on_redemption_request — recipient fix
--    The old body picked `role='parent' LIMIT 1` with no ORDER BY and no
--    is_deleted filter, so the push could go to an arbitrary — even deleted —
--    parent. The bell feed is family-wide (useNotificationsFeed filters by
--    family_id), so we keep ONE row per request (no duplicate bell items) and
--    choose the recipient most likely to see the push:
--      live parent with a device token / web subscription first,
--      then most recently seen, then oldest.
--
-- 3) admin_kid_join_funnel(p_since) — admin-board cohort table
--    One row per signup week: children created, joined <=48h, joined ever,
--    routine week 2 (>=3 completion days in days 7-13), active week 4
--    (>=1 completion in days 21-27). joined_at = kid_joined event, else the
--    child's auth.users.created_at (estimate for children linked before 065).
--
-- No table / column / RLS changes. Functions are SECURITY DEFINER with a
-- pinned search_path.

-- ---------------------------------------------------------------------------
-- 1) kid_joined
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_profiles_child_joined()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = 'child'
     AND NEW.user_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.user_id IS NULL)
     AND NOT EXISTS (
       SELECT 1 FROM onboarding_events e
       WHERE e.child_id = NEW.id AND e.event_type = 'kid_joined'
     )
  THEN
    BEGIN
      INSERT INTO onboarding_events (family_id, child_id, event_type, method, source, platform)
      VALUES (NEW.family_id, NEW.id, 'kid_joined', NEW.access_mode, 'server', NEW.last_platform);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'kid_joined telemetry failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_profiles_child_joined ON public.profiles;
CREATE TRIGGER trg_profiles_child_joined
  AFTER INSERT OR UPDATE OF user_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_child_joined();

-- ---------------------------------------------------------------------------
-- 2) redemption request -> best reachable live parent
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_parent_on_redemption_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_child_name text;
  v_parent_id  uuid;
begin
  if NEW.status = 'requested' then
    select display_name into v_child_name from profiles where id = NEW.child_id;
    select p.id into v_parent_id
      from profiles p
     where p.family_id = NEW.family_id
       and p.role = 'parent'
       and coalesce(p.is_deleted, false) = false
     order by
       (exists (select 1 from device_tokens d where d.profile_id = p.id)
        or exists (select 1 from push_subscriptions s where s.profile_id = p.id)) desc,
       p.last_seen_at desc nulls last,
       p.created_at
     limit 1;
    if v_parent_id is not null then
      insert into notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
      values (NEW.family_id, v_parent_id, 'reward_redemption_requested', NEW.child_id,
              coalesce(v_child_name, ''), NEW.reward_id, coalesce(NEW.reward_title, ''), false);
    end if;
  end if;
  return NEW;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3) admin cohort table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_kid_join_funnel(p_since date DEFAULT '2026-06-01'::date)
 RETURNS TABLE(
   cohort_week date,
   children integer,
   joined_48h integer,
   joined_ever integer,
   joined_estimated integer,
   week2_eligible integer,
   week2_routine integer,
   week4_eligible integer,
   week4_active integer
 )
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH kids AS (
    SELECT c.id, c.created_at,
           COALESCE(
             (SELECT min(e.occurred_at) FROM onboarding_events e
               WHERE e.child_id = c.id AND e.event_type = 'kid_joined'),
             (SELECT u.created_at FROM auth.users u WHERE u.id = c.user_id)
           ) AS joined_at,
           NOT EXISTS (SELECT 1 FROM onboarding_events e
                        WHERE e.child_id = c.id AND e.event_type = 'kid_joined')
             AND c.user_id IS NOT NULL AS estimated
      FROM profiles c
      JOIN families f ON f.id = c.family_id
     WHERE c.role = 'child'
       AND COALESCE(c.is_deleted, false) = false
       AND c.created_at >= p_since
       -- same spirit as admin-web isTestFamily(): drop internal/test families
       AND f.name !~* '(test|qa |qa''|buffapp|demo|elgarat)'
       AND NOT EXISTS (
         SELECT 1 FROM profiles pp JOIN auth.users u ON u.id = pp.user_id
          WHERE pp.family_id = f.id AND pp.role = 'parent'
            AND u.email ~* '(test|adi\.elgarat|@example\.com|@buff\.app|@buffadhd\.com|buff\.parenting|leia@)'
       )
  ),
  activity AS (
    SELECT k.*,
      (SELECT count(DISTINCT COALESCE(dp.completed_at, dp.created_at)::date)
         FROM daily_progress dp
        WHERE dp.child_id = k.id AND dp.completed AND dp.revoked_at IS NULL
          AND COALESCE(dp.completed_at, dp.created_at) >= k.created_at + interval '7 days'
          AND COALESCE(dp.completed_at, dp.created_at) <  k.created_at + interval '14 days') AS w2_days,
      (SELECT count(*)
         FROM daily_progress dp
        WHERE dp.child_id = k.id AND dp.completed AND dp.revoked_at IS NULL
          AND COALESCE(dp.completed_at, dp.created_at) >= k.created_at + interval '21 days'
          AND COALESCE(dp.completed_at, dp.created_at) <  k.created_at + interval '28 days') AS w4_comps
    FROM kids k
  )
  SELECT date_trunc('week', a.created_at)::date,
         count(*)::int,
         count(*) FILTER (WHERE a.joined_at <= a.created_at + interval '48 hours')::int,
         count(*) FILTER (WHERE a.joined_at IS NOT NULL)::int,
         count(*) FILTER (WHERE a.estimated)::int,
         count(*) FILTER (WHERE a.created_at <= now() - interval '14 days')::int,
         count(*) FILTER (WHERE a.created_at <= now() - interval '14 days' AND a.w2_days >= 3)::int,
         count(*) FILTER (WHERE a.created_at <= now() - interval '28 days')::int,
         count(*) FILTER (WHERE a.created_at <= now() - interval '28 days' AND a.w4_comps >= 1)::int
    FROM activity a
   GROUP BY 1
   ORDER BY 1 DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_kid_join_funnel(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_kid_join_funnel(date) TO authenticated;
