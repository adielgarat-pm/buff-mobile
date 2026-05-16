# Track 5 — Lovable Response (2026-05-16)

> Captured verbatim from Lovable's reply to the export prompt.
> Source: chat handoff from Adi → CC, 2026-05-16.

---

## Lovable's SQL query (read-only)

```sql
-- BUFF parent migration export (one row per parent)
WITH parents AS (
  SELECT
    p.id            AS profile_id,
    p.user_id       AS parent_user_id,
    p.family_id,
    p.display_name  AS parent_display_name,
    p.preferred_language,
    p.is_pro,
    p.is_lifetime_access,
    p.marketing_consent,
    p.onboarding_step,
    u.email,
    u.created_at    AS signup_date
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.role = 'parent'
    AND u.email NOT ILIKE '%test%'
    AND u.email NOT ILIKE '%buffapp.%'
    AND u.email NOT ILIKE '%@example.com'
    AND u.email NOT ILIKE '%+test@%'
    AND COALESCE(p.display_name, '') NOT ILIKE '%test%'
    AND COALESCE(p.display_name, '') NOT ILIKE '%buffapp.%'
    AND COALESCE(p.display_name, '') NOT LIKE '%אקדא4%'
),
children AS (
  SELECT
    c.family_id,
    COUNT(*) AS children_count,
    STRING_AGG(REPLACE(REPLACE(c.display_name, ',', ' '), E'\n', ' '), ' | ' ORDER BY c.created_at) AS children_names,
    STRING_AGG(
      CASE WHEN c.birth_date IS NOT NULL
           THEN EXTRACT(YEAR FROM AGE(c.birth_date))::text
           ELSE '?' END,
      ' | ' ORDER BY c.created_at
    ) AS children_ages
  FROM public.profiles c
  WHERE c.role = 'child'
  GROUP BY c.family_id
),
task_counts    AS (SELECT family_id, COUNT(*) AS total_tasks_created    FROM public.tasks         GROUP BY family_id),
reward_counts  AS (SELECT family_id, COUNT(*) AS total_rewards_created  FROM public.store_rewards GROUP BY family_id),
credit_totals  AS (SELECT family_id, COALESCE(SUM(total_balance),0) AS total_credits_earned FROM public.credit_vault GROUP BY family_id),
sticker_counts AS (SELECT family_id, COUNT(*) AS total_stickers_earned  FROM public.stickers      GROUP BY family_id),
last_active AS (
  SELECT family_id, MAX(ts) AS last_active_date FROM (
    SELECT family_id, created_at AS ts FROM public.pwa_events       WHERE family_id IS NOT NULL
    UNION ALL
    SELECT family_id, created_at      FROM public.daily_progress
    UNION ALL
    SELECT family_id, created_at      FROM public.child_vibes
  ) x GROUP BY family_id
),
platform_pick AS (
  SELECT DISTINCT ON (family_id)
    family_id,
    CASE
      WHEN LOWER(COALESCE(os,'')) LIKE '%ios%'     OR LOWER(COALESCE(device_type,'')) LIKE '%ios%'     THEN 'ios'
      WHEN LOWER(COALESCE(os,'')) LIKE '%android%' OR LOWER(COALESCE(device_type,'')) LIKE '%android%' THEN 'android'
      WHEN os IS NOT NULL OR device_type IS NOT NULL                                                    THEN 'web'
      ELSE 'unknown'
    END AS platform
  FROM public.pwa_events
  WHERE family_id IS NOT NULL
  ORDER BY family_id, created_at DESC
)
SELECT
  p.email,
  REPLACE(REPLACE(p.parent_display_name, ',', ' '), E'\n', ' ') AS parent_display_name,
  p.parent_user_id,
  p.family_id,
  to_char(p.signup_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')           AS signup_date,
  to_char(la.last_active_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')     AS last_active_date,
  COALESCE(pl.platform, 'unknown')                               AS platform,
  p.preferred_language                                           AS language,
  COALESCE(ch.children_count, 0)                                 AS children_count,
  COALESCE(ch.children_names, '')                                AS children_names,
  COALESCE(ch.children_ages, '')                                 AS children_ages,
  COALESCE(tc.total_tasks_created, 0)                            AS total_tasks_created,
  COALESCE(rc.total_rewards_created, 0)                          AS total_rewards_created,
  COALESCE(cv.total_credits_earned, 0)                           AS total_credits_earned,
  COALESCE(sc.total_stickers_earned, 0)                          AS total_stickers_earned,
  (COALESCE(ch.children_count,0) > 0)                            AS has_completed_family_setup,
  (COALESCE(tc.total_tasks_created,0) > 0)                       AS has_created_first_task,
  (COALESCE(ch.children_count,0) > 0 AND COALESCE(tc.total_tasks_created,0) > 0) AS qualifies_per_prd_5_2,
  p.is_pro,
  p.is_lifetime_access,
  p.marketing_consent,
  p.onboarding_step
FROM parents p
LEFT JOIN children       ch ON ch.family_id = p.family_id
LEFT JOIN task_counts    tc ON tc.family_id = p.family_id
LEFT JOIN reward_counts  rc ON rc.family_id = p.family_id
LEFT JOIN credit_totals  cv ON cv.family_id = p.family_id
LEFT JOIN sticker_counts sc ON sc.family_id = p.family_id
LEFT JOIN last_active    la ON la.family_id = p.family_id
LEFT JOIN platform_pick  pl ON pl.family_id = p.family_id
ORDER BY p.signup_date ASC;
```

## Lovable's notes (verbatim)

**Omitted nice-to-haves (schema doesn't support):**
- `country` — not stored anywhere (no IP geo, no country column)
- `beta_survey_response` — no survey table exists
- `notes` / `admin_notes` — no such field on `profiles` or any related table
- `platform` approximated from `pwa_events.os` + `device_type` (no `user_agent` column on `push_subscriptions` or `pwa_events`). Newest pwa_event per family wins; falls back to `'unknown'`.

**Added columns Lovable thought useful:**
- `is_pro`, `is_lifetime_access` — already-flagged beta/lifetime users on Lovable
- `marketing_consent` — needed if planning to email the migration invite
- `onboarding_step` — quick proxy for "how far did they get"

**Row count:** 182 parent rows after exclusions (not the ~49 the prompt expected).

**Orphan children:** 0. Every `role='child'` profile has at least one `role='parent'` profile in the same `family_id`.

---

## CC analysis — the 182 vs 49 gap (read this before running)

The prompt told Lovable "should be ~49 per my records" — that figure came from CC memory (`project_lovable.md`: "49 users backed up"). Lovable returned **182 parents**. Three possible explanations:

1. **Memory is outdated.** "49 users" was the count at backup time; Lovable has grown since.
2. **Definition mismatch.** "49 users" may have meant a specific subset (qualifying beta users? lifetime-flagged?), not the entire parent universe.
3. **Lovable's exclusion filters caught fewer test accounts than expected.** Worth eyeballing.

**Implication for Track 5:** the cohort definition is now load-bearing. Granting lifetime access to 182 vs 49 is a 3.7x difference in who skips the paywall forever.

### Filter options Adi can pick

| Filter | Estimated rows | Rationale |
|---|---|---|
| **No filter** (everyone in CSV) | 182 | Maximally generous. Includes ghost accounts who signed up and never used the app. |
| `qualifies_per_prd_5_2 = true` | TBD — likely much smaller | Strictly PRD §5.2: completed family setup + created ≥1 task. |
| `is_lifetime_access = true` (already-flagged on Lovable) | TBD | Honors Lovable's existing founder decisions. Smallest, safest subset. |
| `qualifies_per_prd_5_2 = true OR is_lifetime_access = true` | TBD | PRD criteria PLUS anyone Lovable already manually flagged. **CC recommends this.** |
| `last_active_date >= NOW() - INTERVAL '90 days'` | TBD | Active users only. Filters dormant accounts. |
| Combination of qualifies + active | TBD | Tightest defensible cohort. |

### CC recommendation

**Run Lovable's query as-is** (all 182 rows in the CSV), download it, save locally. Then **CC filters in-memory** before applying the UPDATE — that way:
- The raw export is preserved for audit
- You can eyeball the cohort breakdown before approving Phase 2
- We don't re-trip to Lovable if you want to adjust

This means Q2 ("trust CSV blindly") gets a small amendment: trust the CSV's *contents* blindly, but filter on the boolean columns Lovable provided. CC will surface the row counts for each filter option in the Phase 1 gap report so you pick from data, not vibes.

---

## Next step

If Adi agrees: run Lovable's SQL → download CSV → save as `docs/sessions/beta-2026-06-01/TRACK_5_cohort.csv` (already gitignored) → tell CC "CSV saved" → CC reads it and produces the Phase 1 gap report with row counts per filter option, no UPDATE yet.

If Adi wants a tighter SQL filter at Lovable's side instead, say so and CC will draft the filtered variant.
