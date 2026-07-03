-- 039_admin_install_cta_funnel.sql
--
-- Web-to-native install CTA — admin funnel RPC (SPEC §4.11, Phase 2d).
-- Aggregates public.install_cta_events by visitor class (target) and placement.
--
-- v1 = engagement funnel (impression → click → dismiss/open). The per-family
-- install→activation conversion needs the cta_id→family bridge + push_token_audit
-- (SPEC §4.3 / §1.3), a later refinement. This RPC changes nothing for existing
-- users; it only reads the new install_cta_events table, admin-gated.

CREATE OR REPLACE FUNCTION public.admin_install_cta_funnel()
RETURNS TABLE(
  target      text,
  placement   text,
  impressions bigint,
  clicks      bigint,
  dismisses   bigint,
  opens       bigint,
  last_seen   timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(e.target, '(unknown)')    AS target,
    COALESCE(e.placement, '(unknown)') AS placement,
    count(*) FILTER (WHERE e.event_type = 'impression')     AS impressions,
    count(*) FILTER (WHERE e.event_type = 'click')          AS clicks,
    count(*) FILTER (WHERE e.event_type = 'dismiss')        AS dismisses,
    count(*) FILTER (WHERE e.event_type = 'open_installed') AS opens,
    max(e.occurred_at)                                      AS last_seen
  FROM public.install_cta_events e
  WHERE public.is_admin(auth.uid())
  GROUP BY 1, 2
  ORDER BY impressions DESC, clicks DESC;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_install_cta_funnel() TO authenticated;
