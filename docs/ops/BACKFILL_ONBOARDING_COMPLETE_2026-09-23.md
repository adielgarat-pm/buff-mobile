# Data fix — onboarding_complete backfill (2026-09-23)

**Approved by:** Adi, 2026-09-23 (explicit, in session).
**Project:** buff-production (`gfrongfnyigxsexuofrg`), table `public.profiles`.

## Why
Routing sends a parent to the app only when `pro_settings.onboarding_complete = true` AND the family has a child (`src/navigation/parentRouting.ts` `isParentOnboarded`). 26 parents had ≥1 child but no flag — mostly Lovable-era accounts (created Jan–Feb 2026) plus parents who created a child mid-wizard and left. After logging in they landed on the onboarding "Let's start" screen instead of their children and tasks. The routing rule itself can't be loosened safely, because a new parent mid-wizard also has a child before the flag is set.

## What was changed
For exactly 26 parent profiles (ids listed in the session; selection = role parent, not deleted, family has ≥1 non-deleted child, flag not true, none active in the last 7 days):

```sql
pro_settings = coalesce(pro_settings,'{}') || {"onboarding_complete": true, "onboarding_complete_backfilled_at": "2026-09-23"}
```

All 26 had no prior `onboarding_complete` value. Entitlement columns untouched (`guard_profile_entitlement_columns` not involved).

## Verification
After the update: 0 parents with children and no flag; 26 rows carry the backfill marker.

## Rollback
```sql
UPDATE public.profiles
SET pro_settings = pro_settings - 'onboarding_complete' - 'onboarding_complete_backfilled_at'
WHERE pro_settings ? 'onboarding_complete_backfilled_at';
```

## Note
Two of the 26 are internal accounts (the founder's web test family and the Apple review account); fixing them is harmless. Parents who abandoned the wizard after creating a child now land in the app with their child and starter tasks, instead of restarting the wizard (which could have created a duplicate child).
