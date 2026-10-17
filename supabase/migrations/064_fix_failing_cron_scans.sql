-- 064 — fix the two pg_cron jobs that fail on every run (QA 2026-10-15, B-02 / B-03).
--
-- 1) scan_disengaged_users_daily — failing daily since 2026-08-01:
--      null value in column "family_id" of relation "notifications"
--    3 child profiles have family_id IS NULL; one bad row rolls back the whole
--    insert, so NO disengagement nudges have gone out for 2.5 months.
--    Fixes:
--      * skip kids with no family (the parent branch already had this guard)
--      * skip soft-deleted kids (73 deleted kids would otherwise get nudged)
--      * only nudge people last seen 5-30 days ago. Without the upper bound the
--        first successful run would fire ~76 kid + ~253 parent "come back"
--        notifications at once, to families gone for months. With it: ~7 + ~7.
--
-- 2) refresh-basic-insights-friday — has never succeeded (since 2026-06-26):
--      column "balance" does not exist
--    compute_basic_insight read columns that do not exist:
--      credit_vault.balance    -> total_balance
--      store_rewards.cost      -> credits_needed
--      store_rewards.is_active -> not redeemed, scoped to this child or family-wide
--    A child with no credit_vault row now counts as balance 0 (was NULL).
--
-- Function bodies only: no table, column or RLS changes. Both functions stay
-- SECURITY DEFINER; search_path is now pinned (advisor warning).

CREATE OR REPLACE FUNCTION public.scan_disengaged_users()
 RETURNS TABLE(kid_engagement_inserts integer, parent_engagement_inserts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  kid_count INT := 0;
  parent_count INT := 0;
BEGIN
  WITH eligible_kids AS (
    SELECT p.id, p.family_id, p.display_name
    FROM public.profiles p
    LEFT JOIN public.app_settings aps ON aps.family_id = p.family_id
    WHERE p.role = 'child'
      AND p.family_id IS NOT NULL
      AND COALESCE(p.is_deleted, false) = false
      AND p.last_seen_at <= (now() - INTERVAL '5 days')
      AND p.last_seen_at >  (now() - INTERVAL '30 days')
      AND NOT (
        COALESCE(aps.pause_mode_active, false) = true
        AND (aps.pause_until IS NULL OR aps.pause_until > now())
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'kid_engagement'
          AND n.child_id = p.id
          AND n.created_at > (now() - INTERVAL '14 days')
      )
  ),
  inserted_kid_rows AS (
    INSERT INTO public.notifications (family_id, parent_id, type, child_id, child_name)
    SELECT ek.family_id, ek.id, 'kid_engagement', ek.id, ek.display_name
    FROM eligible_kids ek
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO kid_count FROM inserted_kid_rows;

  WITH eligible_parents AS (
    SELECT p.id, p.family_id, p.display_name
    FROM public.profiles p
    LEFT JOIN public.app_settings aps ON aps.family_id = p.family_id
    WHERE p.role = 'parent'
      AND p.last_seen_at <= (now() - INTERVAL '5 days')
      AND p.last_seen_at >  (now() - INTERVAL '30 days')
      AND p.family_id IS NOT NULL
      AND NOT (
        COALESCE(aps.pause_mode_active, false) = true
        AND (aps.pause_until IS NULL OR aps.pause_until > now())
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'parent_engagement'
          AND n.parent_id = p.id
          AND n.created_at > (now() - INTERVAL '7 days')
      )
  ),
  inserted_parent_rows AS (
    INSERT INTO public.notifications (family_id, parent_id, type, child_name)
    SELECT ep.family_id, ep.id, 'parent_engagement', ''
    FROM eligible_parents ep
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO parent_count FROM inserted_parent_rows;

  RETURN QUERY SELECT kid_count, parent_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_basic_insight(p_child_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_family_id        UUID;
  v_active_days      INT := 0;
  v_days_with_data   INT := 0;
  v_balance          INT := 0;
  v_cheapest_cost    INT;
  v_rewards_count    INT := 0;
  v_redemptions_14d  INT := 0;
  v_is_active        BOOL;

  v_wcase  TEXT; v_wi18n TEXT; v_wcta TEXT; v_wempty BOOL;
  v_tlayer TEXT; v_tcase TEXT; v_ti18n TEXT; v_tcta  TEXT;
BEGIN
  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = p_child_id;
  IF v_family_id IS NULL THEN RETURN NULL; END IF;

  -- Active days (at least 1 completed task) in last 7 full days
  SELECT COUNT(DISTINCT date) INTO v_active_days
  FROM public.daily_progress
  WHERE child_id   = p_child_id
    AND family_id  = v_family_id
    AND completed  = true
    AND date::date >= CURRENT_DATE - INTERVAL '7 days'
    AND date::date <  CURRENT_DATE;

  -- Any tracked day (gates the B5 empty state)
  SELECT COUNT(DISTINCT date) INTO v_days_with_data
  FROM public.daily_progress
  WHERE child_id   = p_child_id
    AND family_id  = v_family_id
    AND date::date >= CURRENT_DATE - INTERVAL '7 days'
    AND date::date <  CURRENT_DATE;

  -- BUFF balance (was credit_vault.balance; the column is total_balance)
  SELECT total_balance INTO v_balance
  FROM public.credit_vault WHERE child_id = p_child_id;
  v_balance := COALESCE(v_balance, 0);

  -- Rewards this child can still claim (was cost / is_active; neither exists)
  SELECT COUNT(*), MIN(credits_needed) INTO v_rewards_count, v_cheapest_cost
  FROM public.store_rewards
  WHERE family_id = v_family_id
    AND (child_id = p_child_id OR child_id IS NULL)
    AND COALESCE(is_redeemed, false) = false;

  -- Approved redemptions in last 14 days
  SELECT COUNT(*) INTO v_redemptions_14d
  FROM public.reward_redemptions
  WHERE child_id   = p_child_id
    AND status     = 'approved'
    AND created_at >= NOW() - INTERVAL '14 days';

  v_is_active := v_active_days > 0;

  -- Layer B
  IF    v_days_with_data < 3    THEN v_wcase:='B5'; v_wi18n:='comingSoon'; v_wcta:='none';         v_wempty:=true;
  ELSIF v_active_days    >= 5   THEN v_wcase:='B1'; v_wi18n:='strong';     v_wcta:='send-bonus';    v_wempty:=false;
  ELSIF v_active_days    >= 3   THEN v_wcase:='B2'; v_wi18n:='building';   v_wcta:='send-sticker';  v_wempty:=false;
  ELSIF v_active_days    >= 1   THEN v_wcase:='B3'; v_wi18n:='growing';    v_wcta:='send-sticker';  v_wempty:=false;
  ELSE                               v_wcase:='B4'; v_wi18n:='quiet';      v_wcta:='set-anchor';    v_wempty:=false;
  END IF;

  -- Layer C0: reward loop
  v_tlayer := NULL;
  IF v_rewards_count = 0 OR v_cheapest_cost IS NULL THEN
    v_tlayer:='C0'; v_tcase:='C0a'; v_ti18n:='insights.weekly.rewardLoop.noRewards'; v_tcta:='open-rewards';
  ELSIF v_redemptions_14d = 0 AND v_balance >= v_cheapest_cost THEN
    IF v_balance >= v_cheapest_cost * 2 THEN
      v_tlayer:='C0'; v_tcase:='C0c'; v_ti18n:='insights.weekly.rewardLoop.hoarding';     v_tcta:='open-rewards';
    ELSIF v_is_active THEN
      v_tlayer:='C0'; v_tcase:='C0b'; v_ti18n:='insights.weekly.rewardLoop.notRedeeming'; v_tcta:='open-rewards';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'weekly', jsonb_build_object(
      'id',      v_wcase,
      'i18nKey', v_wi18n,
      'ctaType', v_wcta,
      'isEmpty', v_wempty
    ),
    'tip', CASE WHEN v_tlayer IS NOT NULL THEN jsonb_build_object(
      'layer',   v_tlayer,
      'caseId',  v_tcase,
      'i18nKey', v_ti18n,
      'ctaType', v_tcta
    ) ELSE NULL END
  );
END;
$function$;
