-- acquisition-by-source.sql — where new families actually come from.
--
-- The capture (src/lib/acquisitionCapture.web.ts) writes families.acquisition_source
-- from utm_source / referrer at family_created. Until outbound links carry a
-- utm_source (see docs/sessions/acquisition-attribution-activation/UTM_PLAYBOOK.md)
-- everything reads 'organic'. Run these after tagging to see the split.

-- ── 1. New families by source (last 14 days) ────────────────────────────────
select
  coalesce(acquisition_source, '(null)') as source,
  count(*)                               as families
from families
where created_at >= now() - interval '14 days'
group by 1
order by 2 desc;

-- ── 2. Source × country × platform ──────────────────────────────────────────
select
  coalesce(acquisition_source, '(null)') as source,
  coalesce(acquisition_country, '(null)') as country,
  coalesce(platform, '(null)')           as platform,
  count(*)                               as families
from families
where created_at >= now() - interval '30 days'
group by 1, 2, 3
order by families desc;

-- ── 3. Success metric: % of new families with a real (non-organic) source ───
-- Target ≥ 80% within 2 weeks of tagging. Near 0 ⇒ tags aren't reaching the
-- first-touch capture (the exact failure mode of the dead #345 plumbing).
select
  count(*) filter (where acquisition_source is not null
                     and acquisition_source not in ('organic'))::float
    / nullif(count(*), 0) as pct_attributed,
  count(*)                as new_families
from families
where created_at >= now() - interval '14 days';
