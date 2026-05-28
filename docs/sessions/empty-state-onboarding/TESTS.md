# TESTS — pkg/empty-state-onboarding

## Automated (CC env — all green 2026-05-28)
- [x] `npm run typecheck` — clean (exit 0).
- [x] `npm test` — 250 tests, 20 suites pass. (First run had 2 flaky 5s timeouts in
      `EditChildScreen.test.tsx`, a file not touched here; green on re-run.)
- [x] `npm run i18n:check` — all static keys resolve in en.json + he.json.
- [x] Values check passed for this phase (see SPEC.md).

## Supabase validation (read-only, done 2026-05-28)
- [x] Schema: `tasks.assigned_to` is the child link; `pro_settings->>'age_group'` is the age source.
- [x] Empty-state trigger exists: 0-task children present, incl. **"Itay"** in the demo
      family `37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8` (child id `55c2300c-2d3b-4a8e-bd9f-0b2279707457`).
- [x] Finding: only **3 of ~90** children have `age_group` → the UStep1 fallback is the
      common path, not an edge case.

## Hat-4 — device/emulator (Adi; auth-gated, can't run headless)

### Path A — age-less child (the common path) → UStep1 fallback
Test child: **Itay** (demo family, 0 tasks, no age_group).
1. Parent app → Tasks tab → select Itay → empty state shows title + body + "Set up tasks for Itay".
2. Tap CTA → lands on **UStep1** with the name prefilled.
3. Pick age + goal + (optional) challenges + motivator → Loading → UStep5 preview.
4. UStep5 CTA reads **"See Itay's tasks"** (no Skip button) → tap → returns to Tasks tab.
5. Tasks now appear for Itay.

### Path B — age-present child → UStep2_Goal direct
No 0-task child currently has `age_group`. To exercise this branch, temporarily set one
(then revert), e.g. on a spare 0-task child:
```sql
update profiles set pro_settings = jsonb_set(coalesce(pro_settings,'{}'::jsonb),'{age_group}','"9-11"')
where id = '<spare-0-task-child-id>';
```
Expect: CTA lands directly on **UStep2_Goal** (skips UStep1).

### Duplicate-profile guard (the critical check) — run before & after the flow
```sql
-- BEFORE: note the count
select count(*) as child_count
from profiles
where family_id = '37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8' and role = 'child';

-- AFTER the flow: count MUST be unchanged (no new profile)
-- and tasks MUST be attached to the SAME existing child id:
select count(*) as itay_tasks
from tasks
where assigned_to = '55c2300c-2d3b-4a8e-bd9f-0b2279707457';   -- expect > 0
```
PASS = child_count identical before/after AND itay_tasks > 0.
FAIL = a second "Itay" profile appears OR tasks attached to a new id.
